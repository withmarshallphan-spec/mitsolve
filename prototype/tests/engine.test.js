import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planEvent, followUp, supplyCap, DEFAULT_RULES, parseDate, diffDays, haversineKm } from '../src/engine.js';
import { buildScenario, presetEvents } from '../src/scenario.js';

const TODAY = '2026-11-03';

const facilities = [
  { id: 'A', name: 'Home Clinic', lat: 0, lon: 0, status: 'open', stock: { TLD: 1000, AMLO5: 100 } },
  { id: 'B', name: 'Safe Clinic', lat: 0, lon: 0.05, status: 'open', stock: { TLD: 5000, AMLO5: 5000 } },
];
const villages = [
  { id: 'V1', name: 'Wet', lat: 0.01, lon: 0 },
  { id: 'V2', name: 'Dry', lat: 0.5, lon: 0.5 },
];
const base = {
  villageId: 'V1',
  facilityId: 'A',
  condition: 'HIV',
  monthsOnTreatment: 24,
  stable: true,
  ageYears: 35,
  missedVisits12m: 0,
};
const flood = {
  id: 'E',
  type: 'flood',
  onset: '2026-11-07',
  durationDays: 21,
  permanent: false,
  affectedVillageIds: ['V1'],
  affectedFacilityIds: ['A'],
};

test('date helpers', () => {
  assert.equal(diffDays(parseDate('2026-11-07'), parseDate('2026-11-03')), 4);
  assert.throws(() => parseDate('2026-02-30'));
  assert.throws(() => parseDate('03/11/2026'));
  // ~5.56 km per 0.05 deg of longitude at the equator
  assert.ok(Math.abs(haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0.05 }) - 5.56) < 0.05);
});

test('patient who would run out during the flood gets an early refill sized to the gap', () => {
  // Supply runs out 2026-11-10; access returns 2026-11-28; +7 buffer -> need until 2026-12-05 => 25-day gap.
  const p = { ...base, id: 'P1', lastRefill: '2026-10-11', daysSupplied: 30 };
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: [p] });
  const a = plan.actions[0];
  assert.equal(a.gapDays, 25);
  assert.equal(a.action, 'early_refill');
  assert.equal(a.pickupFacilityId, 'A', 'home clinic still works before onset');
  assert.equal(a.dispenseDays, 30, 'rounded up to one 30-day pack');
  assert.equal(a.units, 30);
  assert.equal(a.covered, true);
  assert.equal(a.deadline, '2026-11-06');
});

test('patient with enough supply needs no action', () => {
  const p = { ...base, id: 'P2', lastRefill: '2026-11-01', daysSupplied: 90 };
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: [p] });
  assert.equal(plan.actions[0].action, 'none');
  assert.equal(plan.summary.needingAction, 0);
  assert.equal(plan.summary.alreadyCovered, 1);
});

test('patients outside the affected area are untouched', () => {
  const p = { ...base, id: 'P3', villageId: 'V2', facilityId: 'B', lastRefill: '2026-10-11', daysSupplied: 30 };
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: [p] });
  assert.equal(plan.actions.length, 0);
  assert.deepEqual(plan.summary.unaffectedPatients, 1);
});

test('supply cap: HIV not yet established on ART is limited to a 60-day bridge and flagged for review', () => {
  const cap = supplyCap({ ...base, monthsOnTreatment: 2 }, DEFAULT_RULES.HIV);
  assert.equal(cap.cap, 60);
  assert.ok(cap.review.some((r) => /bridging/.test(r)));
  assert.equal(supplyCap({ ...base }, DEFAULT_RULES.HIV).cap, 180);
  assert.equal(supplyCap({ ...base, ageYears: 1 }, DEFAULT_RULES.HIV).cap, 30);
});

test('cap leaves a residual gap that is reported, not hidden', () => {
  // Long disruption: 120 days; new patient capped at 60.
  const longEvent = { ...flood, durationDays: 120 };
  const p = { ...base, id: 'P4', monthsOnTreatment: 1, lastRefill: '2026-10-11', daysSupplied: 30 };
  const plan = planEvent({ today: TODAY, event: longEvent, facilities, villages, patients: [p] });
  const a = plan.actions[0];
  assert.equal(a.dispenseDays, 60);
  assert.ok(a.residualGapDays > 0);
  assert.equal(a.covered, false);
  assert.equal(plan.summary.partialCoverage, 1);
});

test('mobility-limited patients get a CHW delivery; zero lead time means outreach', () => {
  const p = { ...base, id: 'P5', mobilityLimited: true, lastRefill: '2026-10-11', daysSupplied: 30 };
  let plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: [p] });
  assert.equal(plan.actions[0].action, 'chw_delivery');
  plan = planEvent({ today: '2026-11-07', event: flood, facilities, villages, patients: [{ ...p, mobilityLimited: false }] });
  assert.equal(plan.actions[0].action, 'outreach');
});

