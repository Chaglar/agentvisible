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
/* A book we hold the text of goes straight to its contents; one we do not goes to
   the sticker log. Both paths matter. */
await page.click('[data-pick="alice"]');
await page.waitForSelector('#chapters:not(.hide)', { timeout: 15000 });
const chapters = await page.locator('.cpRow').count();
check('a book opens its own chapter list', chapters === 12, chapters + ' chapters');
check('the source is credited',
  /Project Gutenberg/.test(await page.locator('#cpMeta').textContent()),
  (await page.locator('#cpMeta').textContent()).trim());
await page.click('.cpRow[data-ch="0"]');
await page.waitForSelector('#reader:not(.hide)');
await page.waitForTimeout(300);
const tappable = await page.locator('#rdBody w').count();
check('the real text is there, every word tappable', tappable > 1500, tappable + ' words');
check('it is the actual book',
  /Alice was beginning to get very tired/.test(await page.locator('#rdBody p').first().textContent()));
check('the chapter head carries a drawing', (await page.locator('.rdArt svg').count()) === 1);

/* The story written for him: every chapter has its own picture, and the drawings
   must all render — an SVG that throws leaves a silent blank at the chapter head. */
const drawings = await page.evaluate(async () => {
  const b = await window.LEO.reader.load('breathes');
  const arts = b.chapters.map(c => c.art);
  const rendered = arts.map(a => (window.LEO.bookart.render(a) || '').length);
  return { n: arts.length, distinct: new Set(arts).size, empty: rendered.filter(l => l < 100).length };
});
check('the written-for-him story has a picture per chapter',
  drawings.n === 7 && drawings.distinct === 7 && drawings.empty === 0,
  `${drawings.n} chapters, ${drawings.distinct} different drawings, ${drawings.empty} blank`);
const sizeBefore = await page.evaluate(() => getComputedStyle(document.getElementById('rdBody')).fontSize);
await page.click('#rdBigger');
await page.click('#rdBigger');
const sizeAfter = await page.evaluate(() => getComputedStyle(document.getElementById('rdBody')).fontSize);
check('he can make the text bigger', parseInt(sizeAfter) > parseInt(sizeBefore),
  sizeBefore + ' → ' + sizeAfter);
await shot(page, '17-reading');
await page.click('#rdDone');                       // finishing a chapter logs the sitting
await page.waitForSelector('#home:not(.hide)');
await page.waitForTimeout(700);
check('reading in the app earns its own sticker', (await page.locator('#shelf .st').count()) === 1);

await page.click('#btnAddBook');
await page.waitForSelector('#addBook:not(.hide)');
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
check('a sticker lands on the cover', (await page.locator('#shelf .st').count()) === 2);

for (let i = 0; i < 4; i++) {
  await page.click('#shelf [data-book="banjo"]');
  await page.waitForSelector('#logRead:not(.hide)');
  await page.click('#logSave');
  await page.waitForSelector('#home:not(.hide)');
  await page.waitForTimeout(90);
}
const stickers = await page.locator('#shelf .st').count();
check('stickers accumulate', stickers === 6, stickers + ' after 5 sittings plus a chapter read');

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

/* ---------------- the games from school ---------------- */
await page.waitForSelector('#home:not(.hide)');
check('all nine games from the sheet are offered', (await page.locator('[data-game]').count()) === 9,
  (await page.locator('[data-game]').count()) + ' games');

/* Two hands the app deals must be solvable by construction, or the child meets a
   round he cannot win however well he thinks. Both were wrong first time: Go Fish
   asked for three cards to make 40, which a 1-10 deck cannot do. */
