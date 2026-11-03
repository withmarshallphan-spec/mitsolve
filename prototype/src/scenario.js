// Synthetic demo district. Every name, patient and stock level here is
// FICTIONAL and generated from a fixed seed. The map is positioned in a
// cyclone- and flood-prone river delta in central Mozambique only so that the
// "live forecast" check queries a realistic location.

import { addDays, fmtDate, parseDate } from './engine.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DISTRICT = {
  name: 'Riverbend District',
  note: 'Synthetic demo data. Names, patients and stock are fictional.',
  river: [
    [-19.70, 34.30],
    [-19.76, 34.40],
    [-19.84, 34.47],
    [-19.90, 34.56],
    [-19.95, 34.66],
    [-20.02, 34.74],
    [-20.08, 34.83],
    [-20.13, 34.93],
  ],
  hotline: '800 123 456',
};

export const FACILITIES = [
  { id: 'F1', name: 'Riverbend District Hospital', type: 'hospital', lat: -19.80, lon: 34.36, status: 'open', support: 'government' },
  { id: 'F2', name: 'Lowland Health Centre', type: 'health_centre', lat: -19.915, lon: 34.585, status: 'open', support: 'government' },
  { id: 'F3', name: 'Delta Health Centre', type: 'health_centre', lat: -20.085, lon: 34.80, status: 'open', support: 'government' },
  { id: 'F4', name: 'Hillside Health Centre', type: 'health_centre', lat: -19.84, lon: 34.70, status: 'open', support: 'government' },
  { id: 'F5', name: 'Market Town Clinic', type: 'health_centre', lat: -20.13, lon: 34.52, status: 'open', support: 'government' },
  { id: 'F6', name: 'Northgate Health Post', type: 'health_post', lat: -19.73, lon: 34.56, status: 'open', support: 'donor-funded NGO' },
  { id: 'F7', name: 'Eastfield Health Post', type: 'health_post', lat: -19.95, lon: 34.86, status: 'open', support: 'donor-funded NGO' },
];

export const VILLAGES = [
  { id: 'V01', name: 'Mango Flats', lat: -19.745, lon: 34.43, facilityId: 'F1', lowland: true },
  { id: 'V02', name: 'Upper Fields', lat: -19.74, lon: 34.33, facilityId: 'F1', lowland: false },
  { id: 'V03', name: 'Reed Bank', lat: -19.87, lon: 34.49, facilityId: 'F2', lowland: true },
  { id: 'V04', name: 'Ferry Point', lat: -19.955, lon: 34.565, facilityId: 'F2', lowland: true },
  { id: 'V05', name: 'Sandbar', lat: -19.995, lon: 34.665, facilityId: 'F2', lowland: true },
  { id: 'V06', name: 'Lower Delta', lat: -20.06, lon: 34.715, facilityId: 'F3', lowland: true },
  { id: 'V07', name: "Fishers' Cove", lat: -20.135, lon: 34.885, facilityId: 'F3', lowland: true },
  { id: 'V08', name: 'Palm Grove', lat: -20.02, lon: 34.785, facilityId: 'F3', lowland: true },
  { id: 'V09', name: 'Baobab Hill', lat: -19.785, lon: 34.79, facilityId: 'F4', lowland: false },
  { id: 'V10', name: 'Stony Ridge', lat: -19.855, lon: 34.645, facilityId: 'F4', lowland: false },
  { id: 'V11', name: 'Crossroads', lat: -20.075, lon: 34.605, facilityId: 'F5', lowland: false },
  { id: 'V12', name: 'Millstream', lat: -20.16, lon: 34.46, facilityId: 'F5', lowland: false },
  { id: 'V13', name: 'Kraal Gate', lat: -19.69, lon: 34.65, facilityId: 'F6', lowland: false },
  { id: 'V14', name: 'Sunrise', lat: -19.76, lon: 34.52, facilityId: 'F6', lowland: false },
  { id: 'V15', name: 'Eastfield', lat: -19.895, lon: 34.92, facilityId: 'F7', lowland: false },
  { id: 'V16', name: 'Coral Bend', lat: -20.005, lon: 34.885, facilityId: 'F7', lowland: true },
];

// Patients per village (scaled-down line list).
const VILLAGE_SIZE = { V01: 22, V02: 14, V03: 20, V04: 24, V05: 18, V06: 22, V07: 16, V08: 14, V09: 14, V10: 12, V11: 14, V12: 12, V13: 14, V14: 12, V15: 14, V16: 12 };

const CONDITION_MIX = [
  ['HIV', 0.46],
  ['HTN', 0.22],
  ['DM', 0.1],
  ['TB', 0.08],
  ['INS', 0.06],
  ['EPI', 0.08],
];

function pick(rand, weighted) {
  let r = rand();
  for (const [v, w] of weighted) {
    if ((r -= w) <= 0) return v;
  }
  return weighted[weighted.length - 1][0];
}

const LANGS = [
  ['pt', 0.7],
  ['en', 0.15],
  ['sw', 0.15],
];

