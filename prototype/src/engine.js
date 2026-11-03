// RefillAhead planning engine.
// Pure functions only (no DOM, no network) so the same logic runs in the
// browser, in Node tests, and later on a server or inside a DHIS2/OpenMRS app.
//
// Core question it answers: "A disruption is coming. Which chronic-care
// patients will run out of medicine before they can reach care again, and what
// is the cheapest safe action that keeps each of them on treatment?"

export const DAY_MS = 86400000;

// Default clinical rules. These are configurable defaults, NOT clinical advice.
// Each deployment must validate them against national guidelines with a
// clinical lead. Sources for the defaults are listed in research/RESEARCH.md.
export const DEFAULT_RULES = {
  HIV: {
    label: 'HIV (ART)',
    drug: 'TLD',
    drugLabel: 'TLD (tenofovir/lamivudine/dolutegravir)',
    unit: 'tablet',
    unitsPerDay: 1,
    packDays: 30,
    // WHO: people established on ART should be offered 3-6 month refills.
    maxDays: 180,
    // Not yet established (< 6 months on ART, or not stable): short bridge only.
    maxDaysNotEstablished: 60,
    severity: 3,
    why: 'Missing ART for even a few days risks viral rebound and drug resistance.',
  },
  TB: {
    label: 'Tuberculosis',
    drug: 'HRZE',
    drugLabel: 'TB fixed-dose combination',
    unit: 'tablet',
    unitsPerDay: 4,
    packDays: 28,
    maxDays: 56,
    severity: 4,
    alwaysReview: true,
    why: 'Interrupted TB treatment drives relapse and drug-resistant TB.',
  },
  INS: {
    label: 'Diabetes (insulin)',
    drug: 'INSULIN',
    drugLabel: 'Insulin 10 mL vial (U-100)',
    unit: 'vial',
    unitsPerDay: 0.04, // ~40 IU/day from a 1000 IU vial
    packDays: 28,
    maxDays: 56,
    severity: 4,
    storage: true,
    why: 'Without insulin, people with type 1 diabetes can develop ketoacidosis within days.',
  },
  EPI: {
    label: 'Epilepsy',
    drug: 'CBZ200',
    drugLabel: 'Carbamazepine 200 mg',
    unit: 'tablet',
    unitsPerDay: 2,
    packDays: 30,
    maxDays: 90,
    severity: 3,
    why: 'Abrupt withdrawal of anti-seizure medicine can trigger prolonged seizures.',
  },
  HTN: {
    label: 'Hypertension',
    drug: 'AMLO5',
    drugLabel: 'Amlodipine 5 mg',
    unit: 'tablet',
    unitsPerDay: 1,
    packDays: 30,
    maxDays: 90,
    severity: 2,
    why: 'Uncontrolled blood pressure after disasters raises stroke and heart-attack risk.',
  },
  DM: {
    label: 'Diabetes (oral)',
    drug: 'MET500',
    drugLabel: 'Metformin 500 mg',
    unit: 'tablet',
    unitsPerDay: 2,
    packDays: 30,
    maxDays: 90,
    severity: 2,
    why: 'Glycaemic control deteriorates for months after floods without medicine.',
  },
};

export const DEFAULT_SETTINGS = {
  bufferDays: 7, // safety margin after access is expected to return
  pickupMarginDays: 1, // last safe pickup day is this many days before onset
  maxWalkKm: 12, // beyond this, plan a community health worker (CHW) delivery
  reserveDays: 30, // stock each facility keeps back for routine patients
};

export const ACTION_LABELS = {
  early_refill: 'Early refill at clinic',
  chw_delivery: 'CHW home delivery',
  reroute: 'Reroute to open clinic',
  outreach: 'Outreach after onset',
  none: 'No action needed',
};

// ---------- small utilities ----------

export function parseDate(s) {
  if (s instanceof Date) return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) throw new Error(`Invalid date "${s}" (expected YYYY-MM-DD)`);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCMonth() !== +m[2] - 1) throw new Error(`Invalid date "${s}"`);
  return d;
}

export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}

