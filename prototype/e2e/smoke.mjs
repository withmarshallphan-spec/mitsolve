// End-to-end smoke test in headless Chromium.
// Usage: npm run e2e            (assertions only)
//        SHOTS=dir npm run e2e  (also save screenshots to dir)
import { createRequire } from 'node:module';
// Playwright is not a dependency: use a global install (`npm i -g playwright`)
// or a local one (`npm i -D playwright && npx playwright install chromium`).
const { chromium } = createRequire(import.meta.url)('playwright');
import { startServer } from './serve.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const shots = process.env.SHOTS;
if (shots) await mkdir(shots, { recursive: true });

const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
let failed = false;

async function check(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failed = true;
    console.log(`not ok - ${name}\n  ${e.message.split('\n').join('\n  ')}`);
  }
}

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: shots ? 2 : 1 });
  // Block outbound forecast calls: the e2e must not depend on the network.
  await ctx.route(/open-meteo\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  await page.goto(base);
  await page.waitForSelector('.kpi .v');

  await check('loads cyclone scenario with KPIs, map and action list', async () => {
    const kpi = await page.locator('.kpi .v').first().textContent();
    assert.ok(Number(kpi) > 0, `first KPI is ${kpi}`);
    assert.equal(await page.locator('.map-svg .village').count(), 16);
    assert.ok((await page.locator('tbody tr.row-main').count()) > 10);
  });
  if (shots) await page.screenshot({ path: `${shots}/desktop-cyclone.png`, fullPage: false });

  await check('row expands to show priority reasons', async () => {
    await page.locator('tbody tr.row-main').first().click();
    await page.waitForSelector('tr.row-detail');
    assert.match(await page.locator('tr.row-detail').first().textContent(), /Why this priority/);
  });

  await check('filters narrow the list', async () => {
    const before = await page.locator('tbody tr.row-main').count();
    await page.selectOption('#f-condition', 'TB');
    const after = await page.locator('tbody tr.row-main').count();
    assert.ok(after > 0 && after < before, `${before} -> ${after}`);
    const conds = await page.locator('tbody tr.row-main td:nth-child(3)').allTextContents();
    assert.ok(conds.every((c) => c.includes('Tuberculosis')));
    await page.selectOption('#f-condition', '');
  });

  await check('status change updates reached KPI', async () => {
    await page.locator('select.status').first().selectOption('collected');
    const reached = await page.locator('.kpi').nth(3).locator('.s').textContent();
    assert.match(reached, /^1 of /);
  });

  await check('stock tab shows transfers / balances', async () => {
    await page.click('#tab-stock');
    await page.waitForSelector('#panel table');
    assert.match(await page.locator('#panel').textContent(), /Facility stock vs. plan demand/);
  });
  if (shots) await page.screenshot({ path: `${shots}/desktop-stock.png` });

  await check('messages tab renders condition-neutral SMS', async () => {
    await page.click('#tab-messages');
    await page.waitForSelector('.msg');
    const txt = (await page.locator('.msg .body').allTextContents()).join(' ');
    assert.doesNotMatch(txt, /HIV|tubercul|epilep|insulin/i);
    assert.match(txt, /Alerta de saude|Health alert|Tahadhari/);
  });
  if (shots) await page.screenshot({ path: `${shots}/desktop-messages.png` });

  await check('follow-up: simulate pickups then trace after deadline', async () => {
    await page.click('#tab-follow');
    await page.click('[data-cmd="simulate-pickups"]');
    await page.check('#simulate-after');
    const n = await page.locator('#panel tbody tr').count();
    assert.ok(n > 0, 'tracing list has patients');
    const pct = await page.locator('.kpi').nth(3).locator('.v').textContent();
    assert.ok(parseInt(pct, 10) >= 60, `coverage ${pct}`);
  });
  if (shots) await page.screenshot({ path: `${shots}/desktop-followup.png` });

  await check('closure scenario reroutes patients', async () => {
    await page.click('[data-scenario="closure"]');
    await page.click('#tab-actions');
    const actions = await page.locator('tbody tr.row-main td:nth-child(5) b').allTextContents();
    assert.ok(actions.length > 0);
    assert.ok(actions.every((a) => /Reroute|CHW/.test(a)), actions.join(','));
  });
  if (shots) await page.screenshot({ path: `${shots}/desktop-closure.png` });

  await check('editing the area on the map re-plans', async () => {
    await page.click('[data-scenario="heat"]');
    const before = Number(await page.locator('.kpi .v').first().textContent());
    await page.click('#edit-area-btn');
    await page.locator('.map-svg [data-kind="village"][data-id="V01"]').click();
    await page.locator('.map-svg [data-kind="village"][data-id="V04"]').click();
    const after = Number(await page.locator('.kpi .v').first().textContent());
    assert.ok(after > before, `${before} -> ${after}`);
    await page.click('#edit-area-btn');
  });

  await check('settings change re-plans (longer buffer => more patients)', async () => {
    await page.click('[data-scenario="cyclone"]');
    const before = Number(await page.locator('.kpi .v').first().textContent());
    await page.click('#tab-data');
    await page.fill('[data-setting="bufferDays"]', '30');
    await page.locator('[data-setting="bufferDays"]').dispatchEvent('change');
    const after = Number(await page.locator('.kpi .v').first().textContent());
    assert.ok(after >= before, `${before} -> ${after}`);
    await page.click('[data-cmd="restore-rules"]');
  });

  await check('CSV import with a bad row reports the error and keeps good rows', async () => {
    const csv = 'patient_id,village_id,facility_id,condition,last_refill,days_supplied\nX1,V03,F2,HIV,2026-10-01,30\nX2,V03,F2,MALARIA,2026-10-01,30\n';
    await page.setInputFiles('#import-file', { name: 'p.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForSelector('.errors li');
    assert.match(await page.locator('.errors').textContent(), /Line 3: unknown condition/);
    assert.match(await page.locator('#panel').textContent(), /Using imported data:\s*1 patients/);
    await page.click('[data-cmd="use-demo"]');
  });

  await check('live forecast check fails gracefully when the network is blocked', async () => {
    await page.click('[data-scenario="live"]');
    await page.waitForFunction(() => !document.querySelector('#event-card')?.textContent.includes('Checking live'));
    assert.match(await page.locator('#event-card').textContent(), /did not respond|offline/i);
  });

  await check('work list export downloads a CSV', async () => {
    await page.click('[data-scenario="cyclone"]');
    await page.click('#tab-actions');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-cmd="export-worklist"]')]);
    assert.match(dl.suggestedFilename(), /worklist.*\.csv$/);
  });

  await check('state survives reload (localStorage)', async () => {
    await page.click('[data-scenario="closure"]');
    await page.reload();
    await page.waitForSelector('.kpi .v');
    assert.equal(await page.locator('[data-scenario="closure"]').getAttribute('aria-checked'), 'true');
    await page.click('[data-scenario="cyclone"]');
  });

  // Mobile layout: no horizontal scroll, cards instead of table
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: shots ? 3 : 1, isMobile: true, hasTouch: true });
  await m.route(/open-meteo\.com/, (r) => r.abort());
  const mp = await m.newPage();
  mp.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
  await mp.goto(base);
  await mp.waitForSelector('.kpi .v');
  await check('mobile: no horizontal page scroll', async () => {
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `page overflows by ${overflow}px`);
  });
  if (shots) {
    await mp.screenshot({ path: `${shots}/mobile-top.png` });
    await mp.locator('.work-card').scrollIntoViewIfNeeded();
    await mp.screenshot({ path: `${shots}/mobile-actions.png` });
  }

  await check('no console or page errors', async () => {
    assert.deepEqual(errors.filter((e) => !/open-meteo|ERR_FAILED|Failed to load resource/.test(e)), []);
  });
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
