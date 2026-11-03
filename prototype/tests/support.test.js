import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTriggers, checkLive, draftEventFromHits, forecastUrl, floodUrl } from '../src/forecast.js';
import { parseCSV, toCSV, importPatients, patientsToRows } from '../src/csv.js';
import { renderMessage, smsSegments } from '../src/messages.js';
import { haversineKm, DEFAULT_RULES } from '../src/engine.js';
import { buildScenario, FACILITIES, VILLAGES } from '../src/scenario.js';

// Shapes mirror Open-Meteo's documented responses.
const weather = (rain, tmax) => ({
  latitude: -19.9,
  longitude: 34.6,
  daily_units: { time: 'iso8601', precipitation_sum: 'mm', temperature_2m_max: '°C' },
  daily: {
    time: rain.map((_, i) => `2026-11-${String(4 + i).padStart(2, '0')}`),
    precipitation_sum: rain,
    temperature_2m_max: tmax,
  },
});

test('forecast URLs carry the expected parameters', () => {
  assert.match(forecastUrl(-19.9, 34.6), /api\.open-meteo\.com\/v1\/forecast\?latitude=-19\.9&longitude=34\.6&daily=precipitation_sum%2Ctemperature_2m_max/);
  assert.match(floodUrl(-19.9, 34.6), /flood-api\.open-meteo\.com\/v1\/flood\?.*daily=river_discharge/);
});

test('no triggers on a quiet forecast', () => {
  assert.deepEqual(evaluateTriggers(weather([0, 2, 5, 1], [31, 32, 33, 30]), null), []);
});

test('heavy rain: single day and 3-day total', () => {
  const hits = evaluateTriggers(weather([10, 60, 45, 5], [30, 30, 30, 30]), null);
  assert.equal(hits.filter((h) => h.type === 'heavy_rain').length, 2);
  assert.equal(hits[0].date, '2026-11-05');
});

test('extreme heat needs consecutive days', () => {
  assert.equal(evaluateTriggers(weather([0, 0, 0, 0], [41, 39, 41, 39]), null).length, 0);
  const hits = evaluateTriggers(weather([0, 0, 0, 0], [38, 41, 42, 39]), null);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].type, 'extreme_heat');
  assert.equal(hits[0].date, '2026-11-05');
});

test('river rise detected from flood API discharge', () => {
  const flood = { daily: { time: ['2026-11-04', '2026-11-05', '2026-11-06'], river_discharge: [100, 180, 420] } };
  const hits = evaluateTriggers(null, flood);
  assert.equal(hits[0].type, 'river_rise');
  assert.equal(hits[0].date, '2026-11-06');
});

test('checkLive isolates failures per point and drafts an event', async () => {
  const [f1, f2] = FACILITIES;
  const fakeFetch = async (url) => {
    const lat = Number(new URL(url).searchParams.get('latitude'));
    if (lat === f2.lat) return { ok: true, json: async () => weather([80, 40, 20, 0], [30, 30, 30, 30]) };
    if (lat === f1.lat) return { ok: false, status: 503 };
    return { ok: true, json: async () => weather([0, 0, 0, 0], [30, 30, 30, 30]) };
  };
  const pts = FACILITIES.slice(0, 3);
  const res = await checkLive(pts, { fetchImpl: fakeFetch });
  assert.equal(res.find((r) => r.id === 'F1').ok, false);
  assert.equal(res.find((r) => r.id === 'F2').hits.length > 0, true);
  const ev = draftEventFromHits(res, { facilities: FACILITIES, villages: VILLAGES, today: '2026-11-03', haversineKm });
  assert.equal(ev.type, 'flood');
  assert.equal(ev.onset, '2026-11-04');
  assert.ok(ev.affectedFacilityIds.includes('F2'));
  assert.ok(ev.affectedVillageIds.length > 0);
});

test('CSV round trip with quotes, commas and newlines', () => {
  const rows = [['a', 'b,c', 'say "hi"'], ['line\nbreak', '', '+258 84 1234567']];
  assert.deepEqual(parseCSV(toCSV(rows)), rows);
});

test('CSV export neutralises formula injection but keeps phone numbers', () => {
  const out = toCSV([['=HYPERLINK("x")', '+258 84 1234567', '-5']]);
  assert.match(out, /^"'=HYPERLINK/);
  assert.match(out, /,\+258 84 1234567,/);
  assert.match(out, /,-5\r\n$/);
});

test('patient import validates rows and reports line numbers', () => {
  const csv = [
    'patient_id,village_id,facility_id,condition,last_refill,days_supplied',
    'X1,V01,F1,hiv,2026-10-20,30',
    'X2,V01,F1,MALARIA,2026-10-20,30',
    'X1,V01,F1,HTN,2026-10-20,30',
    'X4,V99,F1,HTN,20/10/2026,0',
  ].join('\n');
  const { patients, errors } = importPatients(csv, {
    conditions: Object.keys(DEFAULT_RULES),
    villageIds: VILLAGES.map((v) => v.id),
    facilityIds: FACILITIES.map((f) => f.id),
  });
  assert.equal(patients.length, 1);
  assert.equal(patients[0].condition, 'HIV');
  assert.equal(errors.length, 3);
  assert.match(errors[0], /^Line 3: unknown condition/);
  assert.match(errors[1], /duplicate patient_id X1/);
  assert.match(errors[2], /Line 5: .*village_id.*last_refill.*days_supplied/);
});

test('exported demo patients re-import losslessly', () => {
  const sc = buildScenario('2026-11-03');
  const csv = toCSV(patientsToRows(sc.patients));
  const { patients, errors } = importPatients(csv, {
    conditions: Object.keys(DEFAULT_RULES),
    villageIds: VILLAGES.map((v) => v.id),
    facilityIds: FACILITIES.map((f) => f.id),
  });
  assert.equal(errors.length, 0);
  assert.deepEqual(patients, sc.patients);
});

test('messages never disclose the condition and fit in at most two SMS segments', () => {
  const banned = /hiv|aids|tb\b|tubercul|epilep|insulin|diabet|arv|tarv|sida/i;
  for (const action of ['early_refill', 'chw_delivery', 'reroute', 'outreach']) {
    for (const lang of ['en', 'pt', 'sw', 'fr']) {
      for (const eventType of ['cyclone', 'heat', 'closure']) {
        const msg = renderMessage({ action, eventType, lang, onset: '2026-11-07', deadline: '2026-11-06', clinic: 'Lowland Health Centre', newClinic: 'Hillside Health Centre', hotline: '800 123 456' });
        assert.ok(msg.length > 20, `${action}/${lang}`);
        assert.doesNotMatch(msg, banned, `${action}/${lang} leaks condition`);
        assert.doesNotMatch(msg, /\{\w+\}/, 'all placeholders filled');
        assert.ok(smsSegments(msg) <= 2, `${action}/${lang} is ${msg.length} chars`);
      }
    }
  }
});

test('SMS segment maths', () => {
  assert.equal(smsSegments('a'.repeat(160)), 1);
  assert.equal(smsSegments('a'.repeat(161)), 2);
  assert.equal(smsSegments('ú'.repeat(70)), 1);
  assert.equal(smsSegments('ú'.repeat(71)), 2);
});
