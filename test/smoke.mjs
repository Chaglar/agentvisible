/* test/smoke.mjs — drives the whole app in a real browser and checks it works.
 *
 *   node dev-server.js          (in one terminal)
 *   node test/smoke.mjs         (in another)
 *
 * It sits a NAPLAN test, works the fix-up round, submits a piece of writing both
 * typed and as a photo, and then opens the dashboard in a SEPARATE browser profile
 * to prove the record really is on the server rather than in one browser's
 * localStorage. Screenshots land in test/screenshots/.
 *
 * It works on its own throwaway profile (SMOKE_PROFILE, default "smoke-test") and
 * wipes it before and after, so a run is repeatable and can never touch Leo's real
 * record — including when SMOKE_BASE points at the deployed site.
 *
 * Exits non-zero if anything fails, so it can gate a deploy.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.SMOKE_BASE || 'http://localhost:8788';
const PROFILE = process.env.SMOKE_PROFILE || 'smoke-test';
const KEY = process.env.LEO_ACCESS_KEY || '';
const SHOTS = path.join(path.dirname(new URL(import.meta.url).pathname), 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
let failures = 0;
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  if (!pass) failures++;
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`);
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAAP0lEQVR42u3QMQEAAAjAILV/51nBzwci0' +
  'CmsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4bbYAAT0lRkQAAAAASUVORK5CYII=', 'base64');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const errors = [];

/* Start from nothing. Without this a leftover dev-server keeps the previous run's
   answers and every count below would assert against stale data — which is exactly
   how a passing test stops meaning anything. */
async function wipe() {
  const r = await fetch(`${BASE}/api/progress?profile=${encodeURIComponent(PROFILE)}`,
    { method: 'DELETE', headers: KEY ? { 'x-leo-key': KEY } : {} });
  if (!r.ok) throw new Error(`could not wipe ${PROFILE}: HTTP ${r.status}`);
}
await wipe();

/* Point a fresh browser profile at our throwaway record before any script runs. */
const seed = ctx => ctx.addInitScript(([profile, key]) => {
  try {
    localStorage.setItem('leo.progress.v2', JSON.stringify({ v: 2, profileId: profile }));
    if (key) localStorage.setItem('leo.accesskey', key);
  } catch (e) { /* private mode; the run will fail loudly further down */ }
}, [PROFILE, KEY]);

/* ---------------- the child's device ---------------- */
const kid = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await seed(kid);
const page = await kid.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push('kid console: ' + m.text()); });
page.on('pageerror', e => errors.push('kid pageerror: ' + e.message));

