// Live hazard check using Open-Meteo (free, no API key, CORS-enabled).
//  - Weather forecast (16 days): daily rainfall and maximum temperature.
//  - Flood API (GloFAS-based, 30 days): forecast river discharge.
// Thresholds are simple, transparent defaults. A real deployment should take
// official warnings from the national meteorological / hydrological service
// (for example Common Alerting Protocol feeds) and use locally calibrated
// thresholds; this module exists so the prototype can show the trigger logic
// working on real forecast data.

export const DEFAULT_THRESHOLDS = {
  rainDayMm: 50, // any single day at or above this
  rain3DayMm: 100, // any 3-day rolling total at or above this
  heatC: 40, // daily max temperature at or above this...
  heatConsecutiveDays: 2, // ...for at least this many days in a row
  dischargeRiseRatio: 3, // forecast peak discharge vs. today's value
};

export function forecastUrl(lat, lon) {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'precipitation_sum,temperature_2m_max',
    forecast_days: '16',
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

export function floodUrl(lat, lon) {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'river_discharge',
    forecast_days: '30',
  });
  return `https://flood-api.open-meteo.com/v1/flood?${q}`;
}

/**
 * Turn Open-Meteo JSON into trigger hits. Pure; safe to unit test.
 * @returns {Array<{type:'heavy_rain'|'extreme_heat'|'river_rise', date:string, value:number, detail:string}>}
 */
export function evaluateTriggers(weather, flood, thresholds = DEFAULT_THRESHOLDS) {
  const th = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const hits = [];
  const daily = weather?.daily;
  if (daily?.time?.length) {
    const rain = daily.precipitation_sum || [];
    const tmax = daily.temperature_2m_max || [];
    for (let i = 0; i < daily.time.length; i++) {
      const r = rain[i];
      if (r != null && r >= th.rainDayMm) {
        hits.push({ type: 'heavy_rain', date: daily.time[i], value: r, detail: `${r.toFixed(0)} mm forecast in one day` });
        break;
      }
    }
    for (let i = 0; i + 2 < daily.time.length; i++) {
      const vals = [rain[i], rain[i + 1], rain[i + 2]];
      if (vals.some((v) => v == null)) continue;
      const sum = vals[0] + vals[1] + vals[2];
      if (sum >= th.rain3DayMm) {
        hits.push({ type: 'heavy_rain', date: daily.time[i], value: sum, detail: `${sum.toFixed(0)} mm forecast over 3 days` });
        break;
      }
    }
    let run = 0;
    for (let i = 0; i < daily.time.length; i++) {
      const v = tmax[i];
      run = v != null && v >= th.heatC ? run + 1 : 0;
      if (run >= th.heatConsecutiveDays) {
        const start = i - run + 1;
        hits.push({ type: 'extreme_heat', date: daily.time[start], value: v, detail: `${run}+ days at or above ${th.heatC} °C` });
        break;
      }
    }
  }
  const fd = flood?.daily;
  if (fd?.time?.length && fd.river_discharge?.length) {
    const q = fd.river_discharge;
    const base = q.find((v) => v != null && v > 0);
    if (base) {
      let peak = -Infinity;
      let peakIdx = -1;
      q.forEach((v, i) => {
        if (v != null && v > peak) {
          peak = v;
          peakIdx = i;
        }
      });
      const ratio = peak / base;
      if (ratio >= th.dischargeRiseRatio) {
        hits.push({
          type: 'river_rise',
          date: fd.time[peakIdx],
          value: peak,
          detail: `River discharge forecast to rise ${ratio.toFixed(1)}x (to ${peak.toFixed(0)} m³/s)`,
        });
      }
    }
  }
  return hits;
}

// Headline numbers for transparency, shown even when nothing triggers.
export function summarizeForecast(weather, flood) {
  const d = weather?.daily || {};
  const rain = (d.precipitation_sum || []).filter((v) => v != null);
  const tmax = (d.temperature_2m_max || []).filter((v) => v != null);
  let max3 = 0;
  for (let i = 0; i + 2 < rain.length; i++) max3 = Math.max(max3, rain[i] + rain[i + 1] + rain[i + 2]);
  const q = (flood?.daily?.river_discharge || []).filter((v) => v != null);
  const base = q.find((v) => v > 0);
  return {
    days: (d.time || []).length,
    maxRainDay: rain.length ? Math.max(...rain) : null,
    maxRain3Day: rain.length >= 3 ? max3 : null,
    maxTemp: tmax.length ? Math.max(...tmax) : null,
    dischargeRatio: base ? Math.max(...q) / base : null,
  };
}

async function getJson(url, fetchImpl, timeoutMs) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Check every point (facility or village) against live forecasts.
 * Failures are reported per point; one bad request never sinks the whole check.
 */
export async function checkLive(points, { fetchImpl = globalThis.fetch, thresholds, timeoutMs = 12000 } = {}) {
  const results = await Promise.all(
    points.map(async (p) => {
      try {
        const [weather, flood] = await Promise.all([
          getJson(forecastUrl(p.lat, p.lon), fetchImpl, timeoutMs),
          getJson(floodUrl(p.lat, p.lon), fetchImpl, timeoutMs).catch(() => null),
        ]);
        return { id: p.id, name: p.name, ok: true, hits: evaluateTriggers(weather, flood, thresholds), summary: summarizeForecast(weather, flood) };
      } catch (e) {
        return { id: p.id, name: p.name, ok: false, error: String(e?.message || e), hits: [] };
      }
    }),
  );
  return results;
}

// Convert live trigger hits into a draft event the user can review and edit.
export function draftEventFromHits(results, { facilities, villages, today, radiusKm = 8, haversineKm }) {
  const hitIds = new Set(results.filter((r) => r.hits.length).map((r) => r.id));
  if (!hitIds.size) return null;
  const allHits = results.flatMap((r) => r.hits);
  const earliest = allHits.map((h) => h.date).sort()[0];
  const types = new Set(allHits.map((h) => h.type));
  const type = types.has('river_rise') || types.has('heavy_rain') ? 'flood' : 'heat';
  const hitPoints = [...facilities, ...villages].filter((x) => hitIds.has(x.id));
  const near = (x) => hitPoints.some((h) => haversineKm(h, x) <= radiusKm);
  return {
    id: `EVT-LIVE-${earliest}`,
    type,
    title: type === 'flood' ? 'Live forecast: heavy rain / river flooding' : 'Live forecast: extreme heat',
    source: 'Open-Meteo forecast (unofficial; confirm with national met service)',
    onset: earliest < today ? today : earliest,
    durationDays: type === 'flood' ? 14 : 7,
    permanent: false,
    affectedFacilityIds: type === 'flood' ? facilities.filter(near).map((f) => f.id) : [],
    affectedVillageIds: villages.filter(near).map((v) => v.id),
    description: allHits.map((h) => h.detail).slice(0, 4).join('; '),
  };
}
