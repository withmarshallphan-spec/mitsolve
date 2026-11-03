import { planEvent, followUp, DEFAULT_RULES, DEFAULT_SETTINGS, ACTION_LABELS, STATUS, haversineKm, fmtDate, addDays, parseDate } from './engine.js';
import { buildScenario, presetEvents, DISTRICT, mulberry32 } from './scenario.js';
import { renderMessage, smsSegments, LANGUAGES } from './messages.js';
import { checkLive, draftEventFromHits } from './forecast.js';
import { toCSV, importPatients, patientsToRows, PATIENT_COLUMNS } from './csv.js';
import { renderMap } from './map.js';

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clone = (x) => JSON.parse(JSON.stringify(x));
const fmtShort = (iso) => {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  } catch {
    return iso;
  }
};
const nf = new Intl.NumberFormat('en');
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STORE_KEY = 'refillahead:v1';
function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch {
    return null;
  }
}
function saveStore() {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        today: state.today,
        eventKey: state.eventKey,
        event: state.event,
        statuses: state.statuses,
        rules: state.rules,
        settings: state.settings,
        importedPatients: state.importedPatients,
        tab: state.tab,
      }),
    );
  } catch {
    /* storage unavailable (private mode, quota): app still works for this session */
  }
}

const ICONS = {
  cyclone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9c2 0 2-2 4.5-2S10 9 12 9s2-2 4.5-2S19 9 21 9"/><path d="M3 14c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/><path d="M3 19c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2"/></svg>',
  closure: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M12 8v5M9.5 10.5h5"/><path d="M3 3l18 18"/></svg>',
  heat: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  live: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></svg>',
};

// ---------- state ----------
const today = localToday();
const stored = loadStore();
const freshDay = !stored || stored.today !== today; // demo data is regenerated relative to today
const scenario = buildScenario(today);
const presets = presetEvents(today);

const state = {
  today,
  eventKey: (!freshDay && stored?.eventKey) || 'cyclone',
  event: (!freshDay && stored?.event) || clone(presets.cyclone),
  statuses: (!freshDay && stored?.statuses) || {},
  rules: stored?.rules || clone(DEFAULT_RULES),
  settings: { ...DEFAULT_SETTINGS, ...(stored?.settings || {}) },
  importedPatients: (!freshDay && stored?.importedPatients) || null,
  tab: stored?.tab || 'actions',
  editMode: false,
  filters: { q: '', condition: '', action: 'needs', facility: '', tier: '' },
  expanded: new Set(),
  showAll: false,
  simulateAfter: false,
  live: { loading: false, results: null, error: null },
  importErrors: [],
};

const facById = new Map(scenario.facilities.map((f) => [f.id, f]));
const vilById = new Map(scenario.villages.map((v) => [v.id, v]));
const patients = () => state.importedPatients || scenario.patients;
const statusesFor = () => (state.statuses[state.event.id] ||= {});
let plan = null;

function computePlan() {
  plan = planEvent({
    today: state.today,
    event: state.event,
    facilities: scenario.facilities,
    villages: scenario.villages,
    patients: patients(),
    rules: state.rules,
    settings: state.settings,
  });
}

// ---------- rendering ----------
function renderScenarios() {
  const cards = [
    { key: 'cyclone', icon: 'cyclone', t: 'Cyclone + floods', d: 'Landfall in 4 days, lowlands cut off ~3 weeks' },
    { key: 'closure', icon: 'closure', t: 'Clinic closures', d: 'Funding cut closes 2 NGO health posts in 10 days' },
    { key: 'heat', icon: 'heat', t: 'Heatwave', d: '10 days above 40 °C, power cuts' },
    { key: 'live', icon: 'live', t: 'Check live forecast', d: '16-day rain, heat and river forecast for this district' },
  ];
  $('#scenario-grid').innerHTML = cards
    .map(
      (c) => `<button type="button" class="scenario" role="radio" aria-checked="${state.eventKey === c.key}" data-scenario="${c.key}">
        <span class="ico ico-${c.icon}">${ICONS[c.icon]}</span>
        <span><span class="t">${esc(c.t)}</span><br><span class="d">${esc(c.d)}</span></span>
      </button>`,
    )
    .join('');
}