const dealt = await page.evaluate(() => {
  const G = window.LEO.games;
  function solvable(items, rule) {
    const v = items.map(i => i.v), n = v.length;
    for (let m = 1; m < (1 << n); m++) {
      const idx = []; for (let i = 0; i < n; i++) if (m & (1 << i)) idx.push(i);
      if (idx.length < rule.min || (rule.max && idx.length > rule.max)) continue;
      if (idx.reduce((a, i) => a + v[i], 0) === rule.target) return true;
    }
    return false;
  }
  let hands = 0, stuck = 0, forced = 0, targets = 0, unreachable = 0, zero = 0, notZero = 0;
  const pairs20 = {};
  ['gofish20', 'brainy20'].forEach(id => {
    const g = G.byId(id);
    for (let s = 0; s < 120; s++) {
      const run = { total: g.rounds };
      for (let i = 0; i < g.rounds; i++) {
        const r = g.round(i, run, Math.random);
        hands++;
        if (!solvable(r.items, r.rule)) stuck++;
        // one possible move is not a choice: the first Go Fish dealt 10+10 every time
        if (G.countWins(r.items, r.rule) < 2) forced++;
        if (id === 'gofish20' && r.rule.target === 20 && r.rule.min === 2) {
          const v = r.items.map(c => c.v);
          for (let x = 0; x < v.length; x++) for (let y = x + 1; y < v.length; y++) {
            if (v[x] + v[y] === 20) pairs20[[v[x], v[y]].sort((a, b) => a - b).join('+')] = 1;
          }
        }
      }
    }
  });
  const tg = G.byId('target');
  for (let s = 0; s < 60; s++) {
    const run = { total: tg.rounds };
    for (let i = 0; i < tg.rounds; i++) {
      const r = tg.round(i, run, Math.random);
      targets++;
      const reach = G.reachable(r.items.map(d => d.v));
      if (r.target == null || reach[r.target] == null) unreachable++;
    }
  }
  const cf = G.byId('cardfriends');
  for (let s = 0; s < 120; s++) {
    const run = Object.assign({ total: cf.rounds }, cf.start());
    let last = null;
    for (let i = 0; i < cf.rounds; i++) {
      const r = cf.round(i, run, Math.random);
      run.left = r.answer; last = r.answer;
      if (r.answer < 0) notZero++;
    }
    if (last === 0) zero++; else notZero++;
  }
  return { hands, stuck, forced, targets, unreachable, zero, notZero, pairs20: Object.keys(pairs20) };
});
check('every hand the app deals can actually be solved',
  dealt.stuck === 0, `${dealt.hands} hands, ${dealt.stuck} with no answer in them`);
/* Two cards making 20 out of a 1-10 deck has exactly one answer, so the first
   version of Go Fish dealt 10 + 10 every round and called it a game. */
check('no hand is a forced move',
  dealt.forced === 0, `${dealt.hands} hands, ${dealt.forced} with only one possible answer`);
check('friends of 20 is more than 10 + 10',
  dealt.pairs20.length >= 4, dealt.pairs20.sort().join(', '));
check('Target Number targets are reachable from the dice on the table',
  dealt.unreachable === 0, `${dealt.targets} targets, ${dealt.unreachable} impossible`);
check('Card Friends counts down to exactly nought',
  dealt.notZero === 0, `${dealt.zero} of ${dealt.zero + dealt.notZero} games ended on 0`);

/* An expression that hits the target, found the way a person would: combine two
   numbers, then carry on with what is left. */
function solveTarget(dice, target) {
  const seen = new Set();
  function go(list) {
    for (const e of list) if (Math.abs(e.v - target) < 1e-9) return e.toks;
    if (list.length === 1) return null;
    for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const a = list[i], b = list[j], rest = list.filter((_, k) => k !== i && k !== j);
      const cands = [
        { v: a.v + b.v, t: ['(', ...a.toks, '+', ...b.toks, ')'] },
        { v: a.v * b.v, t: ['(', ...a.toks, '×', ...b.toks, ')'] },
        { v: a.v - b.v, t: ['(', ...a.toks, '-', ...b.toks, ')'] }
      ];
      if (b.v && a.v % b.v === 0) cands.push({ v: a.v / b.v, t: ['(', ...a.toks, '÷', ...b.toks, ')'] });
      for (const c of cands) {
        if (c.v < 0 || c.v > 500) continue;
        const key = rest.map(r => r.v).sort().join(',') + '|' + c.v;
        if (seen.has(key)) continue;
        seen.add(key);
        const r = go([...rest, { v: c.v, toks: c.t }]);
        if (r) return r;
      }
    }
    return null;
  }
  return go(dice.map(d => ({ toks: [d], v: d })));
}
function subsetFor(items, rule) {
  const n = items.length;
  for (let m = 1; m < (1 << n); m++) {
    const idx = []; for (let i = 0; i < n; i++) if (m & (1 << i)) idx.push(i);
    if (idx.length < rule.min || (rule.max && idx.length > rule.max)) continue;
    if (idx.reduce((a, i) => a + items[i], 0) === rule.target) return idx;
  }
  return null;
}
function wrongSubset(items, rule) {
  const n = items.length;
  for (let m = 1; m < (1 << n); m++) {
    const idx = []; for (let i = 0; i < n; i++) if (m & (1 << i)) idx.push(i);
    if (idx.length !== rule.min) continue;
    if (idx.reduce((a, i) => a + items[i], 0) !== rule.target) return idx;
  }
  return null;
}
async function tapNumber(n) {
  for (const ch of String(n)) await page.click(`#gPad [data-k="${ch}"]`);
  await page.click('#gPad [data-k="ok"]');
}

