/* test/smoke.mjs — drives the whole app in a real browser and checks it works.
 *
 *   node dev-server.js          (in one terminal)
 *   node test/smoke.mjs         (in another)
 *
 * It sits a NAPLAN test, works the fix-up round, drills a set of number facts,
 * submits a piece of writing both typed and as a photo, and then opens the dashboard in a SEPARATE browser profile
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

let intendedCorrect = 0, changedSelection = false;
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
  if (i === 1 && n > 1) {
    // tap the wrong one first, then move the highlight — a mis-tap must be undoable
    await page.click(`#qChoices .ch >> nth=${(correct + 1) % n}`);
    await page.click(`#qChoices .ch >> nth=${correct}`);
    changedSelection = (await page.locator('#qChoices .ch.sel').count()) === 1 &&
      await page.locator(`#qChoices .ch >> nth=${correct}`).evaluate(e => e.classList.contains('sel'));
  }
  await page.click(`#qChoices .ch >> nth=${right ? correct : (correct + 1) % n}`);
  if (i === 0) {
    // choosing must not answer: nothing is recorded until "Check my answer"
    check('a tap only highlights, it does not answer',
      (await page.locator('#qChoices .ch.sel').count()) === 1 &&
      (await page.locator('#qFeedback').textContent()).trim() === '');
    await shot(page, '03-chosen');
  }
  await page.click('#btnCheck');
  if (i === 0) await shot(page, '03-feedback');
  await page.click('#btnNext');
}

await page.waitForSelector('#result:not(.hide)', { timeout: 10000 });
await page.waitForTimeout(600);
const scoreText = await page.locator('#rScore').textContent();
check('test completes and scores', scoreText === `${intendedCorrect}/12`, `showed ${scoreText}, expected ${intendedCorrect}/12`);
check('difficulty climbed with success', Math.max(...levels) > levels[0], `ladder went ${levels[0]} → ${Math.max(...levels)}`);
check('every question listed on the result', (await page.locator('#rList .rrow').count()) === 12);
check('a selection can be changed before checking', changedSelection);
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
    await page.click('#cCheck');
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

/* ---------------- the reading shelf ---------------- */
await page.click('#btnHome');                      // the fix-up round ends on the result screen
await page.waitForSelector('#home:not(.hide)');
check('shelf starts empty', /No books yet/.test(await page.locator('#shelf').textContent()));
await page.click('#btnAddBook');
await page.waitForSelector('#addBook:not(.hide)');
check('books are suggested, not typed', (await page.locator('[data-pick]').count()) >= 8,
  (await page.locator('[data-pick]').count()) + ' suggestions');
await page.click('[data-pick="banjo"]');
await page.waitForSelector('#logRead:not(.hide)');
check('listening is offered as an equal way to read',
  (await page.locator('#logHow [data-how="listen"]').count()) === 1 &&
  (await page.locator('#logHow [data-how="together"]').count()) === 1);
await page.click('#logHow [data-how="listen"]');
await page.click('#logMins button[data-m="20"]');
await shot(page, '15-book-log');
await page.click('#logSave');
await page.waitForSelector('#home:not(.hide)');
await page.waitForTimeout(400);
check('a sticker lands on the cover', (await page.locator('#shelf .st').count()) === 1);

for (let i = 0; i < 4; i++) {
  await page.click('#shelf [data-book="banjo"]');
  await page.waitForSelector('#logRead:not(.hide)');
  await page.click('#logSave');
  await page.waitForSelector('#home:not(.hide)');
  await page.waitForTimeout(90);
}
const stickers = await page.locator('#shelf .st').count();
check('stickers accumulate', stickers === 5, stickers + ' after 5 sittings');

/* A sticker placed off the cover reads as one silently going missing — the signed
   shift that caused exactly that is why this is checked rather than eyeballed. */
const placed = await page.evaluate(() => {
  const B = window.LEO.books;
  let out = { n: 0, bad: 0, emoji: {} };
  for (let i = 0; i < 4000; i++) {
    const s = B.placeSticker('bk' + i + ':' + (1700000000000 + i * 371));
    out.n++;
    if (!(s.x >= 5 && s.x <= 82 && s.y >= 30 && s.y <= 84 && s.rot >= -20 && s.rot <= 20)) out.bad++;
    out.emoji[s.emoji] = 1;
  }
  out.distinct = Object.keys(out.emoji).length;
  return out;
});
check('stickers stay on the cover and vary',
  placed.bad === 0 && placed.distinct >= 10,
  `${placed.n} placed, ${placed.bad} off-cover, ${placed.distinct} different stickers`);