export function generatePatients(today, seed = 20261106) {
  const t0 = parseDate(today);
  const rand = mulberry32(seed);
  const patients = [];
  let n = 1;
  for (const v of VILLAGES) {
    const count = VILLAGE_SIZE[v.id] ?? 10;
    for (let i = 0; i < count; i++) {
      const condition = pick(rand, CONDITION_MIX);
      const monthsOnTreatment = condition === 'TB' ? 1 + Math.floor(rand() * 5) : Math.floor(rand() * 96);
      const stable = condition === 'HIV' ? rand() > 0.15 : true;
      const established = monthsOnTreatment >= 6 && stable;
      let daysSupplied;
      if (condition === 'HIV') daysSupplied = established && rand() < 0.45 ? 90 : 30;
      else if (condition === 'TB' || condition === 'INS') daysSupplied = 28;
      else daysSupplied = rand() < 0.3 ? 60 : 30;
      // Last refill somewhere in the current supply cycle; ~6% are already late.
      const late = rand() < 0.06;
      const ago = late ? daysSupplied + 1 + Math.floor(rand() * 10) : Math.floor(rand() * daysSupplied);
      const ageYears = condition === 'HIV' && rand() < 0.04 ? 1 + Math.floor(rand() * 12) : 18 + Math.floor(rand() * 62);
      const female = rand() < 0.58;
      const pregnant = female && ageYears >= 18 && ageYears <= 42 && rand() < 0.08;
      const hasPhone = rand() < 0.82;
      const channel = !hasPhone ? 'chw' : rand() < 0.25 ? 'voice' : 'sms';
      patients.push({
        id: `P${String(n++).padStart(4, '0')}`,
        villageId: v.id,
        facilityId: v.facilityId,
        condition,
        lastRefill: fmtDate(addDays(t0, -ago)),
        daysSupplied,
        monthsOnTreatment,
        stable,
        ageYears,
        pregnant,
        mobilityLimited: ageYears >= 70 ? rand() < 0.5 : rand() < 0.05,
        missedVisits12m: rand() < 0.2 ? 2 + Math.floor(rand() * 3) : Math.floor(rand() * 2),
        language: pick(rand, LANGS),
        channel,
        phone: hasPhone ? `+258 8${Math.floor(rand() * 10)} ${String(Math.floor(rand() * 1e7)).padStart(7, '0')}` : '',
      });
    }
  }
  return patients;
}

// Stock on hand per facility, in dispensing units (tablets / vials).
export function generateStock(patients, seed = 7) {
  const rand = mulberry32(seed);
  const perFacility = {};
  const perDay = { TLD: 1, HRZE: 4, INSULIN: 0.04, CBZ200: 2, AMLO5: 1, MET500: 2 };
  const drugOf = { HIV: 'TLD', TB: 'HRZE', INS: 'INSULIN', EPI: 'CBZ200', HTN: 'AMLO5', DM: 'MET500' };
  for (const p of patients) {
    const d = drugOf[p.condition];
    perFacility[p.facilityId] = perFacility[p.facilityId] || {};
    perFacility[p.facilityId][d] = (perFacility[p.facilityId][d] || 0) + perDay[d];
  }
  const stock = {};
  for (const f of FACILITIES) {
    const daily = perFacility[f.id] || {};
    stock[f.id] = {};
    for (const [drug, units] of Object.entries(daily)) {
      // Typical months-of-stock varies: some facilities are close to stock-out.
      const monthsOfStock = f.id === 'F3' ? 0.9 + rand() * 0.5 : f.id === 'F1' ? 3 + rand() * 2 : 1.4 + rand() * 1.6;
      stock[f.id][drug] = Math.round(units * 30 * monthsOfStock);
    }
  }
  return stock;
}

export function buildScenario(today, seed) {
  const patients = generatePatients(today, seed);
  const stock = generateStock(patients);
  const facilities = FACILITIES.map((f) => ({ ...f, stock: stock[f.id] || {} }));
  return { district: DISTRICT, facilities, villages: VILLAGES.map((v) => ({ ...v })), patients };
}

// Pre-built disruption events, relative to "today".
export function presetEvents(today) {
  const t0 = parseDate(today);
  return {
    cyclone: {
      id: 'EVT-CYCLONE',
      type: 'cyclone',
      title: 'Tropical cyclone: landfall + river flooding',
      source: 'National meteorological service warning (demo)',
      onset: fmtDate(addDays(t0, 4)),
      durationDays: 21,
      permanent: false,
      affectedVillageIds: VILLAGES.filter((v) => v.lowland).map((v) => v.id),
      affectedFacilityIds: ['F2', 'F3'],
      description:
        'Forecast landfall in 4 days. Lowland villages along the river are expected to be cut off for about 3 weeks; Lowland and Delta health centres are in the flood zone.',
    },
    closure: {
      id: 'EVT-CLOSURE',
      type: 'closure',
      title: 'Funding cut: two NGO-supported clinics close',
      source: 'Implementing partner stop-work notice (demo)',
      onset: fmtDate(addDays(t0, 10)),
      durationDays: 45,
      permanent: true,
      affectedVillageIds: [],
      affectedFacilityIds: ['F6', 'F7'],
      description:
        'Northgate and Eastfield health posts lose donor funding and close in 10 days. Their patients need a bridging supply and a new clinic before records and contact are lost.',
    },
    heat: {
      id: 'EVT-HEAT',
      type: 'heat',
      title: 'Extreme heat + power cuts',
      source: 'Heat-health warning (demo)',
      onset: fmtDate(addDays(t0, 3)),
      durationDays: 10,
      permanent: false,
      affectedVillageIds: ['V05', 'V06', 'V07', 'V08', 'V11', 'V12', 'V16'],
      affectedFacilityIds: [],
      description:
        'Forecast daily maxima above 40 °C for 10 days in the southern lowlands. Travel in the heat is dangerous for older patients; insulin needs cool storage.',
    },
  };
}