await page.goto(BASE + '/leo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

check('home page loads', await page.locator('[data-mode="naplan"]').isVisible());
check('server reachable', (await page.locator('#chipSync').getAttribute('title')) === 'Synced',
  await page.locator('#chipSync').getAttribute('title'));
check('writing tasks offered', (await page.locator('[data-write]').count()) === 3);
await shot(page, '01-home');

/* ---------------- sit a NAPLAN test ---------------- */
await page.click('[data-mode="naplan"]');
await page.waitForSelector('#qChoices .ch');
await shot(page, '02-question');

let intendedCorrect = 0;
const levels = [];
for (let i = 0; i < 12; i++) {
  await page.waitForSelector('#qChoices .ch');
  const correct = await page.evaluate(() => window.LEO.debug.answerIndex());
  const n = await page.locator('#qChoices .ch').count();
  levels.push(await page.evaluate(() => {
    const on = document.querySelectorAll('#ladder b.on').length; return on;
  }));
  // answer the first nine right, the last three wrong, so the fix-up round has work
  const right = i < 9;
  if (right) intendedCorrect++;
  await page.click(`#qChoices .ch >> nth=${right ? correct : (correct + 1) % n}`);
  if (i === 0) await shot(page, '03-feedback');
  await page.click('#btnNext');
}

await page.waitForSelector('#result:not(.hide)', { timeout: 10000 });
await page.waitForTimeout(600);
const scoreText = await page.locator('#rScore').textContent();
check('test completes and scores', scoreText === `${intendedCorrect}/12`, `showed ${scoreText}, expected ${intendedCorrect}/12`);
check('difficulty climbed with success', Math.max(...levels) > levels[0], `ladder went ${levels[0]} → ${Math.max(...levels)}`);
check('every question listed on the result', (await page.locator('#rList .rrow').count()) === 12);
check('fix-up round offered', await page.locator('#btnFix').isVisible());
await shot(page, '04-result');

/* ---------------- fix-ups ---------------- */
await page.click('#btnFix');
await page.waitForSelector('#coach:not(.hide)');
check('a lesson opens for a wrong answer', (await page.locator('#cTitle').textContent()).length > 5,
  await page.locator('#cTitle').textContent());
await shot(page, '05-lesson');

let guard = 0, fixedOne = false;
while (guard++ < 40) {
  const screen = await page.evaluate(() => window.LEO.debug.screen());
  if (screen === 'result') break;
  const tryVisible = !(await page.locator('#cTry').getAttribute('class')).includes('hide');
  const answered = await page.evaluate(() => document.getElementById('cQChoices').dataset.done === '1');
  if (tryVisible && !answered) {
    const ci = await page.evaluate(() => window.LEO.debug.coachAnswerIndex());
    await page.click(`#cQChoices .ch >> nth=${ci}`);            // get the retry right
    await page.waitForTimeout(150);
    if (!fixedOne) { await shot(page, '06-fixed'); fixedOne = true; }
  } else {
    await page.click('#cNext');
    await page.waitForTimeout(150);
  }
}
await page.waitForSelector('#result:not(.hide)');
const fixScore = await page.locator('#rScore').textContent();
check('fix-up round completes', /^\d+\/\d+$/.test(fixScore), 'fixed ' + fixScore);
const fixups = Number(fixScore.split('/')[1]);
await shot(page, '07-fixups-done');

/* ---------------- writing: typed ---------------- */
await page.click('#btnHome');
await page.click('[data-write="spark"]');
await page.waitForSelector('#write:not(.hide)');
await shot(page, '08-writing-task');
await page.click('#wType');
await page.fill('#wText', 'The octopus is called Bob. He liv in a cave and he is verry shy.');
await page.click('#wSendTyped');
await page.waitForSelector('#wResult:not(.hide)', { timeout: 20000 });
await page.waitForTimeout(400);
const typedSections = await page.locator('.wsec h3').allTextContents();
check('typed writing is marked', (await page.locator('#wScores .n').count()) === 5);
check('typed work gets no handwriting notes', !typedSections.some(t => t.includes('letters')),
  typedSections.join(' / '));
await shot(page, '09-writing-typed');

/* ---------------- writing: photo ---------------- */
await page.click('#wDone');
await page.click('[data-write="short"]');
await page.waitForSelector('#write:not(.hide)');
await page.setInputFiles('#wFile', { name: 'page.png', mimeType: 'image/png', buffer: PNG });
await page.waitForSelector('#wPreview:not(.hide)', { timeout: 8000 });
const src = await page.evaluate(() => document.getElementById('wImg').src.slice(0, 22));
check('photo is downscaled before upload', src === 'data:image/jpeg;base64', src);
await page.click('#wSend');
await page.waitForSelector('#wResult:not(.hide)', { timeout: 20000 });
await page.waitForTimeout(400);
const photoSections = await page.locator('.wsec h3').allTextContents();
check('photo writing gets handwriting notes', photoSections.some(t => t.includes('letters')),
  photoSections.join(' / '));
await shot(page, '10-writing-photo');

const kidState = await page.evaluate(() => {
  const st = window.LEO.store.load();
  return { answers: st.answers.length, sessions: st.sessions.length, writing: st.writing.length,
           pendingAnswers: st.pending.answers.length, pendingWriting: st.pending.writing.length };
});
check('nothing left unsynced', kidState.pendingAnswers === 0 && kidState.pendingWriting === 0,
  JSON.stringify(kidState));
// The record was wiped at the start, so these are exact, not "at least".
const want = { answers: 12 + fixups, sessions: 2, writing: 2 };
check('the record holds exactly what was done',
  kidState.answers === want.answers && kidState.sessions === want.sessions && kidState.writing === want.writing,
  `got ${kidState.answers}/${kidState.sessions}/${kidState.writing}, want ${want.answers}/${want.sessions}/${want.writing} (answers/sessions/writing)`);

/* ---------------- the parent's device: a DIFFERENT browser profile ---------------- */
const parent = await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
await seed(parent);
const dash = await parent.newPage();
dash.on('console', m => { if (m.type() === 'error') errors.push('dash console: ' + m.text()); });
dash.on('pageerror', e => errors.push('dash pageerror: ' + e.message));
await dash.goto(BASE + '/leo/admin/', { waitUntil: 'networkidle' });
await dash.waitForTimeout(1500);

const seen = await dash.evaluate(() => {
  const st = window.LEO.store.load();
  return { answers: st.answers.length, sessions: st.sessions.length, writing: st.writing.length };
});
check('fresh device sees the answers', seen.answers === kidState.answers, `${seen.answers} vs ${kidState.answers}`);
check('fresh device sees the sessions', seen.sessions === kidState.sessions, `${seen.sessions} vs ${kidState.sessions}`);
check('fresh device sees the writing', seen.writing === kidState.writing, `${seen.writing} vs ${kidState.writing}`);

check('percentile reported', /\d/.test(await dash.locator('.kpi .v').first().textContent()),
  (await dash.locator('.kpi .v').first().textContent()).trim());
check('ability chart drawn', (await dash.locator('#chartAbility svg').count()) === 1);
check('topic table populated', (await dash.locator('#topicTable tbody tr').count()) >= 5);
check('curriculum codes shown', /AC9/.test(await dash.locator('#topicTable').textContent()));
check('accuracy-by-difficulty chart drawn', (await dash.locator('#chartLevels svg').count()) === 1);
check('writing section populated', (await dash.locator('#writeTable tbody tr').count()) >= 2);
check('writing score chart drawn', (await dash.locator('#chartWriting svg').count()) === 1);
check('session log lists the rounds', (await dash.locator('#sessionTable tbody tr').count()) >= 2);
check('recommendations produced', (await dash.locator('#recs .rec').count()) >= 1);
await shot(dash, '11-dashboard');

check('no console or page errors anywhere', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
await wipe();   // leave nothing behind

console.log('\n' + '─'.repeat(58));
console.log(`${results.length - failures}/${results.length} checks passed`);
console.log(`screenshots: ${SHOTS}`);
if (failures) {
  console.log('\nfailed:');
  results.filter(r => !r.pass).forEach(r => console.log('  · ' + r.name + (r.detail ? ' — ' + r.detail : '')));
}
process.exit(failures ? 1 : 0);