await page.click('#shelf [data-book="banjo"]');
await page.waitForSelector('#logRead:not(.hide)');
await page.click('#logFinish');
await page.waitForSelector('#home:not(.hide)');
await page.waitForTimeout(600);
check('finishing a book shows a ribbon', (await page.locator('#shelf .ribbon').count()) === 1);
await shot(page, '16-shelf');

/* ---------------- fast maths ---------------- */
check('fact sets offered', (await page.locator('[data-fact]').count()) === 3);
await page.click('[data-fact="tables"]');
await page.waitForSelector('#fluency:not(.hide)');
check('a fact question is asked', /[0-9]/.test(await page.locator('#fPrompt').textContent()),
  await page.locator('#fPrompt').textContent());
await shot(page, '12-fact-question');

// The app decides how long a set is; ask the screen rather than assuming.
const FACTS_N = await page.locator('#fDots i').count();
check('a fact set is a sensible length', FACTS_N >= 10 && FACTS_N <= 30, FACTS_N + ' facts');

let factRight = 0, sawQuick = false, sawHint = false;
for (let i = 0; i < FACTS_N; i++) {
  await page.waitForSelector('#fPad button[data-k="ok"]:not([disabled])');
  const want = await page.evaluate(() => window.LEO.debug.factAnswer());
  const right = i % 4 !== 3;                       // three right, one wrong, repeating
  const typed = String(right ? want : want + 1);
  if (right) factRight++;
  for (const ch of typed) await page.click(`#fPad button[data-k="${ch}"]`);
  await page.click('#fPad button[data-k="ok"]');
  await page.waitForSelector('#fNext:not(.hide)');
  const mark = (await page.locator('#fMark').textContent()) || '';
  if (right && /straight out of your head/i.test(mark)) sawQuick = true;
  if (!right && (await page.locator('.fhint').count())) sawHint = true;
  if (i === 0) await shot(page, '13-fact-marked');
  if (i === 3) {
    check('a wrong answer shows the right one',
      (await page.locator('#fAns').textContent()).includes(String(want)),
      (await page.locator('#fAns').textContent()).trim());
  }
  await page.click('#fNext');
}
check('answering fast is recognised', sawQuick);
check('a wrong fact gets a structure hint', sawHint);

await page.waitForSelector('#fResult:not(.hide)', { timeout: 8000 });
await page.waitForTimeout(300);
check('fact set scores correctly',
  (await page.locator('#frStats').textContent()).includes(factRight + '/' + FACTS_N),
  (await page.locator('#frStats').textContent()).replace(/\s+/g, ' ').trim());
check('slow and wrong facts are listed for another go',
  (await page.locator('#frList .frow').count()) >= FACTS_N - factRight);
await shot(page, '14-fact-result');
await page.click('#frHome');            // this already returns to the home screen

/* ---------------- writing: typed ---------------- */
await page.waitForSelector('#home:not(.hide)');
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
           facts: st.facts.length, library: st.library.length,
           pendingAnswers: st.pending.answers.length, pendingWriting: st.pending.writing.length,
           pendingFacts: st.pending.facts.length, pendingLibrary: st.pending.library.length };
});
check('nothing left unsynced',
  kidState.pendingAnswers === 0 && kidState.pendingWriting === 0 && kidState.pendingFacts === 0 &&
  kidState.pendingLibrary === 0,
  JSON.stringify(kidState));
// The record was wiped at the start, so these are exact, not "at least".
const want = { answers: 12 + fixups, sessions: 2, writing: 2, facts: FACTS_N };
check('the record holds exactly what was done',
  kidState.answers === want.answers && kidState.sessions === want.sessions &&
  kidState.writing === want.writing && kidState.facts === want.facts,
  `got ${kidState.answers}/${kidState.sessions}/${kidState.writing}/${kidState.facts}, ` +
  `want ${want.answers}/${want.sessions}/${want.writing}/${want.facts} (answers/sessions/writing/facts)`);

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
  return { answers: st.answers.length, sessions: st.sessions.length, writing: st.writing.length,
           facts: st.facts.length, library: st.library.length };
});
check('fresh device sees the answers', seen.answers === kidState.answers, `${seen.answers} vs ${kidState.answers}`);
check('fresh device sees the sessions', seen.sessions === kidState.sessions, `${seen.sessions} vs ${kidState.sessions}`);
check('fresh device sees the writing', seen.writing === kidState.writing, `${seen.writing} vs ${kidState.writing}`);
check('fresh device sees the fact attempts', seen.facts === kidState.facts, `${seen.facts} vs ${kidState.facts}`);
check('fresh device sees the reading shelf', seen.library === kidState.library, `${seen.library} vs ${kidState.library}`);

