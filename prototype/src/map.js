// Offline SVG map: no tile server needed, works on a phone with no data.
import { haversineKm } from './engine.js';

const W = 800;
const H = 560;

export function makeProjection(points) {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);
  const padLat = (maxLat - minLat) * 0.12 || 0.05;
  const padLon = (maxLon - minLon) * 0.08 || 0.05;
  minLat -= padLat;
  maxLat += padLat;
  minLon -= padLon;
  maxLon += padLon;
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLon - minLon) * k;
  const spanY = maxLat - minLat;
  const scale = Math.min(W / spanX, H / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;
  const project = (p) => [offX + (p.lon - minLon) * k * scale, offY + (maxLat - p.lat) * scale];
  // km per SVG unit, for radii and the scale bar
  const kmPerUnit = haversineKm({ lat: minLat, lon: minLon }, { lat: minLat, lon: maxLon }) / (spanX * scale);
  return { project, kmPerUnit, W, H };
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const HAZARD_COLOR = {
  cyclone: 'var(--flood)',
  flood: 'var(--flood)',
  heat: 'var(--heat)',
  closure: 'var(--closure)',
  conflict: 'var(--closure)',
  outbreak: 'var(--heat)',
};

/**
 * @param {object} o
 * @param {Array} o.facilities
 * @param {Array} o.villages
 * @param {Array<[number,number]>} o.river [[lat, lon], ...]
 * @param {object} o.event
 * @param {Map<string,{total:number, atRisk:number}>} o.villageStats
 * @param {boolean} o.editMode
 */
export function renderMap({ facilities, villages, river, event, villageStats, editMode }) {
  const riverPts = (river || []).map(([lat, lon]) => ({ lat, lon }));
  const { project, kmPerUnit } = makeProjection([...facilities, ...villages, ...riverPts]);
  const affV = new Set(event?.affectedVillageIds || []);
  const affF = new Set(event?.affectedFacilityIds || []);
  const hazardColor = HAZARD_COLOR[event?.type] || 'var(--flood)';
  const rKm = 4.5;
  const r = rKm / kmPerUnit;

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="map-title map-desc" class="map-svg${editMode ? ' editing' : ''}">`);
  parts.push(`<title id="map-title">District map</title>`);
  parts.push(
    `<desc id="map-desc">${affV.size} villages and ${affF.size} facilities inside the disruption area. Circles are villages sized by number of chronic-care patients; squares are health facilities.</desc>`,
  );
  parts.push(`<defs>
    <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--closure)" stroke-width="3"/></pattern>
  </defs>`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" class="map-land" rx="10"/>`);

  // Hazard footprint: union of discs (opaque inside a translucent group).
  if (affV.size || affF.size) {
    parts.push(`<g class="hazard" opacity="0.22" fill="${hazardColor}">`);
    for (const v of villages) if (affV.has(v.id)) { const [x, y] = project(v); parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`); }
    for (const f of facilities) if (affF.has(f.id) && event?.type !== 'closure') { const [x, y] = project(f); parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.8).toFixed(1)}"/>`); }
    parts.push(`</g>`);
  }

  if (riverPts.length > 1) {
    const d = riverPts.map((p, i) => { const [x, y] = project(p); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
    parts.push(`<path d="${d}" class="map-river"/>`);
  }

  // Villages
  for (const v of villages) {
    const [x, y] = project(v);
    const st = villageStats.get(v.id) || { total: 0, atRisk: 0 };
    const rad = 5 + Math.sqrt(st.total) * 1.6;
    const exposed = affV.has(v.id);
    const cls = ['village', exposed ? 'exposed' : '', st.atRisk ? 'has-risk' : ''].join(' ');
    const label = `${v.name}: ${st.total} patients${exposed ? `, ${st.atRisk} need action` : ''}`;
    parts.push(
      `<g class="${cls}" data-kind="village" data-id="${esc(v.id)}" tabindex="${editMode ? 0 : -1}" role="${editMode ? 'button' : 'img'}" aria-label="${esc(label)}${editMode ? (exposed ? ' (in area: click to remove)' : ' (click to add to area)') : ''}">` +
        `<title>${esc(label)}</title>` +
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" class="village-dot"/>` +
        (st.atRisk ? `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="village-count">${st.atRisk}</text>` : '') +
        `<text x="${x.toFixed(1)}" y="${(y + rad + 13).toFixed(1)}" class="map-label">${esc(v.name)}</text>` +
        `</g>`,
    );
  }

  // Facilities
  for (const f of facilities) {
    const [x, y] = project(f);
    const disrupted = affF.has(f.id);
    const s = f.type === 'hospital' ? 18 : f.type === 'health_post' ? 12 : 15;
    const status = f.status === 'closed' ? 'closed' : disrupted ? (event?.type === 'closure' ? 'closing' : 'in hazard zone') : 'open';
    const label = `${f.name} (${status})`;
    parts.push(
      `<g class="facility ${disrupted ? 'disrupted' : ''} ${f.status === 'closed' ? 'closed' : ''}" data-kind="facility" data-id="${esc(f.id)}" tabindex="${editMode ? 0 : -1}" role="${editMode ? 'button' : 'img'}" aria-label="${esc(label)}">` +
        `<title>${esc(label)}</title>` +
        `<rect x="${(x - s / 2).toFixed(1)}" y="${(y - s / 2).toFixed(1)}" width="${s}" height="${s}" rx="3" class="facility-box" ${disrupted && event?.type === 'closure' ? 'fill="url(#hatch)"' : ''}/>` +
        `<path d="M${x.toFixed(1)},${(y - s * 0.3).toFixed(1)} v${(s * 0.6).toFixed(1)} M${(x - s * 0.3).toFixed(1)},${y.toFixed(1)} h${(s * 0.6).toFixed(1)}" class="facility-cross"/>` +
        `<text x="${(x + s / 2 + 5).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="map-label facility-label">${esc(f.name.replace(/ (Health Centre|Health Post|District Hospital|Clinic)$/, ''))}</text>` +
        `</g>`,
    );
  }

  // Scale bar (10 km)
  const bar = 10 / kmPerUnit;
  parts.push(
    `<g class="scalebar" transform="translate(${W - bar - 24},${H - 22})"><line x1="0" y1="0" x2="${bar.toFixed(1)}" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1="${bar.toFixed(1)}" y1="-4" x2="${bar.toFixed(1)}" y2="4"/><text x="${(bar / 2).toFixed(1)}" y="-7">10 km</text></g>`,
  );
  parts.push(`</svg>`);
  return parts.join('');
}
