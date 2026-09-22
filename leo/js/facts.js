/* facts.js — number-fact fluency.
 *
 * Different problem from the quiz. The quiz asks whether he can WORK SOMETHING OUT;
 * this asks whether he can RECALL it. Those need different machinery:
 *
 *   - Typed answers, not multiple choice. With four options you can work backwards
 *     from the answers, which is exactly the skill we are trying to make unnecessary.
 *   - Every fact is tracked on its own. 7×8 and 7×6 are separate things to know;
 *     a topic-level score hides which ones are still being counted out.
 *   - Speed is the signal, never the grade. A fact answered from memory comes back
 *     in a couple of seconds; one that is counted out takes longer. Same right
 *     answer, completely different state of learning.
 *
 * The clock measures TIME TO THE FIRST KEYPRESS, not time to submit. Leo's
 * processing speed sits at the 6th percentile, so total time would mostly measure
 * how fast he can find digits on a keypad. Time-to-first-key is thinking time, which
 * is the thing we actually care about. Nothing is ever marked wrong for being slow.
 *
 * Storage is an append-only attempt log, like answers. Box and fluency are DERIVED
 * from the log rather than stored, so two devices merge by id with no conflicts and
 * no last-write-wins. ~20 attempts a session is nothing to carry.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var FAST_MS = 3000;          // at or under this, answered from memory rather than counted
  var BOXES = 5;
  var DAY = 86400000;
  var DUE_AFTER = [0, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];   // by box

  /* ---------------------------------------------------------------- fact sets */

  var TABLES = [6, 7, 8, 9];

  function bondFacts() {
    var out = [], a, b;
    // addition within 20, both orders (8+5 and 5+8 are different to recall)
    for (a = 2; a <= 9; a++) {
      for (b = 2; b <= 9; b++) {
        if (a + b > 20) continue;
        out.push({ id: a + '+' + b, track: 'bonds', kind: 'add', a: a, b: b, answer: a + b,
                   hard: a + b > 10 });
      }
    }
    // the +10 family, which is where "past ten" thinking starts
    for (a = 2; a <= 9; a++) {
      out.push({ id: '10+' + a, track: 'bonds', kind: 'add', a: 10, b: a, answer: 10 + a, hard: false });
    }
    // subtraction from 11..20 — the bridging-back-through-ten ones are the hard half
    for (a = 11; a <= 20; a++) {
      for (b = 2; b <= 9; b++) {
        if (a - b < 2 || a - b > 10) continue;
        out.push({ id: a + '-' + b, track: 'bonds', kind: 'sub', a: a, b: b, answer: a - b,
                   hard: a - b < 10 });
      }
    }
    return out;
  }

  function skipFacts() {
    var out = [];
    TABLES.forEach(function (t) {
      for (var n = 3; n <= 12; n++) {
        out.push({ id: 'skip' + t + '@' + n, track: 'skip', kind: 'skip', a: t, b: n,
                   answer: t * n, hard: n > 5 });
      }
    });
    return out;
  }

  function tableFacts() {
    var out = [];
    TABLES.forEach(function (t) {
      for (var n = 2; n <= 12; n++) {
        out.push({ id: t + 'x' + n, track: 'tables', kind: 'mul', a: t, b: n, answer: t * n,
                   hard: n >= 6 });
        out.push({ id: (t * n) + '/' + t, track: 'tables', kind: 'div', a: t * n, b: t, answer: n,
                   hard: n >= 6 });
      }
    });
    return out;
  }

  var ALL = null;
  function all() {
    if (!ALL) ALL = bondFacts().concat(skipFacts(), tableFacts());
    return ALL;
  }
  function byId(id) {
    var list = all();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var TRACKS = {
    bonds:  { label: 'Add & take away to 20', emoji: '➕', blurb: 'Number bonds, fast' },
    skip:   { label: 'Counting in 6s 7s 8s 9s', emoji: '🪜', blurb: 'The ladder up each table' },
    tables: { label: 'Times tables 6 7 8 9', emoji: '✖️', blurb: 'Multiply and divide' }
  };

  /* -------------------------------------------------------------- the prompt */

  function prompt(f) {
    if (f.kind === 'add') return f.a + ' + ' + f.b;
    if (f.kind === 'sub') return f.a + ' − ' + f.b;
    if (f.kind === 'mul') return f.a + ' × ' + f.b;
    if (f.kind === 'div') return f.a + ' ÷ ' + f.b;
    if (f.kind === 'skip') {
      var seq = [], i;
      for (i = 1; i <= f.b; i++) seq.push(i === f.b ? '?' : f.a * i);
      if (f.b > 5) seq = seq.slice(f.b - 5);     // keep the line short on a phone
      return seq.join(', ');
    }
    return '';
  }

  // One short line, shown only after an answer. Structure, never "just remember it".
  function hint(f) {
    if (f.kind === 'add' && f.a + f.b > 10) {
      var toTen = 10 - f.a;
      if (toTen > 0 && toTen < f.b) {
        return f.a + ' + ' + toTen + ' makes 10, then ' + (f.b - toTen) + ' more → ' + f.answer + '.';
      }
    }
    if (f.kind === 'sub' && f.a > 10 && f.a - f.b < 10) {
      return 'Back to 10 first: ' + f.a + ' − ' + (f.a - 10) + ' = 10, then ' + (f.b - (f.a - 10)) +
             ' more → ' + f.answer + '.';
    }
    if (f.kind === 'skip') return 'Count on in ' + f.a + 's: ' + f.a * (f.b - 1) + ' + ' + f.a + ' = ' + f.answer + '.';
    if (f.kind === 'mul' || f.kind === 'div') {
      var t = f.kind === 'mul' ? f.a : f.b, n = f.kind === 'mul' ? f.b : f.answer;
      // A division is a multiplication asked backwards; say that before the trick.
      var lead = f.kind === 'div'
        ? 'How many ' + t + 's make ' + f.a + '? ' + t + ' × ' + n + ' = ' + f.a + ', so ' + f.answer + '. '
        : '';
      if (t === 8) return lead + 'Eights are three doublings: ' + n + ' → ' + n * 2 + ' → ' + n * 4 + ' → ' + n * 8 + '.';
      if (t === 9) return lead + 'Nines are tens minus one lot: ' + (n * 10) + ' − ' + n + ' = ' + (n * 9) + '.';
      if (t === 7) return lead + 'Sevens are fives plus twos: ' + (n * 5) + ' + ' + (n * 2) + ' = ' + (n * 7) + '.';
      if (t === 6) return lead + 'Sixes are double the threes: ' + (n * 3) + ' doubled is ' + (n * 6) + '.';
    }
    return '';
  }

  function visualFor(f) {
    if (f.kind === 'skip') return { type: 'skip', step: f.a, jumps: f.b, hideLast: true };
    if (f.kind === 'mul' && f.b <= 9) return { type: 'array', rows: Math.min(f.a, 9), cols: f.b, cell: 20 };
    return null;
  }

  /* ------------------------------------------------- what the log says we know */

  /* Walk one fact's attempts oldest-first.
       wrong              -> straight back to box 0
       right and fast     -> one box up
       right but slow     -> stays put; knowing it is not the same as recalling it  */
  function stateOf(attempts) {
    var box = 0, seen = 0, fast = 0, lastT = 0, times = [], streak = 0, wrong = 0, lastOk = true;
    attempts.forEach(function (at) {
      seen++;
      lastT = Math.max(lastT, at.t || 0);
      lastOk = !!at.ok;
      if (!at.ok) wrong++;
      if (at.ok) {
        times.push(at.ms);
        if (at.ms <= FAST_MS) { fast++; streak++; box = Math.min(BOXES - 1, box + 1); }
        else streak = 0;
      } else {
        streak = 0; box = 0;
      }
    });
    times.sort(function (x, y) { return x - y; });
    /* box 0 does NOT mean "gets it wrong": a right-but-slow answer deliberately
       leaves the box alone, so a fact he always gets right by counting also sits at
       0. Callers that want "is he getting this wrong" must ask wrong/lastOk. */
    return {
      box: box, seen: seen, fast: fast, streak: streak, lastT: lastT,
      wrong: wrong, lastOk: lastOk,
      medianMs: times.length ? times[(times.length - 1) >> 1] : null,
      /* Four states, because they call for different things from a parent. Getting
         it wrong needs teaching; right-but-slow needs repetition, and the two are
         indistinguishable on an ordinary test — both just look like a tick.
         Fluent means two straight answers from memory AND a typical time that is
         not a count-up: one lucky fast answer is not knowing it. */
      level: seen === 0 ? 'new'
           : !lastOk ? 'wrong'
           : (box >= 2 && times.length && times[(times.length - 1) >> 1] <= FAST_MS) ? 'fluent'
           : (box >= 1 || (times.length && times[(times.length - 1) >> 1] <= FAST_MS)) ? 'nearly'
           : 'slow'
    };
  }

  function index(log) {
    var by = {};
    (log || []).forEach(function (at) {
      if (!at || !at.fact) return;
      (by[at.fact] = by[at.fact] || []).push(at);
    });
    var out = {};
    Object.keys(by).forEach(function (id) {
      by[id].sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
      out[id] = stateOf(by[id]);
    });
    return out;
  }

  /* --------------------------------------------------------------- scheduling */

  /* Higher score = wants practice sooner. Never-seen facts sit just below overdue
     ones, so a session is mostly repair work with a little new ground. */
  function urgency(f, st, now) {
    if (!st || !st.seen) return f.hard ? 60 : 50;
    var overdue = (now - st.lastT) - DUE_AFTER[st.box];
    if (overdue < 0) return -1;                        // not due
    var base = 100 - st.box * 15;
    return base + Math.min(40, overdue / DAY * 4);
  }

  var NEW_SHARE = 0.3;   // a session is repair work, but never ONLY repair work

  function pickSession(track, log, want, now) {
    now = now || Date.now();
    want = want || 20;
    var idx = index(log);
    var pool = all().filter(function (f) { return f.track === track; });

    /* Facts he keeps getting wrong sit in box 0, which is due forever, so on urgency
       alone they crowd the session out and he would never meet the rest of the table.
       Reserve a slice for ground he has not covered: the weak facts still dominate,
       but the set gets worked through. */
    var unseen = pool.filter(function (f) { return !idx[f.id]; });
    var reserve = Math.min(unseen.length, Math.round(want * NEW_SHARE));
    unseen.sort(function (x, y) { return (y.hard ? 0 : 1) - (x.hard ? 0 : 1); });
    var fresh = unseen.slice(0, reserve);
    var freshIds = {};
    fresh.forEach(function (f) { freshIds[f.id] = 1; });

    var scored = pool.filter(function (f) { return !freshIds[f.id]; })
                     .map(function (f) { return { f: f, u: urgency(f, idx[f.id], now) }; })
                     .filter(function (s) { return s.u >= 0; });
    scored.sort(function (x, y) { return y.u - x.u; });
    scored = scored.slice(0, want - reserve);
    fresh.forEach(function (f) { scored.push({ f: f, u: 0 }); });

    // If everything is comfortably known, don't refuse to practise — take the
    // weakest ones anyway rather than showing an empty session.
    if (scored.length < want) {
      var have = {};
      scored.forEach(function (s) { have[s.f.id] = 1; });
      pool.filter(function (f) { return !have[f.id]; })
          .map(function (f) { return { f: f, u: (idx[f.id] ? idx[f.id].box : 0) * -1 }; })
          .sort(function (x, y) { return y.u - x.u; })
          .slice(0, want - scored.length)
          .forEach(function (s) { scored.push(s); });
    }

    var out = scored.slice(0, want).map(function (s) { return s.f; });
    for (var i = out.length - 1; i > 0; i--) {         // shuffle so the order is not a ranking
      var j = (Math.random() * (i + 1)) | 0, t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  /* -------------------------------------------------------------- the summary */

  function summary(log, track) {
    var idx = index(log);
    var pool = all().filter(function (f) { return !track || f.track === track; });
    var n = { fluent: 0, nearly: 0, slow: 0, wrong: 0, 'new': 0 };
    pool.forEach(function (f) { n[(idx[f.id] || { level: 'new' }).level]++; });
    return { total: pool.length, counts: n, pct: Math.round(n.fluent / pool.length * 100) };
  }

  /* The times-table grid the dashboard draws: one row per table, one cell per
     multiplier, coloured by how well that single fact is known. */
  function grid(log) {
    var idx = index(log);
    return TABLES.map(function (t) {
      return {
        table: t,
        cells: Array.from({ length: 11 }, function (_, i) {
          var n = i + 2, st = idx[t + 'x' + n] || { level: 'new', medianMs: null, seen: 0, wrong: 0 };
          return { n: n, label: t + '×' + n, level: st.level, ms: st.medianMs, seen: st.seen, wrong: st.wrong || 0 };
        })
      };
    });
  }

  L.facts = {
    FAST_MS: FAST_MS, TRACKS: TRACKS, TABLES: TABLES,
    all: all, byId: byId, prompt: prompt, hint: hint, visualFor: visualFor,
    index: index, stateOf: stateOf, pickSession: pickSession, summary: summary, grid: grid
  };
})(window);