/* Play one game of each kind: typing a total, arranging cards, picking a set, and
   building a sum out of dice. */
let gamesPlayed = 0, gameRounds = 0, gameRight = 0, sawStrategy = false;
for (const id of ['cards2digit', 'gofish20', 'cardfriends', 'target']) {
  await page.click(`[data-game="${id}"]`);
  await page.waitForSelector('#gIntro:not(.hide)');
  if (id === 'cards2digit') {
    check("the teacher's own wording is on the screen",
      /Each student takes 4 cards/.test(await page.locator('#giSheet').textContent()));
    check('it asks who he is playing with', (await page.locator('#giWho [data-who]').count()) === 3);
  }
  await page.click('#giWho [data-who="parent"]');
  await page.click('#giStart');
  await page.waitForSelector('#games:not(.hide)');
  if (id === 'cards2digit') await shot(page, '18-game-cards');

  const rounds = await page.evaluate(() => window.LEO.debug.gameRound().rounds);
  for (let r = 0; r < rounds; r++) {
    const rd = await page.evaluate(() => window.LEO.debug.gameRound());
    /* One deliberate mistake, to prove a wrong answer is actually refused. */
    const wrongOnPurpose = (id === 'gofish20' && r === 0);
    if (rd.mode === 'num') await tapNumber(rd.answer);
    else if (rd.mode === 'build') {
      for (let i = 0; i < 4; i++) await page.click(`#gDeal [data-i="${i}"]`);
      await tapNumber((rd.items[0] * 10 + rd.items[1]) + (rd.items[2] * 10 + rd.items[3]));
    } else if (rd.mode === 'pick') {
      /* The mistake has to be a real one. Taking "the first two cards" used to do,
         but every hand now holds at least two winning pairs, and sometimes the first
         two are one of them — the test then failed on a correct game. */
      const idx = wrongOnPurpose ? wrongSubset(rd.items, rd.rule) : subsetFor(rd.items, rd.rule);
      if (!idx) { check('a Go Fish hand had no answer in it', false, JSON.stringify(rd)); break; }
      for (const i of idx) await page.click(`#gDeal [data-i="${i}"]`);
      await page.click('#gDone');
    } else if (rd.mode === 'expr') {
      const toks = solveTarget(rd.items, rd.target);
      if (!toks) { check('a Target Number round was impossible', false, JSON.stringify(rd)); break; }
      const pool = rd.items.slice();
      for (const t of toks) {
        if (typeof t === 'number') { const i = pool.indexOf(t); pool[i] = null; await page.click(`#gDeal [data-i="${i}"]`); }
        else await page.click(`#gOps [data-op="${t}"]`);
      }
      await page.click('#gDone');
    }
    await page.waitForSelector('#gNext:not(.hide)');
    const marked = (await page.locator('#gMark .fmark').getAttribute('class')) || '';
    if (/ok/.test(marked)) gameRight++;
    if (wrongOnPurpose) {
      check('a pick that does not make the target is refused', /bad/.test(marked),
        (await page.locator('#gMark').textContent()).trim().slice(0, 60));
    }
    if (await page.locator('#gStrat:not(.hide) [data-strat]').count()) {
      await page.click('#gStrat [data-strat="split"]');
      sawStrategy = true;
    }
    gameRounds++;
    await page.click('#gNext');
  }
  await page.waitForSelector('#gResult:not(.hide)', { timeout: 8000 });
  gamesPlayed++;
  if (id === 'target') await shot(page, '19-game-result');
  await page.click('#grHome');
  await page.waitForSelector('#home:not(.hide)');
}
check('a game of each kind plays through', gamesPlayed === 4 && gameRounds === 23,
  `${gamesPlayed} games, ${gameRounds} rounds, ${gameRight} right`);
