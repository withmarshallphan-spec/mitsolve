// Minimal RFC 4180 CSV parse/serialize + patient line-list import.

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const s = String(text).replace(/^﻿/, '');
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ',') {
      row.push(field);
      field = '';
      i++;
    } else if (c === '\n' || c === '\r') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      if (c === '\r' && s[i + 1] === '\n') i++;
      i++;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

export function toCSV(rows) {
  const enc = (v) => {
    const s = v == null ? '' : String(v);
    // Neutralise spreadsheet formula injection, then quote if needed.
    // Plain numbers and phone numbers (+258 84 ...) are left untouched.
    const safe = /^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };
  return rows.map((r) => r.map(enc).join(',')).join('\r\n') + '\r\n';
}

export const PATIENT_COLUMNS = [
  'patient_id',
  'village_id',
  'facility_id',
  'condition',
  'last_refill',
  'days_supplied',
  'months_on_treatment',
  'stable',
  'age_years',
  'pregnant',
  'mobility_limited',
  'missed_visits_12m',
  'language',
  'channel',
  'phone',
];

const REQUIRED = ['patient_id', 'village_id', 'facility_id', 'condition', 'last_refill', 'days_supplied'];

const bool = (v) => /^(1|true|yes|y|sim)$/i.test(String(v).trim());
const num = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

export function patientsToRows(patients) {
  return [
    PATIENT_COLUMNS,
    ...patients.map((p) => [
      p.id,
      p.villageId,
      p.facilityId,
      p.condition,
      p.lastRefill,
      p.daysSupplied,
      p.monthsOnTreatment,
      p.stable === false ? 'no' : 'yes',
      p.ageYears,
      p.pregnant ? 'yes' : 'no',
      p.mobilityLimited ? 'yes' : 'no',
      p.missedVisits12m,
      p.language,
      p.channel,
      p.phone,
    ]),
  ];
}

/**
 * Import a patient line list. Returns { patients, errors } where errors are
 * human-readable and reference the CSV line number.
 */
export function importPatients(text, { conditions, villageIds, facilityIds }) {
  const rows = parseCSV(text);
  if (!rows.length) return { patients: [], errors: ['File is empty'] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) return { patients: [], errors: [`Missing required column(s): ${missing.join(', ')}`] };
  const col = (r, name) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? '').trim() : '';
  };
  const patients = [];
  const errors = [];
  const seen = new Set();
  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    const id = col(r, 'patient_id');
    const condition = col(r, 'condition').toUpperCase();
    const villageId = col(r, 'village_id');
    const facilityId = col(r, 'facility_id');
    const lastRefill = col(r, 'last_refill');
    const daysSupplied = num(col(r, 'days_supplied'));
    const problems = [];
    if (!id) problems.push('patient_id is empty');
    else if (seen.has(id)) problems.push(`duplicate patient_id ${id}`);
    if (!conditions.includes(condition)) problems.push(`unknown condition "${condition}" (use ${conditions.join('/')})`);
    if (villageIds && !villageIds.includes(villageId)) problems.push(`unknown village_id "${villageId}"`);
    if (facilityIds && !facilityIds.includes(facilityId)) problems.push(`unknown facility_id "${facilityId}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastRefill) || Number.isNaN(Date.parse(lastRefill))) problems.push(`last_refill "${lastRefill}" is not YYYY-MM-DD`);
    if (daysSupplied == null || daysSupplied <= 0 || daysSupplied > 365) problems.push(`days_supplied "${col(r, 'days_supplied')}" must be 1-365`);
    if (problems.length) {
      errors.push(`Line ${line}: ${problems.join('; ')}`);
      return;
    }
    seen.add(id);
    const lang = col(r, 'language').toLowerCase();
    const channel = col(r, 'channel').toLowerCase();
    patients.push({
      id,
      villageId,
      facilityId,
      condition,
      lastRefill,
      daysSupplied,
      monthsOnTreatment: num(col(r, 'months_on_treatment')) ?? 12,
      stable: col(r, 'stable') === '' ? true : bool(col(r, 'stable')),
      ageYears: num(col(r, 'age_years')),
      pregnant: bool(col(r, 'pregnant')),
      mobilityLimited: bool(col(r, 'mobility_limited')),
      missedVisits12m: num(col(r, 'missed_visits_12m')) ?? 0,
      language: ['en', 'pt', 'sw', 'fr'].includes(lang) ? lang : 'en',
      channel: ['sms', 'voice', 'chw', 'whatsapp'].includes(channel) ? channel : 'sms',
      phone: col(r, 'phone'),
    });
  });
  return { patients, errors };
}