export function diffDays(a, b) {
  // whole days from b to a (a - b)
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function indexBy(list, key = 'id') {
  const m = new Map();
  for (const x of list) m.set(x[key], x);
  return m;
}

// ---------- eligibility ----------

// Longest supply this patient may safely receive in one dispensing, plus any
// reasons a clinician should review the plan before it is executed.
export function supplyCap(patient, rule) {
  const review = [];
  let cap = rule.maxDays;
  if (rule.alwaysReview) review.push('Treatment supporter / video-observed therapy needed for extended TB supply');
  if (rule.maxDaysNotEstablished != null) {
    const established = (patient.monthsOnTreatment ?? 0) >= 6 && patient.stable !== false;
    if (!established) {
      cap = Math.min(cap, rule.maxDaysNotEstablished);
      review.push('Not yet established on treatment: bridging supply only');
    }
  }
  if (patient.ageYears != null && patient.ageYears < 2) {
    cap = Math.min(cap, 30);
    review.push('Child under 2: dosing changes with weight');
  }
  if (patient.pregnant) review.push('Pregnant: confirm antenatal follow-up plan');
  if (rule.storage) review.push('Counsel on cool storage (clay-pot cooler) during heat or power cuts');
  return { cap, review };
}

// ---------- the planner ----------

/**
 * Plan anticipatory actions for one disruption event.
 *
 * @param {object} input
 * @param {string|Date} input.today
 * @param {object} input.event { id, type, title, onset, durationDays, affectedVillageIds, affectedFacilityIds, permanent }
 * @param {Array} input.facilities [{ id, name, lat, lon, status, stock: { DRUG: units } }]
 * @param {Array} input.villages [{ id, name, lat, lon }]
 * @param {Array} input.patients [{ id, villageId, facilityId, condition, lastRefill, daysSupplied, ... }]
 */
export function planEvent({ today, event, facilities, villages, patients, rules = DEFAULT_RULES, settings = {} }) {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  const t0 = parseDate(today);
  const onset = parseDate(event.onset);
  const windowEnd = addDays(onset, event.durationDays);
  const needUntil = addDays(windowEnd, cfg.bufferDays);
  const leadDays = diffDays(onset, t0);
  const pickupDeadline = addDays(onset, -cfg.pickupMarginDays);

  const fac = indexBy(facilities);
  const vil = indexBy(villages);
  const affV = new Set(event.affectedVillageIds || []);
  const affF = new Set(event.affectedFacilityIds || []);

  // Facilities that will still be usable during and after the event.
  const safeFacilities = facilities.filter((f) => f.status !== 'closed' && !affF.has(f.id));

  const nearestSafe = (point) => {
    let best = null;
    for (const f of safeFacilities) {
      const km = haversineKm(point, f);
      if (!best || km < best.km) best = { facility: f, km };
    }
    return best;
  };

  const actions = [];
  const unaffected = [];
  const errors = [];

  for (const p of patients) {
    const rule = rules[p.condition];
    const village = vil.get(p.villageId);
    const home = fac.get(p.facilityId);
    if (!rule || !village || !home) {
      errors.push({ patientId: p.id, error: !rule ? `Unknown condition ${p.condition}` : !village ? `Unknown village ${p.villageId}` : `Unknown facility ${p.facilityId}` });
      continue;
    }

    const villageExposed = affV.has(village.id);
    const homeDisrupted = affF.has(home.id);
    if (!villageExposed && !homeDisrupted) {
      unaffected.push(p.id);
      continue;
    }

    const runOut = addDays(parseDate(p.lastRefill), p.daysSupplied);
    const gapDays = diffDays(needUntil, runOut);
    const overdue = runOut < t0;

    if (gapDays <= 0 && !(homeDisrupted && event.permanent)) {
      actions.push({
        patientId: p.id,
        patient: p,
        condition: p.condition,
        villageExposed,
        homeDisrupted,
        runOut: fmtDate(runOut),
        gapDays: 0,
        action: 'none',
        dispenseDays: 0,
        units: 0,
        residualGapDays: 0,
        covered: true,
        priority: 0,
        tier: 'covered',
        reasons: ['Current supply already lasts beyond the disruption window'],
        review: [],
      });
      continue;
    }

    // Where can this patient get medicine before onset?
    // Before onset, the home facility still works unless it is already closed.
    const homeUsableNow = home.status !== 'closed';
    const pickup = homeUsableNow ? { facility: home, km: haversineKm(village, home) } : nearestSafe(village);
    let action = 'early_refill';

    // After a permanent closure the patient needs a new home facility: the
    // primary action becomes a reroute, with a bridging supply if needed.
    let newHome = null;
    if (homeDisrupted && event.permanent) {
      newHome = nearestSafe(village);
      action = 'reroute';
    }

    if (!pickup) {
      // Nowhere to collect: everything nearby is closed or exposed.
      action = 'outreach';
    } else if (leadDays < cfg.pickupMarginDays) {
      // Too late for the patient to travel; bring medicine to them if possible.
      action = 'outreach';
    } else if (p.mobilityLimited || pickup.km > cfg.maxWalkKm) {
      action = 'chw_delivery';
    }

    const { cap, review } = supplyCap(p, rule);
    const needDays = Math.max(gapDays, 0);
    const rounded = Math.ceil(needDays / rule.packDays) * rule.packDays;
    const dispenseDays = Math.min(cap, rounded);
    const residualGapDays = Math.max(0, needDays - dispenseDays);
    const units = Math.ceil(dispenseDays * rule.unitsPerDay);

    // ---- priority: transparent, additive, explainable ----
    const reasons = [];
    let score = rule.severity * 10;
    reasons.push(`${rule.label}: ${rule.why}`);
    const gapPts = Math.min(needDays, 60) / 4;
    score += gapPts;
    if (needDays > 0) reasons.push(`Would run out ${needDays} days before access returns`);
    if (overdue) {
      score += 8;
      reasons.push(`Already overdue: supply ran out on ${fmtDate(runOut)}`);
    }
    if (leadDays <= 2) {
      score += 8;
      reasons.push(`Only ${Math.max(leadDays, 0)} day(s) of lead time`);
    } else if (leadDays <= 4) {
      score += 4;
    }
    if (p.pregnant) {
      score += 5;
      reasons.push('Pregnant');
    }
    if (p.ageYears != null && (p.ageYears < 5 || p.ageYears >= 70)) {
      score += 4;
      reasons.push(p.ageYears < 5 ? 'Young child' : 'Older adult');
    }
    if ((p.missedVisits12m ?? 0) >= 2) {
      score += 4;
      reasons.push(`${p.missedVisits12m} missed visits in last 12 months`);
    }
    if (p.mobilityLimited) {
      score += 3;
      reasons.push('Limited mobility');
    }
    if (newHome) {
      reasons.push(`Home clinic closes ${event.onset}: re-link care at ${newHome.facility.name} (${Math.round(newHome.km)} km)`);
    }
    if (residualGapDays > 0) {
      score += 3;
      reasons.push(`Supply cap leaves ${residualGapDays} days uncovered: plan follow-up delivery`);
    }

    const priority = Math.round(score);
    const tier = priority >= 45 ? 'critical' : priority >= 30 ? 'high' : 'routine';

    actions.push({
      patientId: p.id,
      patient: p,
      condition: p.condition,
      villageExposed,
      homeDisrupted,
      runOut: fmtDate(runOut),
      overdue,
      gapDays: needDays,
      action,
      pickupFacilityId: pickup?.facility.id ?? null,
      pickupKm: pickup ? Math.round(pickup.km * 10) / 10 : null,
      newHomeFacilityId: newHome?.facility.id ?? null,
      newHomeKm: newHome ? Math.round(newHome.km * 10) / 10 : null,
      deadline: fmtDate(pickupDeadline),
      dispenseDays,
      units,
      residualGapDays,
      covered: residualGapDays === 0,
      priority,
      tier,
      reasons,
      review,
    });
  }

  actions.sort((a, b) => b.priority - a.priority || a.patientId.localeCompare(b.patientId));

  const stock = planStock({ actions, facilities, patients, rules, cfg, affF, unaffected });
  const summary = summarize({ actions, unaffected, stock, patients, event, leadDays, windowEnd, needUntil });

  return {
    event,
    today: fmtDate(t0),
    leadDays,
    windowEnd: fmtDate(windowEnd),
    needUntil: fmtDate(needUntil),
    pickupDeadline: fmtDate(pickupDeadline),
    actions,
    stock,
    summary,
    errors,
  };
}

// ---------- stock pre-positioning ----------

function planStock({ actions, facilities, patients, rules, cfg, affF, unaffected }) {
  const fac = indexBy(facilities);
  const unaffectedSet = new Set(unaffected);

  // Routine reserve: medicine kept back for patients who are not in the plan.
  const reserve = new Map(); // facilityId -> {drug: units}
  for (const p of patients) {
    if (!unaffectedSet.has(p.id)) continue;
    const rule = rules[p.condition];
    if (!rule) continue;
    const r = reserve.get(p.facilityId) || {};
    r[rule.drug] = (r[rule.drug] || 0) + rule.unitsPerDay * cfg.reserveDays;
    reserve.set(p.facilityId, r);
  }

  // Extra demand created by the plan, at the facility that dispenses.
  const demand = new Map();
  for (const a of actions) {
    if (!a.pickupFacilityId || a.units <= 0) continue;
    const drug = rules[a.condition].drug;
    const d = demand.get(a.pickupFacilityId) || {};
    d[drug] = (d[drug] || 0) + a.units;
    demand.set(a.pickupFacilityId, d);
  }

  const drugs = [...new Set(Object.values(rules).map((r) => r.drug))];
  const rows = [];
  for (const f of facilities) {
    for (const drug of drugs) {
      const onHand = f.stock?.[drug] ?? 0;
      const res = Math.ceil(reserve.get(f.id)?.[drug] ?? 0);
      const dem = demand.get(f.id)?.[drug] ?? 0;
      const balance = onHand - res - dem;
      if (onHand === 0 && dem === 0) continue;
      rows.push({
        facilityId: f.id,
        drug,
        onHand,
        reserve: res,
        demand: dem,
        balance,
        disrupted: affF.has(f.id),
        closed: f.status === 'closed',
      });
    }
  }

  // Greedy transfers: cover each shortfall from the nearest safe facility with surplus.
  const transfers = [];
  const surplus = new Map(rows.filter((r) => r.balance > 0 && !r.disrupted && !r.closed).map((r) => [`${r.facilityId}|${r.drug}`, r.balance]));
  const shortRows = rows.filter((r) => r.balance < 0).sort((a, b) => a.balance - b.balance);
  for (const s of shortRows) {
    let need = -s.balance;
    const to = fac.get(s.facilityId);
    const donors = rows
      .filter((r) => r.drug === s.drug && r.facilityId !== s.facilityId && (surplus.get(`${r.facilityId}|${r.drug}`) ?? 0) > 0)
      .map((r) => ({ r, km: haversineKm(fac.get(r.facilityId), to) }))
      .sort((a, b) => a.km - b.km);
    for (const { r, km } of donors) {
      if (need <= 0) break;
      const key = `${r.facilityId}|${r.drug}`;
      const avail = surplus.get(key);
      const qty = Math.min(avail, need);
      surplus.set(key, avail - qty);
      need -= qty;
      transfers.push({ drug: s.drug, fromFacilityId: r.facilityId, toFacilityId: s.facilityId, units: qty, km: Math.round(km * 10) / 10 });
    }
    if (need > 0) transfers.push({ drug: s.drug, fromFacilityId: null, toFacilityId: s.facilityId, units: need, km: null, note: 'Request from district / central medical store' });
  }

  // Stock sitting in facilities that will flood or close: dispense it or move it out.
  const atRisk = rows
    .filter((r) => (r.disrupted || r.closed) && r.onHand - r.demand > 0)
    .map((r) => ({ facilityId: r.facilityId, drug: r.drug, units: r.onHand - r.demand }));

  return { rows, transfers, atRisk };
}

// ---------- summary ----------

function summarize({ actions, unaffected, stock, patients, event, leadDays, windowEnd, needUntil }) {
  const needing = actions.filter((a) => a.action !== 'none');
  const byAction = {};
  const byCondition = {};
  const byTier = { critical: 0, high: 0, routine: 0 };
  for (const a of needing) {
    byAction[a.action] = (byAction[a.action] || 0) + 1;
    byCondition[a.condition] = (byCondition[a.condition] || 0) + 1;
    byTier[a.tier] = (byTier[a.tier] || 0) + 1;
  }
  return {
    totalPatients: patients.length,
    exposedPatients: actions.length,
    unaffectedPatients: unaffected.length,
    needingAction: needing.length,
    alreadyCovered: actions.length - needing.length,
    fullyCoverableByPlan: needing.filter((a) => a.covered).length,
    partialCoverage: needing.filter((a) => !a.covered).length,
    needsClinicalReview: needing.filter((a) => a.review.length > 0).length,
    overdue: needing.filter((a) => a.overdue).length,
    treatmentDaysProtected: needing.reduce((s, a) => s + Math.min(a.dispenseDays, a.gapDays), 0),
    stockShortfalls: stock.rows.filter((r) => r.balance < 0).length,
    transfers: stock.transfers.length,
    byAction,
    byCondition,
    byTier,
    leadDays,
    windowEnd: windowEnd.toISOString().slice(0, 10),
    needUntil: needUntil.toISOString().slice(0, 10),
    eventType: event.type,
  };
}

// ---------- follow-up / tracing ----------

export const STATUS = ['pending', 'notified', 'collected', 'delivered', 'missed', 'traced'];

/**
 * After the pickup deadline, anyone still pending/notified must be traced.
 * statuses: { patientId: status }
 */
export function followUp(plan, statuses, today) {
  const t = parseDate(today);
  const deadlinePassed = t > parseDate(plan.pickupDeadline);
  const needing = plan.actions.filter((a) => a.action !== 'none');
  const counts = Object.fromEntries(STATUS.map((s) => [s, 0]));
  const trace = [];
  for (const a of needing) {
    const s = statuses[a.patientId] || 'pending';
    counts[s] = (counts[s] || 0) + 1;
    const reached = s === 'collected' || s === 'delivered' || s === 'traced';
    if (!reached && (deadlinePassed || s === 'missed')) trace.push(a);
  }
  const reached = counts.collected + counts.delivered + counts.traced;
  return {
    deadlinePassed,
    counts,
    reached,
    total: needing.length,
    coveragePct: needing.length ? Math.round((reached / needing.length) * 100) : 100,
    trace,
  };
}