function renderEvent() {
  const e = state.event;
  const el = $('#event-card');
  el.className = `event-card type-${e.type === 'cyclone' || e.type === 'flood' ? 'flood' : e.type}`;
  const lead = plan.leadDays;
  const live = state.live;
  let liveHtml = '';
  if (state.eventKey === 'live') {
    if (live.loading) liveHtml = `<p><b>Checking live forecasts for ${scenario.facilities.length + scenario.villages.length} locations…</b></p>`;
    else if (live.error) liveHtml = `<p class="neg">${esc(live.error)}</p>`;
    else if (live.results) {
      const ok = live.results.filter((r) => r.ok);
      const hits = live.results.filter((r) => r.hits.length);
      const maxRain = Math.max(0, ...ok.map((r) => r.summary?.maxRain3Day ?? 0));
      const maxT = Math.max(-99, ...ok.map((r) => r.summary?.maxTemp ?? -99));
      liveHtml = `<p class="small">Live check: ${ok.length}/${live.results.length} locations answered · wettest 3-day total ${maxRain.toFixed(0)} mm · hottest day ${maxT > -99 ? maxT.toFixed(0) + ' °C' : 'n/a'} · ${hits.length ? `<b>${hits.length} location(s) triggered</b>` : '<b>no triggers</b> in the forecast window, so nothing needs to happen yet.'}</p>`;
    }
  }
  const affV = e.affectedVillageIds?.length || 0;
  const affF = e.affectedFacilityIds?.length || 0;
  el.innerHTML = `
    <div>
      <h2>${esc(e.title)}</h2>
      <p>${esc(e.description || '')}</p>
      ${liveHtml}
      <div class="event-meta">
        <span>Source: <b>${esc(e.source || 'Manual entry')}</b></span>
        <span>Onset: <b>${fmtShort(e.onset)}</b></span>
        <span>Access back: <b>${fmtShort(plan.windowEnd)}</b></span>
        <span>Last safe pickup: <b>${fmtShort(plan.pickupDeadline)}</b></span>
        <span>Area: <b>${affV} villages, ${affF} facilities</b></span>
      </div>
    </div>
    <div class="countdown" aria-label="Days until onset">
      <div class="n">${lead > 0 ? lead : 0}</div>
      <div class="l">${lead > 0 ? `day${lead === 1 ? '' : 's'} to act` : 'event started'}</div>
    </div>
    <div class="event-controls">
      <label>Onset date<input type="date" id="ev-onset" value="${esc(e.onset)}" min="${esc(state.today)}"></label>
      <label>Access lost for (days)<input type="number" id="ev-duration" min="1" max="365" value="${e.durationDays}"></label>
      <label>Type<select id="ev-type">
        ${['cyclone', 'flood', 'heat', 'closure', 'conflict', 'outbreak'].map((t) => `<option value="${t}" ${t === e.type ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
      </select></label>
      <label style="flex-direction:row;align-items:center;gap:6px;min-height:36px"><input type="checkbox" id="ev-permanent" ${e.permanent ? 'checked' : ''}> Facilities close permanently</label>
    </div>`;
}

function renderKpis() {
  const s = plan.summary;
  const fu = followUp(plan, statusesFor(), viewDate());
  const shortfalls = s.stockShortfalls;
  $('#kpis').innerHTML = [
    { v: s.needingAction, l: 'patients would run out', s: `of ${s.exposedPatients} chronic-care patients in the area`, cls: 'k-critical' },
    { v: s.byTier.critical || 0, l: 'critical priority', s: 'TB, insulin, ART gaps, pregnancy…' },
    { v: nf.format(s.treatmentDaysProtected), l: 'treatment-days protected', s: 'if every action in the plan is completed' },
    { v: `${fu.coveragePct}%`, l: 'reached so far', s: `${fu.reached} of ${fu.total} collected or delivered`, cls: 'k-ok' },
    { v: plan.stock.transfers.length, l: 'stock transfers', s: shortfalls ? `${shortfalls} shortfall${shortfalls > 1 ? 's' : ''} to cover before onset` : 'no shortfalls' },
  ]
    .map((k) => `<div class="kpi ${k.cls || ''}"><div class="v">${esc(k.v)}</div><div class="l">${esc(k.l)}</div><div class="s">${esc(k.s)}</div></div>`)
    .join('');
}

function renderMapCard() {
  const stats = new Map();
  for (const p of patients()) {
    const st = stats.get(p.villageId) || { total: 0, atRisk: 0 };
    st.total++;
    stats.set(p.villageId, st);
  }
  for (const a of plan.actions) if (a.action !== 'none') stats.get(a.patient.villageId).atRisk++;
  $('#map').innerHTML = renderMap({
    facilities: scenario.facilities,
    villages: scenario.villages,
    river: DISTRICT.river,
    event: state.event,
    villageStats: stats,
    editMode: state.editMode,
  });
  $('#edit-area-btn').setAttribute('aria-pressed', String(state.editMode));
  $('#edit-area-btn').textContent = state.editMode ? 'Done editing' : 'Edit area';
  $('#edit-hint').hidden = !state.editMode;
}

function renderTabs() {
  const counts = {
    actions: plan.summary.needingAction,
    stock: plan.stock.transfers.length,
    messages: plan.actions.filter((a) => a.action !== 'none').length,
    follow: followUp(plan, statusesFor(), viewDate()).trace.length,
  };
  document.querySelectorAll('.tabs [role=tab]').forEach((b) => {
    const sel = b.dataset.tab === state.tab;
    b.setAttribute('aria-selected', String(sel));
    b.tabIndex = sel ? 0 : -1;
    const base = b.textContent.replace(/\s*\d+$/, '');
    const c = counts[b.dataset.tab];
    b.innerHTML = `${esc(base)}${c != null ? ` <span class="count">${c}</span>` : ''}`;
  });
  $('#panel').setAttribute('aria-labelledby', `tab-${state.tab}`);
}

function facName(id, short = false) {
  const f = facById.get(id);
  if (!f) return '—';
  return short ? f.name.replace(/ (Health Centre|Health Post|District Hospital|Clinic)$/, '') : f.name;
}

function actionDetail(a) {
  const rule = state.rules[a.condition];
  const supply = a.dispenseDays ? `${a.dispenseDays} d (${nf.format(a.units)} ${rule.unit}${a.units === 1 ? '' : 's'})` : 'no extra supply';
  switch (a.action) {
    case 'early_refill':
      return `at ${esc(facName(a.pickupFacilityId, true))} (${a.pickupKm} km) by ${fmtShort(a.deadline)} · ${supply}`;
    case 'chw_delivery':
      return `from ${esc(facName(a.pickupFacilityId, true))} by ${fmtShort(a.deadline)} · ${supply}`;
    case 'reroute':
      return `new clinic: ${esc(facName(a.newHomeFacilityId, true))} (${a.newHomeKm} km)${a.dispenseDays ? ` · bridge ${supply} at ${esc(facName(a.pickupFacilityId, true))}` : ''}`;
    case 'outreach':
      return `deliver as soon as safe · ${supply}`;
    default:
      return 'current supply lasts';
  }
}

function filteredActions() {
  const f = state.filters;
  const q = f.q.trim().toLowerCase();
  return plan.actions.filter((a) => {
    if (f.action === 'needs' ? a.action === 'none' : f.action && a.action !== f.action) return false;
    if (f.condition && a.condition !== f.condition) return false;
    if (f.tier && a.tier !== f.tier) return false;
    if (f.facility && a.pickupFacilityId !== f.facility && a.patient.facilityId !== f.facility) return false;
    if (q) {
      const v = vilById.get(a.patient.villageId)?.name || '';
      if (!a.patientId.toLowerCase().includes(q) && !v.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function statusSelect(pid) {
  const cur = statusesFor()[pid] || 'pending';
  return `<select class="status" data-status="${esc(pid)}" aria-label="Status for ${esc(pid)}">${STATUS.map((s) => `<option value="${s}" ${s === cur ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select>`;
}

function renderActions() {
  const f = state.filters;
  const list = filteredActions();
  const LIMIT = 50;
  const shown = state.showAll ? list : list.slice(0, LIMIT);
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`;
  const rows = shown
    .map((a) => {
      const v = vilById.get(a.patient.villageId);
      const rule = state.rules[a.condition];
      const open = state.expanded.has(a.patientId);
      const tierBadge = a.tier === 'covered' ? '<span class="badge badge-ok">covered</span>' : `<span class="badge badge-${a.tier}">${a.tier}</span>`;
      const main = `<tr class="row-main" data-expand="${esc(a.patientId)}" aria-expanded="${open}">
        <td data-label="Priority"><span class="prio">${tierBadge}<span class="score">${a.priority || ''}</span></span></td>
        <td data-label="Patient"><span class="pid">${esc(a.patientId)}</span><span class="sub">${esc(v?.name)}${a.patient.ageYears != null ? ` · ${a.patient.ageYears} y` : ''}</span></td>
        <td data-label="Condition">${esc(rule.label)}${a.review.length ? `<br><span class="flag" title="${esc(a.review.join('; '))}">Clinician review</span>` : ''}</td>
        <td data-label="Supply">${a.overdue ? '<b class="neg">Overdue</b>' : `Runs out ${fmtShort(a.runOut)}`}<span class="sub">${a.gapDays ? `${a.gapDays}-day gap` : 'no gap'}</span></td>
        <td data-label="Action" class="wide"><b>${esc(ACTION_LABELS[a.action])}</b><span class="sub">${actionDetail(a)}</span>${a.residualGapDays ? `<span class="sub neg">${a.residualGapDays} days still uncovered: schedule follow-up</span>` : ''}</td>
        <td data-label="Status">${a.action === 'none' ? '' : statusSelect(a.patientId)}</td>
      </tr>`;
      const detail = open
        ? `<tr class="row-detail"><td colspan="6"><b>Why this priority</b><ul>${a.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>${a.review.length ? `<b>Before dispensing</b><ul>${a.review.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}<span class="muted">Home clinic: ${esc(facName(a.patient.facilityId))} · last refill ${fmtShort(a.patient.lastRefill)} for ${a.patient.daysSupplied} days · contact: ${esc(a.patient.channel)}${a.patient.phone ? '' : ' (no phone)'}</span></td></tr>`
        : '';
      return main + detail;
    })
    .join('');

  $('#panel').innerHTML = `
    <div class="toolbar">
      <input type="search" id="f-q" placeholder="Search patient ID or village" value="${esc(f.q)}" aria-label="Search">
      <select id="f-tier" aria-label="Priority">${opt('', 'All priorities', f.tier)}${opt('critical', 'Critical', f.tier)}${opt('high', 'High', f.tier)}${opt('routine', 'Routine', f.tier)}</select>
      <select id="f-condition" aria-label="Condition">${opt('', 'All conditions', f.condition)}${Object.entries(state.rules).map(([k, r]) => opt(k, r.label, f.condition)).join('')}</select>
      <select id="f-action" aria-label="Action">${opt('needs', 'Needs action', f.action)}${Object.entries(ACTION_LABELS).map(([k, l]) => opt(k === 'none' ? 'none' : k, k === 'none' ? 'Already covered' : l, f.action)).join('')}</select>
      <select id="f-facility" aria-label="Facility">${opt('', 'All facilities', f.facility)}${scenario.facilities.map((x) => opt(x.id, x.name, f.facility)).join('')}</select>
    </div>
    <div class="toolbar small">
      <span class="muted">${list.length} patient${list.length === 1 ? '' : 's'} · sorted by priority · tap a row for reasons</span>
      <span class="spacer"></span>
      <button class="btn btn-small" type="button" data-cmd="export-worklist">Export work list (CSV)</button>
      ${EMBED ? '' : '<button class="btn btn-small" type="button" data-cmd="print-chw">Print CHW task sheets</button>'}
    </div>
    <div class="table-wrap"><table class="cards">
      <thead><tr><th>Priority</th><th>Patient</th><th>Condition</th><th>Supply</th><th>Action</th><th>Status</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" class="muted">No patients match these filters.</td></tr>`}</tbody>
    </table></div>
    ${list.length > shown.length ? `<div class="more"><button class="btn btn-small" type="button" data-cmd="show-all">Show all ${list.length}</button></div>` : ''}
    ${plan.errors.length ? `<p class="neg small">${plan.errors.length} patient record(s) skipped: ${esc(plan.errors.slice(0, 3).map((e) => `${e.patientId}: ${e.error}`).join('; '))}</p>` : ''}`;
}

function renderStock() {
  const rows = plan.stock.rows.filter((r) => r.demand > 0 || r.balance < 0 || r.disrupted);
  const drugLabel = (d) => Object.values(state.rules).find((r) => r.drug === d)?.drugLabel || d;
  const unit = (d) => Object.values(state.rules).find((r) => r.drug === d)?.unit || 'unit';
  $('#panel').innerHTML = `
    <div class="callout"><b>Pre-position before ${fmtShort(state.event.onset)}.</b> Each facility keeps ${state.settings.reserveDays} days of stock for its routine patients; the plan adds the extra demand from early refills and deliveries. Shortfalls are covered from the nearest safe facility with a surplus, otherwise requested from the district store.</div>
    <h3 style="font-size:15px;margin:6px 0">Transfers needed (${plan.stock.transfers.length})</h3>
    ${
      plan.stock.transfers.length
        ? `<div class="table-wrap"><table><thead><tr><th>Medicine</th><th>From</th><th>To</th><th class="num">Quantity</th><th class="num">Distance</th></tr></thead><tbody>
      ${plan.stock.transfers.map((t) => `<tr><td>${esc(drugLabel(t.drug))}</td><td>${t.fromFacilityId ? esc(facName(t.fromFacilityId)) : `<b>${esc(t.note)}</b>`}</td><td>${esc(facName(t.toFacilityId))}</td><td class="num">${nf.format(t.units)} ${esc(unit(t.drug))}s</td><td class="num">${t.km != null ? `${t.km} km` : '—'}</td></tr>`).join('')}
    </tbody></table></div>`
        : '<p class="muted small">No transfers needed: every dispensing facility has enough stock.</p>'
    }
    ${
      plan.stock.atRisk.length
        ? `<h3 style="font-size:15px;margin:14px 0 6px">Stock at risk in the disruption area</h3><p class="small muted">Medicine left in facilities that will flood or close after planned dispensing. Move it to a safe store or raise it above flood level.</p>
      <div class="table-wrap"><table><thead><tr><th>Facility</th><th>Medicine</th><th class="num">Quantity</th></tr></thead><tbody>
      ${plan.stock.atRisk.map((r) => `<tr><td>${esc(facName(r.facilityId))}</td><td>${esc(drugLabel(r.drug))}</td><td class="num">${nf.format(r.units)}</td></tr>`).join('')}
      </tbody></table></div>`
        : ''
    }
    <h3 style="font-size:15px;margin:14px 0 6px">Facility stock vs. plan demand</h3>
    <div class="table-wrap"><table><thead><tr><th>Facility</th><th>Medicine</th><th class="num">On hand</th><th class="num">Routine reserve</th><th class="num">Plan demand</th><th class="num">Balance</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(facName(r.facilityId, true))}${r.disrupted ? ' <span class="badge badge-critical">in area</span>' : ''}</td><td>${esc(drugLabel(r.drug))}</td><td class="num">${nf.format(r.onHand)}</td><td class="num">${nf.format(r.reserve)}</td><td class="num">${nf.format(r.demand)}</td><td class="num ${r.balance < 0 ? 'neg' : 'pos'}">${nf.format(r.balance)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function messageFor(a) {
  const pickup = a.pickupFacilityId ? facName(a.pickupFacilityId) : '';
  return renderMessage({
    action: a.action,
    eventType: state.event.type,
    lang: a.patient.language,
    onset: state.event.onset,
    deadline: a.deadline,
    clinic: pickup,
    newClinic: a.newHomeFacilityId ? facName(a.newHomeFacilityId) : '',
    hotline: DISTRICT.hotline,
  });
}

function renderMessages() {
  const list = plan.actions.filter((a) => a.action !== 'none');
  const by = { sms: 0, voice: 0, chw: 0 };
  for (const a of list) by[a.patient.channel === 'chw' ? 'chw' : a.patient.channel === 'voice' ? 'voice' : 'sms']++;
  const shown = state.showAll ? list : list.slice(0, 40);
  $('#panel').innerHTML = `
    <div class="callout"><b>Privacy by design:</b> messages never name the condition or medicine and carry no patient name, so a shared phone does not reveal HIV, TB or epilepsy status. Patients without a phone are informed in person by a community health worker. Translations are drafts for review by native speakers.</div>
    <div class="toolbar small">
      <span class="badge badge-routine">${by.sms} SMS</span><span class="badge badge-high">${by.voice} voice call</span><span class="badge badge-ok">${by.chw} in person (CHW)</span>
      <span class="spacer"></span>
      <button class="btn btn-small" type="button" data-cmd="export-sms">Export for SMS gateway (CSV)</button>
      <button class="btn btn-small btn-primary" type="button" data-cmd="mark-sent">Mark SMS + voice as sent</button>
    </div>
    <div class="msg-list">
      ${shown
        .map((a) => {
          const ch = a.patient.channel === 'chw' ? 'chw' : a.patient.channel === 'voice' ? 'voice' : 'sms';
          const text = messageFor(a);
          const segs = smsSegments(text);
          return `<div class="msg"><span class="ch ${ch}">${ch === 'chw' ? 'CHW' : ch}</span><div class="body">${esc(text)}</div><div class="meta">${esc(a.patientId)} · ${esc(LANGUAGES[a.patient.language] || a.patient.language)}<br>${ch === 'sms' ? `${text.length} chars · ${segs} SMS` : ch === 'voice' ? 'read by IVR' : 'read aloud'}</div></div>`;
        })
        .join('')}
    </div>
    ${list.length > shown.length ? `<div class="more"><button class="btn btn-small" type="button" data-cmd="show-all">Show all ${list.length}</button></div>` : ''}`;
}

function viewDate() {
  return state.simulateAfter ? fmtDate(addDays(parseDate(plan?.pickupDeadline || state.today), 1)) : state.today;
}

function renderFollow() {
  const fu = followUp(plan, statusesFor(), viewDate());
  const c = fu.counts;
  $('#panel').innerHTML = `
    <div class="toolbar">
      <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="simulate-after" ${state.simulateAfter ? 'checked' : ''}> View as the day after the pickup deadline (${fmtShort(fmtDate(addDays(parseDate(plan.pickupDeadline), 1)))})</label>
      <span class="spacer"></span>
      <button class="btn btn-small" type="button" data-cmd="simulate-pickups">Demo: simulate clinic pickups</button>
    </div>
    <div class="progress" role="progressbar" aria-valuenow="${fu.coveragePct}" aria-valuemin="0" aria-valuemax="100" aria-label="Patients reached"><span style="width:${fu.coveragePct}%"></span></div>
    <p class="small muted" style="margin:6px 0 0">${fu.reached} of ${fu.total} patients reached (${fu.coveragePct}%).</p>
    <div class="stat-row">
      ${['pending', 'notified', 'collected', 'delivered', 'missed', 'traced'].map((s) => `<div class="stat"><div class="v">${c[s] || 0}</div><div class="l">${s[0].toUpperCase() + s.slice(1)}</div></div>`).join('')}
    </div>
    <h3 style="font-size:15px;margin:6px 0">Tracing list (${fu.trace.length})</h3>
    <p class="small muted">${fu.deadlinePassed ? 'The pickup deadline has passed. Everyone below has not collected and must be traced by a community health worker as soon as it is safe.' : `Patients marked "missed" appear here now; everyone not reached joins this list after ${fmtShort(plan.pickupDeadline)}.`}</p>
    ${
      fu.trace.length
        ? `<div class="toolbar small"><span class="spacer"></span><button class="btn btn-small" type="button" data-cmd="export-trace">Export tracing list (CSV)</button></div>
      <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Village</th><th>Condition</th><th>Supply</th><th>Status</th></tr></thead><tbody>
      ${fu.trace.map((a) => `<tr><td><span class="pid">${esc(a.patientId)}</span>${a.tier !== 'covered' ? ` <span class="badge badge-${a.tier}">${a.tier}</span>` : ''}</td><td>${esc(vilById.get(a.patient.villageId)?.name)}</td><td>${esc(state.rules[a.condition].label)}</td><td>${a.overdue ? '<b class="neg">Overdue</b>' : `Runs out ${fmtShort(a.runOut)}`}</td><td>${statusSelect(a.patientId)}</td></tr>`).join('')}
      </tbody></table></div>`
        : '<p class="muted small">Nobody to trace yet.</p>'
    }`;
}

function renderData() {
  const r = state.rules;
  const s = state.settings;
  $('#panel').innerHTML = `
    <div class="grid-2">
      <div class="box">
        <h3>Patient line list</h3>
        <p>Import a de-identified CSV exported from the facility EMR or ART register (OpenMRS, DHIS2 Tracker, Hikma Health or a spreadsheet). Data stays in this browser; nothing is uploaded.</p>
        <div class="toolbar">
          <label class="btn btn-small btn-primary file-label">Import CSV<input type="file" id="import-file" accept=".csv,text/csv"></label>
          <button class="btn btn-small" type="button" data-cmd="download-template">Download template</button>
          <button class="btn btn-small" type="button" data-cmd="export-patients">Export current</button>
        </div>
        <p class="small">${state.importedPatients ? `<b>Using imported data:</b> ${state.importedPatients.length} patients. <button class="btn btn-small" type="button" data-cmd="use-demo">Back to demo data</button>` : `Using synthetic demo data: ${scenario.patients.length} patients in ${scenario.villages.length} villages.`}</p>
        ${state.importErrors.length ? `<ul class="errors">${state.importErrors.slice(0, 50).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
        <p class="small">Columns: <code>${PATIENT_COLUMNS.join(', ')}</code>. Village and facility IDs must match the district configuration.</p>
      </div>
      <div class="box">
        <h3>Planning settings</h3>
        <p>District-level settings. Changes re-plan instantly.</p>
        <div class="rules">
          <table><tbody>
            <tr><td>Safety buffer after access returns</td><td><input type="number" min="0" max="60" data-setting="bufferDays" value="${s.bufferDays}"> days</td></tr>
            <tr><td>Last pickup before onset</td><td><input type="number" min="0" max="14" data-setting="pickupMarginDays" value="${s.pickupMarginDays}"> days</td></tr>
            <tr><td>Walking distance before CHW delivery</td><td><input type="number" min="1" max="100" data-setting="maxWalkKm" value="${s.maxWalkKm}"> km</td></tr>
            <tr><td>Routine stock reserve</td><td><input type="number" min="0" max="120" data-setting="reserveDays" value="${s.reserveDays}"> days</td></tr>
          </tbody></table>
        </div>
      </div>
    </div>
    <div class="box" style="margin-top:14px">
      <h3>Clinical dispensing rules</h3>
      <p>Defaults follow WHO guidance (e.g. 3–6 month ART refills for people established on treatment). <b>Each deployment must confirm these with a clinical lead against national guidelines.</b></p>
      <div class="table-wrap rules"><table>
        <thead><tr><th>Condition</th><th>Medicine</th><th class="num">Pack (days)</th><th class="num">Max supply (days)</th><th class="num">Severity (1–4)</th></tr></thead>
        <tbody>${Object.entries(r).map(([k, x]) => `<tr><td>${esc(x.label)}${x.maxDaysNotEstablished ? `<span class="sub">max ${x.maxDaysNotEstablished} d if &lt; 6 months on treatment</span>` : ''}</td><td>${esc(x.drugLabel)}</td><td class="num"><input type="number" min="1" max="180" data-rule="${k}" data-field="packDays" value="${x.packDays}"></td><td class="num"><input type="number" min="1" max="365" data-rule="${k}" data-field="maxDays" value="${x.maxDays}"></td><td class="num"><input type="number" min="1" max="4" data-rule="${k}" data-field="severity" value="${x.severity}"></td></tr>`).join('')}</tbody>
      </table></div>
      <div class="toolbar" style="margin-top:10px"><button class="btn btn-small" type="button" data-cmd="restore-rules">Restore defaults</button></div>
    </div>`;
}

function renderPanel() {
  ({ actions: renderActions, stock: renderStock, messages: renderMessages, follow: renderFollow, data: renderData })[state.tab]();
}

function render() {
  computePlan();
  renderScenarios();
  renderEvent();
  renderKpis();
  renderMapCard();
  renderTabs();
  renderPanel();
  saveStore();
}

// Re-render everything except the panel input that currently has focus.
function renderKeepFocus() {
  const active = document.activeElement;
  const id = active?.id;
  const pos = active?.selectionStart;
  render();
  if (id) {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
      if (pos != null && el.setSelectionRange) {
        try {
          el.setSelectionRange(pos, pos);
        } catch {
          /* not a text input */
        }
      }
    }
  }
}

// ---------- actions ----------
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// Embedded previews (sandboxed iframes) block downloads and printing, so
// there the exports copy to the clipboard instead.
const EMBED = Boolean(window.__REFILLAHEAD_EMBED);

function download(name, text, type = 'text/csv') {
  if (EMBED) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast(`Copied ${name} to the clipboard (downloads are off in this preview).`))
      .catch(() => toast('Downloads are off in this preview. Run the app from the repo to export.'));
    return;
  }
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function selectScenario(key) {
  state.expanded.clear();
  state.showAll = false;
  state.simulateAfter = false;
  if (key === 'live') {
    state.eventKey = 'live';
    runLiveCheck();
    return;
  }
  state.eventKey = key;
  state.event = clone(presets[key]);
  render();
}

async function runLiveCheck() {
  if (!navigator.onLine) {
    state.live = { loading: false, results: null, error: 'You are offline. The live check needs a connection; the planner itself works offline.' };
    render();
    return;
  }
  state.live = { loading: true, results: null, error: null };
  render();
  const points = [...scenario.facilities, ...scenario.villages];
  try {
    const results = await checkLive(points);
    const okCount = results.filter((r) => r.ok).length;
    if (!okCount) throw new Error('Forecast service did not respond. Try again later.');
    const draft = draftEventFromHits(results, { facilities: scenario.facilities, villages: scenario.villages, today: state.today, haversineKm });
    state.live = { loading: false, results, error: null };
    if (draft) {
      state.event = draft;
      toast('Forecast triggers found: a draft event was created. Review the area on the map.');
    } else {
      state.event = {
        id: 'EVT-LIVE-NONE',
        type: 'flood',
        title: 'Live forecast: no triggers',
        source: 'Open-Meteo forecast (unofficial)',
        onset: fmtDate(addDays(parseDate(state.today), 7)),
        durationDays: 14,
        permanent: false,
        affectedVillageIds: [],
        affectedFacilityIds: [],
        description: 'No heavy rain, extreme heat or sharp river rise in the forecast window. Use "Edit area" to plan for a different scenario.',
      };
    }
  } catch (e) {
    state.live = { loading: false, results: null, error: String(e?.message || e) };
  }
  render();
}

function exportWorklist() {
  const list = filteredActions();
  const rows = [
    ['priority', 'tier', 'patient_id', 'village', 'condition', 'runs_out', 'gap_days', 'action', 'pickup_facility', 'pickup_km', 'deadline', 'dispense_days', 'units', 'new_home_facility', 'clinician_review', 'status'],
    ...list.map((a) => [
      a.priority,
      a.tier,
      a.patientId,
      vilById.get(a.patient.villageId)?.name,
      state.rules[a.condition].label,
      a.runOut,
      a.gapDays,
      ACTION_LABELS[a.action],
      a.pickupFacilityId ? facName(a.pickupFacilityId) : '',
      a.pickupKm ?? '',
      a.deadline ?? '',
      a.dispenseDays,
      a.units,
      a.newHomeFacilityId ? facName(a.newHomeFacilityId) : '',
      a.review.join('; '),
      statusesFor()[a.patientId] || 'pending',
    ]),
  ];
  download(`refillahead-worklist-${state.event.id}.csv`, toCSV(rows));
}

function exportSms() {
  const list = plan.actions.filter((a) => a.action !== 'none' && a.patient.phone && a.patient.channel !== 'chw');
  const rows = [['phone', 'channel', 'language', 'message', 'patient_id'], ...list.map((a) => [a.patient.phone, a.patient.channel, a.patient.language, messageFor(a), a.patientId])];
  download(`refillahead-messages-${state.event.id}.csv`, toCSV(rows));
}

function exportTrace() {
  const fu = followUp(plan, statusesFor(), viewDate());
  const rows = [['patient_id', 'tier', 'village', 'condition', 'runs_out', 'phone', 'status'], ...fu.trace.map((a) => [a.patientId, a.tier, vilById.get(a.patient.villageId)?.name, state.rules[a.condition].label, a.runOut, a.patient.phone, statusesFor()[a.patientId] || 'pending'])];
  download(`refillahead-tracing-${state.event.id}.csv`, toCSV(rows));
}

function printChw() {
  const list = plan.actions.filter((a) => a.action === 'chw_delivery' || a.action === 'outreach' || (a.action !== 'none' && a.patient.channel === 'chw'));
  const byVillage = new Map();
  for (const a of list) {
    const k = a.patient.villageId;
    if (!byVillage.has(k)) byVillage.set(k, []);
    byVillage.get(k).push(a);
  }
  const sheet = $('#print-sheet');
  sheet.innerHTML = `<h1>RefillAhead · CHW task sheets · ${esc(state.event.title)}</h1><p>Deliver or inform before ${fmtShort(plan.pickupDeadline)}. Do not say the condition aloud in front of others.</p>
    ${[...byVillage.entries()]
      .map(
        ([vid, items]) => `<h2>${esc(vilById.get(vid)?.name)} (${items.length})</h2><table><thead><tr><th>Patient</th><th>Task</th><th>Medicine</th><th>Done</th></tr></thead><tbody>
        ${items.map((a) => `<tr><td>${esc(a.patientId)}</td><td>${a.action === 'chw_delivery' || a.action === 'outreach' ? `Deliver ${a.dispenseDays} days from ${esc(facName(a.pickupFacilityId))}` : `Tell patient: ${esc(ACTION_LABELS[a.action])} at ${esc(facName(a.pickupFacilityId))} by ${fmtShort(a.deadline)}`}</td><td>${esc(state.rules[a.condition].drugLabel)} × ${a.units}</td><td>☐</td></tr>`).join('')}
        </tbody></table>`,
      )
      .join('')}`;
  window.print();
}

function simulatePickups() {
  const rand = mulberry32(42);
  const st = statusesFor();
  for (const a of plan.actions) {
    if (a.action === 'none') continue;
    if (st[a.patientId] && st[a.patientId] !== 'pending' && st[a.patientId] !== 'notified') continue;
    const r = rand();
    if (r < 0.72) st[a.patientId] = a.action === 'chw_delivery' || a.action === 'outreach' ? 'delivered' : 'collected';
    else if (r < 0.85) st[a.patientId] = 'notified';
  }
  toast('Simulated: ~72% collected or delivered before the deadline.');
  render();
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const sc = e.target.closest('[data-scenario]');
  if (sc) return selectScenario(sc.dataset.scenario);

  const tab = e.target.closest('[role=tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    state.showAll = false;
    renderTabs();
    renderPanel();
    saveStore();
    return;
  }

  const mapItem = e.target.closest('.map-svg.editing [data-kind]');
  if (mapItem) return toggleArea(mapItem);

  if (e.target.closest('#edit-area-btn')) {
    state.editMode = !state.editMode;
    renderMapCard();
    return;
  }
  const resetBtn = e.target.closest('#reset-btn');
  if (resetBtn) {
    // Two-step confirm inside the page (native confirm() is blocked in some embeds).
    if (!resetBtn.dataset.armed) {
      resetBtn.dataset.armed = '1';
      resetBtn.textContent = 'Click again to reset';
      setTimeout(() => {
        delete resetBtn.dataset.armed;
        resetBtn.textContent = 'Reset demo';
      }, 4000);
      return;
    }
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    location.reload();
    return;
  }

  const cmd = e.target.closest('[data-cmd]')?.dataset.cmd;
  if (cmd) return runCmd(cmd);

  if (e.target.closest('select, input, button, a')) return;
  const row = e.target.closest('[data-expand]');
  if (row) {
    const id = row.dataset.expand;
    state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
    renderPanel();
  }
});

document.addEventListener('keydown', (e) => {
  // Keyboard support for map editing and expandable rows.
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.map-svg.editing [data-kind]')) {
    e.preventDefault();
    toggleArea(e.target.closest('[data-kind]'));
  }
  const tab = e.target.closest?.('[role=tab]');
  if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const tabs = [...document.querySelectorAll('[role=tab]')];
    const i = tabs.indexOf(tab);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.click();
    next.focus();
  }
});

function toggleArea(el) {
  const id = el.dataset.id;
  const key = el.dataset.kind === 'village' ? 'affectedVillageIds' : 'affectedFacilityIds';
  const set = new Set(state.event[key] || []);
  set.has(id) ? set.delete(id) : set.add(id);
  state.event = { ...state.event, [key]: [...set] };
  render();
  // keep keyboard focus on the same map item
  const again = document.querySelector(`.map-svg [data-kind="${el.dataset.kind}"][data-id="${CSS.escape(id)}"]`);
  again?.focus();
}

function runCmd(cmd) {
  switch (cmd) {
    case 'show-all':
      state.showAll = true;
      return renderPanel();
    case 'export-worklist':
      return exportWorklist();
    case 'export-sms':
      return exportSms();
    case 'export-trace':
      return exportTrace();
    case 'print-chw':
      return printChw();
    case 'mark-sent': {
      const st = statusesFor();
      let n = 0;
      for (const a of plan.actions) {
        if (a.action === 'none' || a.patient.channel === 'chw') continue;
        if (!st[a.patientId] || st[a.patientId] === 'pending') {
          st[a.patientId] = 'notified';
          n++;
        }
      }
      toast(`${n} patients marked as notified.`);
      return render();
    }
    case 'simulate-pickups':
      return simulatePickups();
    case 'download-template':
      return download(
        'refillahead-patients-template.csv',
        toCSV([PATIENT_COLUMNS, ['P0001', 'V01', 'F1', 'HIV', state.today, '90', '24', 'yes', '34', 'no', 'no', '0', 'pt', 'sms', '+258 84 0000000'], ['P0002', 'V03', 'F2', 'HTN', state.today, '30', '12', 'yes', '71', 'no', 'yes', '1', 'en', 'chw', '']]),
      );
    case 'export-patients':
      return download('refillahead-patients.csv', toCSV(patientsToRows(patients())));
    case 'use-demo':
      state.importedPatients = null;
      state.importErrors = [];
      return render();
    case 'restore-rules':
      state.rules = clone(DEFAULT_RULES);
      state.settings = { ...DEFAULT_SETTINGS };
      toast('Rules restored to defaults.');
      return render();
  }
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'f-q') {
    state.filters.q = t.value;
    state.showAll = false;
    renderPanel();
    const el = $('#f-q');
    el.focus();
    el.setSelectionRange(t.value.length, t.value.length);
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.matches('[data-status]')) {
    statusesFor()[t.dataset.status] = t.value;
    renderKpis();
    renderTabs();
    if (state.tab === 'follow') renderFollow();
    saveStore();
    return;
  }
  const filterMap = { 'f-tier': 'tier', 'f-condition': 'condition', 'f-action': 'action', 'f-facility': 'facility' };
  if (filterMap[t.id]) {
    state.filters[filterMap[t.id]] = t.value;
    state.showAll = false;
    return renderPanel();
  }
  if (t.id === 'ev-onset' && t.value) {
    state.event = { ...state.event, onset: t.value };
    return renderKeepFocus();
  }
  if (t.id === 'ev-duration') {
    const n = Math.max(1, Math.min(365, parseInt(t.value, 10) || 1));
    state.event = { ...state.event, durationDays: n };
    return renderKeepFocus();
  }
  if (t.id === 'ev-type') {
    state.event = { ...state.event, type: t.value };
    return renderKeepFocus();
  }
  if (t.id === 'ev-permanent') {
    state.event = { ...state.event, permanent: t.checked };
    return renderKeepFocus();
  }
  if (t.id === 'simulate-after') {
    state.simulateAfter = t.checked;
    renderKpis();
    renderTabs();
    return renderFollow();
  }
  if (t.dataset.setting) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 0) {
      state.settings = { ...state.settings, [t.dataset.setting]: v };
      return renderKeepFocus();
    }
  }
  if (t.dataset.rule) {
    const v = Number(t.value);
    if (Number.isFinite(v) && v >= 1) {
      state.rules = { ...state.rules, [t.dataset.rule]: { ...state.rules[t.dataset.rule], [t.dataset.field]: v } };
      return renderKeepFocus();
    }
  }
  if (t.id === 'import-file' && t.files?.[0]) {
    const text = await t.files[0].text();
    const { patients: imported, errors } = importPatients(text, {
      conditions: Object.keys(state.rules),
      villageIds: scenario.villages.map((v) => v.id),
      facilityIds: scenario.facilities.map((f) => f.id),
    });
    state.importErrors = errors;
    if (imported.length) {
      state.importedPatients = imported;
      state.statuses = {};
      toast(`Imported ${imported.length} patients${errors.length ? `, ${errors.length} rows skipped` : ''}.`);
    } else {
      toast('No valid rows imported. See errors below.');
    }
    render();
  }
});

function updateOnline() {
  const el = $('#online-status');
  el.textContent = navigator.onLine ? 'Online' : 'Offline: planner still works';
  el.classList.toggle('off', !navigator.onLine);
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);

// ---------- boot ----------
$('#district-name').textContent = DISTRICT.name;
updateOnline();
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('sw.js').catch(() => {
    /* offline cache is optional */
  });
}

// Expose for debugging and the e2e smoke test.
window.__refillahead = { state, getPlan: () => plan };