check('all but the deliberate mistake are marked right', gameRight === gameRounds - 1,
  `${gameRight} of ${gameRounds}`);
check('the games that ask for a strategy record it', sawStrategy);

/* The note that goes back to school. */
await page.click('#btnReport');
await page.waitForSelector('#report:not(.hide)');
await page.fill('#rpWho', 'Mrs Smoke');
await page.waitForTimeout(150);
const note = await page.locator('#rpText').textContent();
check('the teacher note names the games played',
  /Cards & Numbers/.test(note) && /Card Friends/.test(note) && /Target Number/.test(note));
check('the teacher note says what has NOT been played', /Not played yet: .*Dots and Numerals/.test(note),
  (note.match(/Not played yet:[^\n]*/) || [''])[0].slice(0, 80));
check('the teacher note is addressed to the teacher', /For Mrs Smoke/.test(note));
check('nothing but the games is in the note',
  !/NAPLAN|writing|percentile|reading/i.test(note));

/* The note is a sheet, not a wall of monospace: nine tiles, a ring, four weeks of
   days. The day squares are checked for COLOUR because a CSS specificity slip once
   painted every one of them the empty shade — a fortnight of playing looked like
   none, and nothing else on the page showed it. */
const sheet = await page.evaluate(() => ({
  tiles: document.querySelectorAll('#rpSlide .rtile').length,
  played: document.querySelectorAll('#rpSlide .rtile:not(.off)').length,
  ring: document.querySelectorAll('#rpSlide .rg circle').length,
  cells: document.querySelectorAll('#rpSlide .strip i').length,
  lit: [...document.querySelectorAll('#rpSlide .strip i')]
    .filter(i => getComputedStyle(i).backgroundColor !== getComputedStyle(document.querySelector('#rpSlide .strip i.d0')).backgroundColor).length,
  columns: document.querySelectorAll('#rpSlide .rcol').length
}));
check('the note is a sheet, not a wall of text',
  sheet.tiles === 9 && sheet.ring === 2 && sheet.columns === 2 && sheet.cells === 28,
  JSON.stringify(sheet));
check('the games played have their own tile', sheet.played === 4, sheet.played + ' tiles with a score');
check('a day that was played is actually coloured in', sheet.lit >= 1, sheet.lit + ' days lit');
await shot(page, '20-teacher-note');

/* One page. The first print stylesheet hid the rest of the app with
   visibility:hidden, which keeps its height — the sheet came out on page one of
   two, with a blank sheet of A4 behind it. */
const pdfPath = path.join(SHOTS, 'teacher-note.pdf');
await page.pdf({ path: pdfPath, format: 'A4', landscape: true, printBackground: true });
const pdfPages = (fs.readFileSync(pdfPath).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
check('the note prints on one page', pdfPages === 1, pdfPages + ' page(s)');
await page.click('#rpBack');
await page.waitForSelector('#home:not(.hide)');

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
           facts: st.facts.length, library: st.library.length, games: st.games.length,
           pendingAnswers: st.pending.answers.length, pendingWriting: st.pending.writing.length,
           pendingFacts: st.pending.facts.length, pendingLibrary: st.pending.library.length,
           pendingGames: st.pending.games.length };
});
check('nothing left unsynced',
  kidState.pendingAnswers === 0 && kidState.pendingWriting === 0 && kidState.pendingFacts === 0 &&
  kidState.pendingLibrary === 0 && kidState.pendingGames === 0,
  JSON.stringify(kidState));