check('percentile reported', /\d/.test(await dash.locator('.kpi .v').first().textContent()),
  (await dash.locator('.kpi .v').first().textContent()).trim());
check('ability chart drawn', (await dash.locator('#chartAbility svg').count()) === 1);
check('topic table populated', (await dash.locator('#topicTable tbody tr').count()) >= 5);
check('curriculum codes shown', /AC9/.test(await dash.locator('#topicTable').textContent()));
check('accuracy-by-difficulty chart drawn', (await dash.locator('#chartLevels svg').count()) === 1);
check('writing section populated', (await dash.locator('#writeTable tbody tr').count()) >= 2);
check('writing score chart drawn', (await dash.locator('#chartWriting svg').count()) === 1);
check('session log lists the rounds', (await dash.locator('#sessionTable tbody tr').count()) >= 2);
check('reading panel populated', (await dash.locator('#libTable tbody tr').count()) === 1);
check('reading panel shows how he reads', /🎧/.test(await dash.locator('#libStats').textContent()));
check('number-fact section populated', (await dash.locator('.ftrack').count()) === 6);
check('fact heatmap drawn', (await dash.locator('#factGrid .fcell').count()) === 44);
check('heatmap separates wrong from slow',
  (await dash.locator('#factGrid .fcell:not(.new)').count()) > 0,
  (await dash.locator('#factGrid .fcell:not(.new)').count()) + ' cells have data');
check('slowest facts listed', (await dash.locator('#factTable tbody tr').count()) >= 1);
check('recommendations produced', (await dash.locator('#recs .rec').count()) >= 1);
await shot(dash, '11-dashboard');

/* Extract-matching options ARE the labels, so a shuffle would silently mark the
   wrong extract correct — invisible in the UI and wrong on every attempt. */
const labelCheck = await dash.evaluate(() => {
  const L = window.LEO;
  let seen = 0, bad = 0;
  for (let i = 0; i < 3000; i++) {
    const q = L.bank.topics.reading.gen(5, L.RNG(i));
    if (!/^Which extract/.test(q.prompt)) continue;
    seen++;
    if (q.choices.map(c => c.text).join('') !== 'ABCD') { bad++; continue; }
    if ('ABCD'[q.answer] !== q.explain.trim()[0]) bad++;
  }
  return { seen, bad };
});
check('extract-matching keeps its labels in order',
  labelCheck.seen > 50 && labelCheck.bad === 0,
  `${labelCheck.seen} rendered, ${labelCheck.bad} wrong`);

/* The generated Thinking Skills questions state their own arithmetic in the
   explanation, so the question can be checked against itself: a solid whose rate
   does not divide evenly, or whose marked answer is not the product it prints,
   would teach the child something false while looking entirely plausible. */
const generated = await dash.evaluate(() => {
  const L = window.LEO;
  let spatial = 0, argue = 0, bad = [];
  for (let lv = 3; lv <= 5; lv++) {
    for (let i = 0; i < 300; i++) {
      const q = L.bank.topics.thinking.gen(lv, L.RNG(lv * 811 + i));
      if (q.choices.length !== 4 || q.answer == null || q.answer < 0 || q.answer > 3) {
        bad.push(q.sub + ': malformed'); continue;
      }
      if (new Set(q.choices.map(c => c.text || 'v')).size !== 4 && q.choices.every(c => c.text)) {
        bad.push(q.sub + ': duplicate options'); continue;
      }
      if (q.sub === 'Solids and joins') {
        spatial++;
        const rate = q.explain.match(/(\d+) ÷ (\d+) = <b>(\d+) seconds per face/);
        const prod = q.explain.match(/(\d+) × (\d+) = <b>(\d+) seconds/);
        if (!rate || !prod) { bad.push('solids: unparseable'); continue; }
        if (+rate[1] / +rate[2] !== +rate[3]) bad.push('solids: rate not whole');
        if (+prod[1] * +prod[2] !== +prod[3]) bad.push('solids: product wrong');
        if (q.choices[q.answer].text !== prod[3] + ' seconds') bad.push('solids: answer mismatch');
      }
      if (/flaw|Weaken|conclusion|reasoning holds/i.test(q.sub || '')) argue++;
    }
  }
  return { spatial, argue, bad: bad.slice(0, 4), nbad: bad.length };
});
check('generated thinking questions are self-consistent',
  generated.nbad === 0 && generated.spatial > 20 && generated.argue > 100,
  `${generated.spatial} spatial, ${generated.argue} argument, ${generated.nbad} bad` +
  (generated.bad.length ? ' — ' + generated.bad.join('; ') : ''));

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