test('permanent closure reroutes to the nearest safe facility, even with no supply gap', () => {
  const closure = { id: 'C', type: 'closure', onset: '2026-11-13', durationDays: 45, permanent: true, affectedVillageIds: [], affectedFacilityIds: ['A'] };
  const p = { ...base, id: 'P6', lastRefill: '2026-11-01', daysSupplied: 180 };
  const plan = planEvent({ today: TODAY, event: closure, facilities, villages, patients: [p] });
  const a = plan.actions[0];
  assert.equal(a.action, 'reroute');
  assert.equal(a.newHomeFacilityId, 'B');
  assert.equal(a.dispenseDays, 0);
  assert.equal(a.covered, true);
});

test('higher-severity, more vulnerable patients rank first', () => {
  const pts = [
    { ...base, id: 'HTN', condition: 'HTN', lastRefill: '2026-10-11', daysSupplied: 30 },
    { ...base, id: 'INS', condition: 'INS', lastRefill: '2026-10-11', daysSupplied: 28, pregnant: true },
  ];
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: pts });
  assert.equal(plan.actions[0].patientId, 'INS');
  assert.ok(plan.actions[0].reasons.some((r) => /Pregnant/.test(r)));
});

test('stock shortfall triggers a transfer from the nearest safe facility with surplus', () => {
  const pts = Array.from({ length: 40 }, (_, i) => ({ ...base, id: `S${i}`, lastRefill: '2026-10-11', daysSupplied: 30 }));
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: pts });
  // 40 patients x 30 tablets = 1200 > 1000 on hand at A
  const row = plan.stock.rows.find((r) => r.facilityId === 'A' && r.drug === 'TLD');
  assert.equal(row.demand, 1200);
  assert.equal(row.balance, -200);
  const t = plan.stock.transfers.find((x) => x.toFacilityId === 'A' && x.drug === 'TLD');
  assert.equal(t.fromFacilityId, 'B');
  assert.equal(t.units, 200);
});

test('unknown references are reported as errors instead of crashing', () => {
  const p = { ...base, id: 'BAD', villageId: 'NOPE', lastRefill: '2026-10-11', daysSupplied: 30 };
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: [p] });
  assert.equal(plan.errors.length, 1);
  assert.match(plan.errors[0].error, /Unknown village/);
});

test('follow-up: after the deadline, anyone not reached goes on the tracing list', () => {
  const pts = [
    { ...base, id: 'F1', lastRefill: '2026-10-11', daysSupplied: 30 },
    { ...base, id: 'F2', lastRefill: '2026-10-11', daysSupplied: 30 },
  ];
  const plan = planEvent({ today: TODAY, event: flood, facilities, villages, patients: pts });
  let fu = followUp(plan, { F1: 'collected' }, TODAY);
  assert.equal(fu.deadlinePassed, false);
  assert.equal(fu.trace.length, 0);
  assert.equal(fu.coveragePct, 50);
  fu = followUp(plan, { F1: 'collected' }, '2026-11-08');
  assert.equal(fu.deadlinePassed, true);
  assert.deepEqual(fu.trace.map((a) => a.patientId), ['F2']);
});

test('demo scenario: every preset produces a sane, fully-referenced plan', () => {
  const sc = buildScenario(TODAY);
  assert.ok(sc.patients.length > 200);
  const presets = presetEvents(TODAY);
  for (const key of Object.keys(presets)) {
    const plan = planEvent({ today: TODAY, event: presets[key], ...sc });
    assert.equal(plan.errors.length, 0, key);
    assert.ok(plan.summary.needingAction > 0, `${key} should need action`);
    for (const a of plan.actions) {
      assert.ok(a.dispenseDays <= DEFAULT_RULES[a.condition].maxDays, 'never exceeds clinical cap');
      if (a.action !== 'none' && a.action !== 'outreach') assert.ok(a.pickupFacilityId, 'has a pickup facility');
    }
  }
  const cyc = planEvent({ today: TODAY, event: presets.cyclone, ...sc });
  // Flooded facilities should never be a destination for transfers in.
  for (const t of cyc.stock.transfers) {
    if (t.fromFacilityId) assert.ok(!['F2', 'F3'].includes(t.fromFacilityId), 'no transfers out of nothing');
  }
  const clo = planEvent({ today: TODAY, event: presets.closure, ...sc });
  assert.ok(clo.actions.every((a) => a.action === 'reroute' || a.action === 'chw_delivery'));
  assert.ok(clo.actions.every((a) => !['F6', 'F7'].includes(a.newHomeFacilityId)));
});

test('scenario generation is deterministic for a given date and seed', () => {
  const a = buildScenario(TODAY).patients;
  const b = buildScenario(TODAY).patients;
  assert.deepEqual(a, b);
});