// The record was wiped at the start, so these are exact, not "at least".
const want = { answers: 12 + fixups, sessions: 2, writing: 2, facts: FACTS_N, games: gamesPlayed };
check('the record holds exactly what was done',
  kidState.answers === want.answers && kidState.sessions === want.sessions &&
  kidState.writing === want.writing && kidState.facts === want.facts && kidState.games === want.games,
  `got ${kidState.answers}/${kidState.sessions}/${kidState.writing}/${kidState.facts}/${kidState.games}, ` +
  `want ${want.answers}/${want.sessions}/${want.writing}/${want.facts}/${want.games} ` +
  `(answers/sessions/writing/facts/games)`);

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
           facts: st.facts.length, library: st.library.length, games: st.games.length };
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
check('fresh device sees the games from school', seen.games === kidState.games, `${seen.games} vs ${kidState.games}`);
check('games panel lists all nine', (await dash.locator('#gameTable tbody tr').count()) === 9,
  (await dash.locator('#gameTable tbody tr').count()) + ' rows');
check('the dashboard carries the note for the teacher',
  (await dash.locator('#gameSlide .rtile').count()) === 9 &&
  /GAMES FROM THE SHEET/.test(await dash.locator('#gameReport').textContent()),
  (await dash.locator('#gameSlide .rtile').count()) + ' tiles on the dashboard sheet');
/* The name is typed on the tablet and must reach the laptop: it rides in the
   profile for exactly this reason, so a note printed from the dashboard is
   addressed the same way. */
check('the teacher’s name followed to the other device',
  /For Mrs Smoke/.test(await dash.locator('#gameReport').textContent()) &&
  (await dash.locator('#gameWho').inputValue()) === 'Mrs Smoke',
  (await dash.locator('#gameWho').inputValue()));
check('reading panel populated', (await dash.locator('#libTable tbody tr').count()) === 2,
  (await dash.locator('#libTable tbody tr').count()) + ' books listed');
check('reading panel shows how he reads', /🎧/.test(await dash.locator('#libStats').textContent()));
// scoped to the facts panel: reading and the games panel use the same tile class
check('number-fact section populated', (await dash.locator('#factTracks .ftrack').count()) === 3,
  (await dash.locator('#factTracks .ftrack').count()) + ' tracks');
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

/* ---------------- the video + QR code ----------------
   The file is a child's video on a link printed on paper, so what matters is:
   the QR actually scans to the link, the link opens the video, and "New link" /
   "Delete" really switch the old paper off. Vercel's side of the upload is faked
   in the browser; everything of ours runs for real. Only against the dev server:
   pointed at the live site this would leave an entry behind. */
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const nobody = await (await fetch(`${BASE}/api/video?v=doesnotexist123`)).json();
check('an unknown video code opens nothing', nobody.ok === false && !nobody.src, nobody.reason);

if (!KEY) {
  const r = await fetch(`${BASE}/api/video`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'save', pathname: 'leo-video/x.mp4' }) });
  check('video upload is refused while no access key is set', r.status === 403 || r.status === 401, 'HTTP ' + r.status);
  await dash.waitForFunction(() => /LEO_ACCESS_KEY|access key/i.test(document.getElementById('vidStatus').textContent));
  check('the panel says why it cannot upload', true, await dash.textContent('#vidStatus'));
} else if (LOCAL) {
  await dash.route('https://vercel.com/api/blob**', route => {
    const u = new URL(route.request().url());
    const pathname = (u.searchParams.get('pathname') || 'leo-video/x.mp4').replace(/\.mp4$/, '-Ab12Cd.mp4');
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      url: 'https://devstore.private.blob.vercel-storage.com/' + pathname,
      downloadUrl: 'https://devstore.private.blob.vercel-storage.com/' + pathname + '?download=1',
      pathname, contentType: 'video/mp4', contentDisposition: 'inline' }) });
  });
  await dash.evaluate(() => { window.print = () => {}; window.confirm = () => true; });
  await dash.waitForSelector('#vidForm:not(.hide)');
  await dash.setInputFiles('#vidFile', { name: 'Leo intro.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(4096, 1) });
  await dash.fill('#vidNote', 'Recorded at home, September.');
  await dash.click('#vidGo');
  await dash.waitForSelector('#vidList .vitem', { timeout: 15000 }).catch(() => {});
  const first = await dash.evaluate(() => {
    const it = document.querySelector('#vidList .vitem');
    return it ? { code: it.dataset.code, link: it.querySelector('.vlink').textContent,
      svg: !!it.querySelector('.vqr svg'), status: document.getElementById('vidStatus').textContent } : null;
  });
  check('a video uploads and gets a link', !!first && /\/v\/#[A-Za-z0-9_-]{16}$/.test(first.link),
    first ? first.link : await dash.textContent('#vidStatus'));

  if (first) {
    /* Read the QR back the way a phone would: rasterise it and decode it. A code
       that renders but does not scan would look perfect in every other check. */
    await dash.addScriptTag({ path: 'node_modules/jsqr/dist/jsQR.js' });
    const scanned = await dash.evaluate(() => new Promise(done => {
      const svg = document.querySelector('#vidList .vitem .vqr svg').outerHTML;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 400;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, 400, 400);
        const r = window.jsQR(g.getImageData(0, 0, 400, 400).data, 400, 400);
        done(r ? r.data : null);
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }));
    check('the QR code scans to the link', scanned === first.link, String(scanned));

    const viewer = await parent.newPage();
    viewer.on('console', m => { if (m.type() === 'error' && !/dev-video|Failed to load resource/.test(m.text())) errors.push('viewer console: ' + m.text()); });
    viewer.on('pageerror', e => errors.push('viewer pageerror: ' + e.message));
    await viewer.goto(first.link);
    await viewer.waitForSelector('#show:not(.hide), #gone:not(.hide)');
    const seen = await viewer.evaluate(() => ({
      title: document.getElementById('title').textContent,
      note: document.getElementById('note').textContent,
      src: document.getElementById('vid').getAttribute('src') || '',
      robots: document.querySelector('meta[name=robots]').content
    }));
    check('the link opens the video with a short-lived address',
      /introduction/.test(seen.title) && /leo-video\/leo-intro-Ab12Cd\.mp4\?until=\d+/.test(seen.src) &&
      seen.note === 'Recorded at home, September.' && /noindex/.test(seen.robots),
      seen.title + ' · ' + seen.src.slice(0, 60));
    await viewer.setViewportSize({ width: 390, height: 844 });
    await shot(viewer, '30-video-viewer');

    // The printed card: one page, the code on it, nothing else from the dashboard.
    await dash.click('#vidList .vitem [data-act=print]');
    await dash.emulateMedia({ media: 'print' });
    await shot(dash, '31-qr-card-print');
    // Read before pdf(): printing fires afterprint, which takes the card back off.
    const onCard = await dash.evaluate(() => document.querySelector('#qrPrint .qcard svg') !== null &&
      getComputedStyle(document.querySelector('.wrap')).display === 'none');
    const pdf = await dash.pdf({ format: 'A4' });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    await dash.emulateMedia({ media: 'screen' });
    await dash.evaluate(() => document.body.classList.remove('pq'));
    check('the QR card prints alone on one page', pages === 1 && onCard, pages + ' page(s)');

    await dash.click('#vidList .vitem [data-act=rotate]');
    await dash.waitForFunction(old => {
      const it = document.querySelector('#vidList .vitem'); return it && it.dataset.code !== old;
    }, first.code);
    await viewer.goto(first.link.replace('#', '?r=1#'));
    await viewer.waitForSelector('#show:not(.hide), #gone:not(.hide)');
    check('"New link" switches the old QR code off', await viewer.isVisible('#gone'));

    await dash.click('#vidList .vitem [data-act=del]');
    await dash.waitForFunction(() => !document.querySelector('#vidList .vitem'));
    const removed = await (await fetch(`${BASE}/dev-video/deleted`)).json();
    check('"Delete" removes the file, not just the link', removed.some(u => /leo-intro-Ab12Cd\.mp4$/.test(u)), removed.join(', '));
    await viewer.close();
  }
}

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
