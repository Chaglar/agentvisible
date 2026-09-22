/* bank.js — question generators (numeracy strands).
   Every generator takes (level 1..5, rng) and returns a question object:
   { topic, sub, level, prompt, visual, format:'mc'|'input', choices, answer, explain, explainVisual }
   Content is aimed at NSW / Australian Curriculum Year 2, stretching into Year 3-4
   at the top levels. Multiplication deliberately over-weights 7s and 8s, and
   fractions get the widest level ladder — those are Leo's known soft spots. */
(function (root) {
  var L = root.LEO = root.LEO || {}, V = L.vis;

  /* ---------- seeded rng ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function RNG(seed) {
    var f = mulberry32(seed == null ? (Date.now() ^ Math.floor(Math.random() * 1e9)) : seed);
    return {
      next: f,
      int: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      chance: function (p) { return f() < p; },
      shuffle: function (arr) {
        var a = arr.slice(), i, j, t;
        for (i = a.length - 1; i > 0; i--) { j = Math.floor(f() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      },
      sample: function (arr, n) { return this.shuffle(arr).slice(0, n); }
    };
  }
  L.RNG = RNG;

  /* ---------- helpers ---------- */
  var NAMES = ['Leo', 'Mia', 'Noah', 'Ava', 'Jack', 'Ruby', 'Oliver', 'Chloe', 'Zoe', 'Ethan', 'Isla', 'Max'];
  function fr(n, d) { return '<span class="fr"><i>' + n + '</i><b>' + d + '</b></span>'; }
  L.fr = fr;

  // build 4 multiple-choice options around a correct value
  function mc(rng, correct, distractors, fmt, want) {
    want = want || 4;                     // OC Mathematical Reasoning uses five options
    fmt = fmt || function (v) { return String(v); };
    var key = function (v) { return typeof v === 'object' ? JSON.stringify(v) : String(v); };
    var opts = [correct], seen = {}; seen[key(correct)] = 1;
    distractors.forEach(function (d) {
      if (opts.length >= want || d == null) return;
      if (typeof d === 'number' && (!isFinite(d) || d < 0)) return;
      if (seen[key(d)]) return;
      seen[key(d)] = 1; opts.push(d);
    });
    // top up numeric options so every question offers a full set of four
    if (typeof correct === 'number') {
      var spread = 1;
      while (opts.length < want && spread < 60) {
        [correct + spread, correct - spread].forEach(function (d) {
          if (opts.length >= want || d < 0 || seen[key(d)]) return;
          seen[key(d)] = 1; opts.push(d);
        });
        spread++;
      }
    }
    var sh = rng.shuffle(opts);
    return {
      format: 'mc',
      choices: sh.map(function (o) { return typeof o === 'object' && o.visual ? o : { text: fmt(o) }; }),
      answer: sh.map(key).indexOf(key(correct))
    };
  }
  function near(n, rng, spread) {
    spread = spread || 3;
    var out = [], i;
    for (i = 0; i < 8; i++) { var d = n + rng.int(-spread, spread); if (d !== n && d >= 0) out.push(d); }
    return out;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  var T = {};   // topic registry
  L.bank = { topics: T, RNG: RNG };

  function topic(key, meta, gen) { T[key] = Object.assign({ key: key, gen: gen }, meta); }

  /* =========================================================
     NUMBER & PLACE VALUE
     ========================================================= */
  topic('number', { label: 'Number & place value', emoji: '🔢', strand: 'numeracy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'number', level: lv };
    var kind = rng.pick(lv <= 2 ? ['mab', 'compare', 'seqnum'] : lv === 3 ? ['mab', 'expanded', 'between', 'compare'] : ['place', 'expanded', 'order', 'round', 'between']);

    if (kind === 'mab') {
      var h = lv >= 3 ? rng.int(1, 4) : 0, tn = rng.int(1, lv >= 3 ? 7 : 9), o = rng.int(1, 9);
      var n = h * 100 + tn * 10 + o;
      q.sub = 'MAB blocks'; q.prompt = 'What number do these blocks show?';
      q.visual = { type: 'mab', h: h, t: tn, o: o };
      Object.assign(q, mc(rng, n, [tn * 100 + h * 10 + o, n + 10, n - 10, h * 100 + o * 10 + tn, n + 100].filter(function (x) { return x > 0; })));
      q.explain = (h ? h + ' hundred' + (h > 1 ? 's' : '') + ' + ' : '') + tn + ' ten' + (tn > 1 ? 's' : '') + ' + ' + o + ' one' + (o > 1 ? 's' : '') + ' = <b>' + n + '</b>.';
      return q;
    }
    if (kind === 'compare') {
      var max = lv <= 2 ? 99 : lv === 3 ? 999 : 9999;
      var a = rng.int(Math.floor(max / 3), max), b = rng.int(Math.floor(max / 3), max);
      while (a === b) b = rng.int(10, max);
      q.sub = 'Comparing'; q.prompt = 'Which sign goes in the box?  <b>' + a + ' ☐ ' + b + '</b>';
      Object.assign(q, mc(rng, a > b ? '>' : '<', ['=', a > b ? '<' : '>']));
      q.explain = a + ' is ' + (a > b ? 'bigger' : 'smaller') + ' than ' + b + ', so <b>' + a + ' ' + (a > b ? '>' : '<') + ' ' + b + '</b>. The open mouth always eats the bigger number.';
      return q;
    }
    if (kind === 'seqnum' || kind === 'between') {
      var step = rng.pick(lv <= 2 ? [1, 2, 5, 10] : [2, 3, 5, 10, 25, 50, 100]);
      var start = rng.int(2, 40) * step, seqv = [start, start + step, start + 2 * step, '?', start + 4 * step];
      q.sub = 'Counting patterns'; q.prompt = 'What number is missing?';
      q.visual = { type: 'seq', items: seqv.map(String), cell: 60 };
      Object.assign(q, mc(rng, start + 3 * step, [start + 3 * step + step, start + 3 * step - step, start + 3 * step + 1, start + 2 * step + 1]));
      q.explain = 'The numbers go up by <b>' + step + '</b> each time. ' + (start + 2 * step) + ' + ' + step + ' = <b>' + (start + 3 * step) + '</b>.';
      return q;
    }
    if (kind === 'expanded') {
      var hh = rng.int(1, 9), t2 = rng.int(1, 9), o2 = rng.int(1, 9), n2 = hh * 100 + t2 * 10 + o2;
      q.sub = 'Expanded form'; q.prompt = 'Which one shows <b>' + n2 + '</b> the long way?';
      Object.assign(q, mc(rng, hh * 100 + ' + ' + t2 * 10 + ' + ' + o2,
        [hh + ' + ' + t2 + ' + ' + o2, hh * 100 + ' + ' + t2 + ' + ' + o2 * 10, hh * 10 + ' + ' + t2 * 100 + ' + ' + o2]));
      q.explain = 'The ' + hh + ' is worth ' + hh * 100 + ', the ' + t2 + ' is worth ' + t2 * 10 + ', and the ' + o2 + ' is worth ' + o2 + '.';
      return q;
    }
    if (kind === 'place') {
      // digits 1-9 only: a 0 digit makes every distractor collapse to 0
      var s3 = [rng.int(1, 9), rng.int(1, 9), rng.int(1, 9), rng.int(1, 9)].join(''), n3 = +s3, pos = rng.int(0, 3);
      var vals = [1000, 100, 10, 1], names = ['thousands', 'hundreds', 'tens', 'ones'];
      var dig = +s3[pos], worth = dig * vals[pos];
      q.sub = 'Digit value'; q.prompt = 'In the number <b>' + n3 + '</b>, what is the <b>' + dig + '</b> worth?';
      Object.assign(q, mc(rng, worth, [dig, dig * 10, dig * 100, dig * 1000].filter(function (x) { return x !== worth; })));
      q.explain = 'The ' + dig + ' sits in the <b>' + names[pos] + '</b> place, so it is worth ' + dig + ' × ' + vals[pos] + ' = <b>' + worth + '</b>.';
      return q;
    }
    if (kind === 'order') {
      var set = [], i;
      for (i = 0; i < 4; i++) set.push(rng.int(100, 999));
      var sorted = set.slice().sort(function (x, y) { return x - y; });
      q.sub = 'Ordering'; q.prompt = 'Put these in order from smallest to biggest.';
      q.visual = { type: 'seq', items: set.map(String), cell: 62 };
      Object.assign(q, mc(rng, sorted.join(', '), [sorted.slice().reverse().join(', '), set.join(', '),
        sorted.slice(1).concat(sorted[0]).join(', ')]));
      q.explain = 'Compare the hundreds digit first, then the tens, then the ones. Answer: <b>' + sorted.join(', ') + '</b>.';
      return q;
    }
    // round
    var to = rng.pick([10, 100]), n4 = rng.int(to === 10 ? 21 : 121, 989);
    var ans = Math.round(n4 / to) * to;
    q.sub = 'Rounding'; q.prompt = 'Round <b>' + n4 + '</b> to the nearest <b>' + to + '</b>.';
    q.visual = { type: 'numline', min: Math.floor(n4 / to) * to, max: Math.ceil(n4 / to) * to + (n4 % to === 0 ? to : 0), step: to / (to === 10 ? 10 : 10), sparse: 5, marks: [{ v: n4, label: String(n4) }] };
    Object.assign(q, mc(rng, ans, [ans + to, ans - to, Math.floor(n4 / to) * to, Math.ceil(n4 / to) * to].filter(function (x) { return x !== ans; })));
    q.explain = 'Look at the ' + (to === 10 ? 'ones' : 'tens') + ' digit. ' + n4 + ' is closer to <b>' + ans + '</b> on the number line.';
    return q;
  });

  /* =========================================================
     ADDITION & SUBTRACTION
     ========================================================= */
  topic('addsub', { label: 'Addition & subtraction', emoji: '➕', strand: 'numeracy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'addsub', level: lv }, name = rng.pick(NAMES);
    if (lv === 1) {
      var a = rng.int(3, 9), b = rng.int(3, 9);
      q.sub = 'Within 20'; q.prompt = 'How many altogether?';
      q.visual = { type: 'tenframe', frames: [a, b] };
      Object.assign(q, mc(rng, a + b, near(a + b, rng, 3)));
      q.explain = a + ' + ' + b + ' = <b>' + (a + b) + '</b>. Fill the first ten-frame to 10 first, then count on.';
      return q;
    }
    if (lv === 2) {
      var a2 = rng.int(11, 48), b2 = rng.int(11, 40);
      if (rng.chance(0.5)) {
        q.sub = '2-digit add'; q.prompt = a2 + ' + ' + b2 + ' = ?';
        q.visual = { type: 'numline', min: a2, max: a2 + b2 + 4, step: Math.max(1, Math.round((b2 + 4) / 12)), sparse: 3, marks: [{ v: a2, label: String(a2) }] };
        Object.assign(q, mc(rng, a2 + b2, near(a2 + b2, rng, 11).concat([a2 + b2 + 10, a2 + b2 - 10])));
        q.explain = 'Add the tens, then the ones: ' + a2 + ' + ' + b2 + ' = <b>' + (a2 + b2) + '</b>.';
      } else {
        var big = rng.int(40, 89), sm = rng.int(11, 35);
        q.sub = '2-digit subtract'; q.prompt = big + ' − ' + sm + ' = ?';
        Object.assign(q, mc(rng, big - sm, near(big - sm, rng, 11).concat([big + sm])));
        q.explain = 'Take away the tens first, then the ones: ' + big + ' − ' + sm + ' = <b>' + (big - sm) + '</b>.';
      }
      return q;
    }
    if (lv === 3) {
      if (rng.chance(0.5)) {
        var t1 = rng.int(26, 78), whole = t1 + rng.int(14, 40);
        q.sub = 'Missing part'; q.prompt = name + ' has ' + t1 + ' cards. ' + name + ' wants ' + whole + '. How many more are needed?';
        q.visual = { type: 'barModel', total: String(whole), parts: [{ label: String(t1), size: t1 }, { label: '?', size: whole - t1 }] };
        Object.assign(q, mc(rng, whole - t1, near(whole - t1, rng, 9).concat([whole + t1])));
        q.explain = 'The whole is ' + whole + ' and one part is ' + t1 + '. ' + whole + ' − ' + t1 + ' = <b>' + (whole - t1) + '</b>.';
      } else {
        var x1 = rng.int(27, 68), y1 = rng.int(25, 49);
        q.sub = 'Regrouping'; q.prompt = x1 + ' + ' + y1 + ' = ?';
        Object.assign(q, mc(rng, x1 + y1, near(x1 + y1, rng, 4).concat([x1 + y1 - 10, x1 + y1 + 10])));
        q.explain = x1 + ' + ' + y1 + ': the ones make ' + (x1 % 10 + y1 % 10) + ', so trade ten of them for a new ten. Answer <b>' + (x1 + y1) + '</b>.';
      }
      return q;
    }
    if (lv === 4) {
      var p = rng.int(120, 480), r = rng.int(115, 320);
      if (rng.chance(0.5)) {
        q.sub = '3-digit add'; q.prompt = p + ' + ' + r + ' = ?';
        Object.assign(q, mc(rng, p + r, [p + r + 100, p + r - 100, p + r + 10, p + r - 10]));
        q.explain = 'Line up hundreds, tens, ones. ' + p + ' + ' + r + ' = <b>' + (p + r) + '</b>.';
      } else {
        var tot = rng.int(320, 780), used = rng.int(120, 290);
        q.sub = 'Word problem'; q.prompt = 'A school has ' + tot + ' books. ' + used + ' are borrowed. How many are left on the shelf?';
        q.visual = { type: 'barModel', total: String(tot), parts: [{ label: String(used), size: used }, { label: '?', size: tot - used }] };
        Object.assign(q, mc(rng, tot - used, [tot + used, tot - used + 100, tot - used - 10, tot - used + 10]));
        q.explain = tot + ' − ' + used + ' = <b>' + (tot - used) + '</b> books left.';
      }
      return q;
    }
    // level 5 — two-step
    var s1 = rng.int(140, 360), s2 = rng.int(90, 240), s3 = rng.int(60, 180);
    var res = s1 + s2 - s3;
    q.sub = 'Two-step problem';
    q.prompt = 'A shop had ' + s1 + ' apples. A truck brought ' + s2 + ' more. Then ' + s3 + ' were sold. How many apples now?';
    Object.assign(q, mc(rng, res, [s1 + s2 + s3, s1 - s2 + s3, res + 10, res - 100]));
    q.explain = 'Step 1: ' + s1 + ' + ' + s2 + ' = ' + (s1 + s2) + '. Step 2: ' + (s1 + s2) + ' − ' + s3 + ' = <b>' + res + '</b>.';
    return q;
  });

  /* =========================================================
     MULTIPLICATION & DIVISION  (7s and 8s weighted up)
     ========================================================= */
  topic('multdiv', { label: 'Multiplication & division', emoji: '✖️', strand: 'numeracy', modes: ['naplan', 'oc'], focus: true }, function (lv, rng) {
    var q = { topic: 'multdiv', level: lv }, name = rng.pick(NAMES);
    var SYM = ['🍎', '⭐', '🐠', '🍓', '🧁', '🐞', '🌸', '⚽'];
    // table choice: from level 3 up, 7 and 8 dominate on purpose
    var table = lv === 1 ? rng.pick([2, 2, 5, 10]) :
                lv === 2 ? rng.pick([2, 3, 4, 5, 6, 10]) :
                rng.pick([7, 7, 7, 8, 8, 8, 6, 9, 4]);

    if (lv === 1 && rng.chance(0.4)) {            // AC9M2A03 — doubling and halving
      var base1 = rng.int(3, 12), dbl = rng.chance(0.5);
      q.sub = dbl ? 'Doubling' : 'Halving';
      q.prompt = dbl ? 'What is <b>double ' + base1 + '</b>?' : 'What is <b>half of ' + (base1 * 2) + '</b>?';
      var show = dbl ? base1 : base1 * 2;
      q.visual = { type: 'tenframe', frames: show > 10 ? [10, show - 10] : [show] };
      Object.assign(q, mc(rng, dbl ? base1 * 2 : base1, [base1 + 2, base1 * 2 + 1, base1 - 1]));
      q.explain = dbl ? base1 + ' + ' + base1 + ' = <b>' + (base1 * 2) + '</b>. Doubling is just adding the number to itself.'
        : 'Split ' + (base1 * 2) + ' into two equal parts: ' + base1 + ' + ' + base1 + ' = ' + (base1 * 2) + ', so half is <b>' + base1 + '</b>.';
      return q;
    }
    if (lv <= 2 && rng.chance(0.55)) {
      var rows = Math.min(table, 6), cols = rng.int(2, 6);
      q.sub = rows + '× array'; q.prompt = 'How many altogether?';
      q.visual = { type: 'array', rows: rows, cols: cols, sym: rng.pick(SYM), cell: 30 };
      var prod0 = rows * cols;
      Object.assign(q, mc(rng, prod0, near(prod0, rng, 5).concat([prod0 + cols, prod0 - cols])));
      q.explain = rows + ' rows of ' + cols + ' = ' + rows + ' × ' + cols + ' = <b>' + prod0 + '</b>.';
      return q;
    }
    if (lv <= 2) {
      var g = rng.int(2, 4), per = rng.int(2, 5);
      q.sub = 'Equal groups'; q.prompt = 'There are ' + g + ' baskets with ' + per + ' in each. How many in total?';
      q.visual = { type: 'groups', groups: g, per: per, sym: rng.pick(SYM) };
      Object.assign(q, mc(rng, g * per, [g + per, g * per + per, g * per - per, g * per + 1]));
      q.explain = g + ' groups of ' + per + ' = ' + g + ' × ' + per + ' = <b>' + (g * per) + '</b>.';
      return q;
    }
    if (lv === 3) {
      var other = rng.int(3, 9), prod = table * other, style = rng.pick(['skip', 'array', 'plain']);
      q.sub = table + ' times table'; q.prompt = table + ' × ' + other + ' = ?';
      if (style === 'skip') q.visual = { type: 'skip', step: table, jumps: other, hideLast: true };
      else if (style === 'array' && other <= 8) q.visual = { type: 'array', rows: Math.min(table, 8), cols: other, cell: 24 };
      Object.assign(q, mc(rng, prod, [prod + table, prod - table, prod + other, table * (other + 1) - 1, prod + 10]));
      q.explain = 'Count in ' + table + 's, ' + other + ' times: ' +
        Array.from({ length: Math.min(other, 8) }, function (_, i) { return table * (i + 1); }).join(', ') +
        (other > 8 ? '…' : '') + '. So ' + table + ' × ' + other + ' = <b>' + prod + '</b>.' +
        (table === 8 ? ' Trick for 8s: double, double, double — ' + other + ' → ' + other * 2 + ' → ' + other * 4 + ' → ' + prod + '.' : '') +
        (table === 7 ? ' Trick for 7s: 7 × n = (5 × n) + (2 × n) = ' + (5 * other) + ' + ' + (2 * other) + ' = ' + prod + '.' : '');
      return q;
    }
    if (lv === 4) {
      var o4 = rng.int(3, 10), p4 = table * o4, mode = rng.pick(['missing', 'divide', 'word']);
      if (mode === 'missing') {
        q.sub = 'Missing factor'; q.prompt = table + ' × ☐ = ' + p4;
        Object.assign(q, mc(rng, o4, near(o4, rng, 3).concat([p4 - table])));
        q.explain = 'Ask: how many ' + table + 's fit into ' + p4 + '? ' + p4 + ' ÷ ' + table + ' = <b>' + o4 + '</b>.';
      } else if (mode === 'divide') {
        q.sub = 'Division'; q.prompt = p4 + ' ÷ ' + table + ' = ?';
        Object.assign(q, mc(rng, o4, near(o4, rng, 3).concat([table, p4 - table])));
        q.explain = 'Division undoes multiplication: ' + table + ' × ' + o4 + ' = ' + p4 + ', so ' + p4 + ' ÷ ' + table + ' = <b>' + o4 + '</b>.';
      } else {
        var sym4 = rng.pick(SYM);
        q.sub = 'Word problem'; q.prompt = name + ' packs ' + table + ' ' + sym4 + ' into each box and fills ' + o4 + ' boxes. How many ' + sym4 + ' is that?';
        q.visual = { type: 'skip', step: table, jumps: Math.min(o4, 7), hideLast: true };
        Object.assign(q, mc(rng, p4, [p4 + table, p4 - table, table + o4, p4 + o4]));
        q.explain = o4 + ' boxes of ' + table + ' = ' + table + ' × ' + o4 + ' = <b>' + p4 + '</b>.';
      }
      return q;
    }
    // level 5 — remainders, two-step, derived facts
    var mode5 = rng.pick(['remainder', 'twostep', 'derive']);
    if (mode5 === 'remainder') {
      var div = rng.pick([7, 8, 6, 9]), quo = rng.int(3, 9), rem = rng.int(1, div - 1), tot5 = div * quo + rem;
      q.sub = 'Division with remainder';
      q.prompt = tot5 + ' stickers are shared equally between ' + div + ' children. How many are left over?';
      Object.assign(q, mc(rng, rem, [quo, div - rem, rem + 1, rem + div].filter(function (x) { return x !== rem; })));
      q.explain = div + ' × ' + quo + ' = ' + (div * quo) + ', and ' + tot5 + ' − ' + (div * quo) + ' = <b>' + rem + '</b> left over (each child gets ' + quo + ').';
      return q;
    }
    if (mode5 === 'twostep') {
      var a5 = rng.pick([7, 8]), b5 = rng.int(4, 9), c5 = rng.int(6, 25), r5 = a5 * b5 + c5;
      q.sub = 'Two-step'; q.prompt = a5 + ' × ' + b5 + ' + ' + c5 + ' = ?';
      Object.assign(q, mc(rng, r5, [a5 * (b5 + c5), r5 - a5, r5 + a5, a5 * b5 - c5]));
      q.explain = 'Multiply first: ' + a5 + ' × ' + b5 + ' = ' + (a5 * b5) + '. Then add ' + c5 + ' → <b>' + r5 + '</b>.';
      return q;
    }
    var base = rng.int(3, 9), known = 4 * base, ans5 = 8 * base;
    q.sub = 'Using a fact you know';
    q.prompt = 'You know that 4 × ' + base + ' = ' + known + '. So what is <b>8 × ' + base + '</b>?';
    Object.assign(q, mc(rng, ans5, [known + base, known + 4, ans5 + base, ans5 - base]));
    q.explain = '8 is double 4, so the answer is double too: ' + known + ' + ' + known + ' = <b>' + ans5 + '</b>.';
    return q;
  });

  /* =========================================================
     FRACTIONS  (widest ladder — known soft spot)
     ========================================================= */
  topic('fractions', { label: 'Fractions', emoji: '🍕', strand: 'numeracy', modes: ['naplan', 'oc'], focus: true }, function (lv, rng) {
    var q = { topic: 'fractions', level: lv }, name = rng.pick(NAMES);
    var shapes = ['circle', 'bar', 'grid'];

    if (lv === 1) {
      // Year 1 / early Year 2: one half, then one quarter. AC9M1N02, AC9M2N03.
      var den = rng.pick([2, 2, 4]), shp = rng.pick(shapes);
      var col = V.C[rng.int(0, 5)];
      if (rng.chance(0.35)) {                       // half of a small collection
        var each1 = rng.int(2, 6), tot1 = each1 * 2, sym1 = rng.pick(['🍪', '🍎', '⭐', '🐟', '🧸']);
        q.sub = 'Half of a group';
        q.prompt = 'There are ' + tot1 + ' ' + sym1 + '. Half of them are put in a box. How many is that?';
        q.visual = { type: 'emojiRow', items: Array.from({ length: tot1 }, function () { return sym1; }), cell: 34 };
        Object.assign(q, mc(rng, each1, [tot1, each1 + 1, each1 - 1, tot1 - 1]));
        q.explain = 'Half means <b>two equal parts</b>. Share ' + tot1 + ' into 2 equal groups: <b>' + each1 + '</b> in each.';
        q.explainVisual = { type: 'groups', groups: 2, per: each1, sym: sym1 };
        return q;
      }
      q.sub = den === 2 ? 'Halves' : 'Quarters';
      q.prompt = 'What fraction of the shape is coloured?';
      q.visual = { type: 'fracShape', shape: shp, parts: den, shaded: 1, cols: 2, color: col };
      Object.assign(q, mc(rng, '1/' + den, ['1/' + (den === 2 ? 4 : 2), (den - 1) + '/' + den, '2/' + den, '1/8'],
        function (s2) { var p = s2.split('/'); return fr(p[0], p[1]); }));
      q.explain = 'The shape is cut into <b>' + den + '</b> equal parts and <b>1</b> is coloured, so ' + fr(1, den) +
        '. The bottom number counts <i>all</i> the parts, not just the white ones.';
      return q;
    }
    if (lv === 2) {
      // Year 2 works in halves, quarters and eighths — reached by halving again and again
      var d2 = rng.pick([2, 4, 4, 8, 8]), n2 = rng.int(1, d2 - 1), shp2 = rng.pick(shapes);
      if (rng.chance(0.45)) {                       // choose the picture that matches a fraction
        q.sub = 'Match the fraction'; q.prompt = 'Which picture shows ' + fr(n2, d2) + ' coloured?';
        var bar = function (p, sh) { return { visual: { type: 'fracShape', shape: 'bar', parts: p, shaded: sh, w: 120 } }; };
        var right = bar(d2, n2), wrongs = [], seenW = { }, cands = [
          [d2, n2 - 1], [d2, n2 + 1], [d2 + 1, n2], [d2 + 2, n2], [d2, d2 - n2], [d2 + 1, n2 + 1], [d2 - 1, n2]
        ];
        seenW[d2 + ':' + n2] = 1;
        cands.forEach(function (c) {                    // distinct, and never an equal-valued bar
          if (wrongs.length >= 3) return;
          var p = c[0], sh = c[1];
          if (p < 2 || sh < 1 || sh >= p) return;
          if (seenW[p + ':' + sh] || Math.abs(sh / p - n2 / d2) < 1e-9) return;
          seenW[p + ':' + sh] = 1; wrongs.push(bar(p, sh));
        });
        var all = rng.shuffle([right].concat(wrongs));
        q.format = 'mc'; q.choices = all; q.answer = all.indexOf(right);
        q.explain = 'Look for <b>' + d2 + '</b> equal parts with <b>' + n2 + '</b> of them coloured.';
        return q;
      }
      if (rng.chance(0.3)) {                        // folding: the Year 2 route to eighths
        var folds = rng.int(1, 3), partsF = Math.pow(2, folds);
        q.sub = 'Folding in half';
        q.prompt = 'A strip of paper is folded in half <b>' + folds + ' time' + (folds > 1 ? 's' : '') +
          '</b>, then opened out. How many equal parts are there?';
        q.visual = { type: 'fracShape', shape: 'bar', parts: partsF, shaded: 1, w: 300 };
        Object.assign(q, mc(rng, partsF, [folds, folds * 2, partsF + 2, partsF / 2]));
        q.explain = 'Each fold doubles the parts: ' +
          Array.from({ length: folds }, function (_, i) { return Math.pow(2, i + 1); }).join(' → ') +
          '. So <b>' + partsF + '</b> equal parts — ' + (partsF === 2 ? 'halves' : partsF === 4 ? 'quarters' : 'eighths') + '.';
        return q;
      }
      q.sub = 'Naming fractions'; q.prompt = 'What fraction of the shape is coloured?';
      q.visual = { type: 'fracShape', shape: shp2, parts: d2, shaded: n2, cols: d2 > 4 ? 4 : 2 };
      Object.assign(q, mc(rng, n2 + '/' + d2, [(d2 - n2) + '/' + d2, n2 + '/' + (d2 - n2), (n2 + 1) + '/' + d2, n2 + '/' + (d2 + 1)],
        function (s) { var p = s.split('/'); return fr(p[0], p[1]); }));
      q.explain = '<b>' + d2 + '</b> equal parts in total, <b>' + n2 + '</b> coloured → ' + fr(n2, d2) + '. Careful: ' + fr(n2, d2 - n2) + ' would count only the white parts on the bottom.';
      return q;
    }
    if (lv === 3) {                                  // Year 3: thirds, fifths, sixths; fraction of a collection
      if (rng.chance(0.4)) {
        var dn = rng.pick([3, 5, 6]), nn0 = rng.int(1, dn - 1), sh0 = rng.pick(shapes);
        q.sub = 'Thirds, fifths and sixths';
        q.prompt = 'What fraction of the shape is coloured?';
        q.visual = { type: 'fracShape', shape: sh0, parts: dn, shaded: nn0, cols: 3, color: V.C[rng.int(0, 5)] };
        Object.assign(q, mc(rng, nn0 + '/' + dn, [(dn - nn0) + '/' + dn, nn0 + '/' + (dn - nn0), (nn0 + 1) + '/' + dn, nn0 + '/' + (dn + 1)],
          function (s3) { var p3 = s3.split('/'); return fr(p3[0], p3[1]); }));
        q.explain = '<b>' + dn + '</b> equal parts, <b>' + nn0 + '</b> coloured → ' + fr(nn0, dn) +
          '. Unlike halves and quarters you cannot reach ' + (dn === 3 ? 'thirds' : dn === 5 ? 'fifths' : 'sixths') + ' by folding in half.';
        return q;
      }
      var d3 = rng.pick([3, 4, 5, 6]), each = rng.int(2, 5), total = d3 * each, n3 = rng.int(1, d3 - 1);
      var sym = rng.pick(['🍬', '🍓', '⭐', '🐟', '🧁']);
      q.sub = 'Fraction of a group';
      q.prompt = 'There are ' + total + ' ' + sym + '. ' + name + ' takes ' + fr(n3, d3) + ' of them. How many is that?';
      q.visual = { type: 'emojiRow', items: Array.from({ length: total }, function () { return sym; }), cell: total > 10 ? 28 : 34 };
      Object.assign(q, mc(rng, n3 * each, [each, total - n3 * each, d3, n3 * each + 1, n3 + each]));
      q.explain = 'Share ' + total + ' into <b>' + d3 + '</b> equal groups → ' + each + ' in each group. Take <b>' + n3 + '</b> group' + (n3 > 1 ? 's' : '') + ': ' + n3 + ' × ' + each + ' = <b>' + (n3 * each) + '</b>.';
      q.explainVisual = { type: 'groups', groups: d3, per: each, sym: sym };
      return q;
    }
    if (lv === 4) {
      var kind4 = rng.pick(['equivalent', 'compare', 'numberline']);
      if (kind4 === 'equivalent') {
        var base = rng.pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5]]), mult = rng.int(2, 4);
        var en = base[0] * mult, ed = base[1] * mult;
        q.sub = 'Equivalent fractions'; q.prompt = 'Which fraction is the same size as ' + fr(base[0], base[1]) + '?';
        q.visual = { type: 'fracShape', shape: 'bar', parts: base[1], shaded: base[0], w: 300 };
        Object.assign(q, mc(rng, en + '/' + ed, [base[0] + '/' + ed, en + '/' + base[1], (en + 1) + '/' + ed, base[0] + mult + '/' + (base[1] + mult)],
          function (s) { var p = s.split('/'); return fr(p[0], p[1]); }));
        q.explain = 'Cut every part into ' + mult + ' — the top and the bottom both × ' + mult + ': ' + fr(base[0], base[1]) + ' = ' + fr(en, ed) + '. The coloured amount does not change.';
        q.explainVisual = { type: 'fracShape', shape: 'bar', parts: ed, shaded: en, w: 300 };
        return q;
      }
      if (kind4 === 'compare') {
        var pool = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5], [3, 8], [5, 8], [1, 6], [5, 6], [3, 5], [7, 8]];
        var three = [], guard = 0;
        while (three.length < 3 && guard++ < 200) {          // three fractions, no ties
          var cand = rng.pick(pool);
          if (!three.some(function (p2) { return Math.abs(p2[0] / p2[1] - cand[0] / cand[1]) < 1e-9; })) three.push(cand);
        }
        var vals = three.map(function (p2) { return p2[0] / p2[1]; });
        var bigIdx = vals.indexOf(Math.max.apply(null, vals));
        var want = rng.chance(0.5) ? 'biggest' : 'smallest';
        var wantIdx = want === 'biggest' ? bigIdx : vals.indexOf(Math.min.apply(null, vals));
        var shuf = rng.shuffle(three.map(function (p2, i) { return { p: p2, i: i }; }));
        q.sub = 'Comparing fractions';
        q.prompt = 'Which fraction is the <b>' + want + '</b>?';
        q.format = 'mc';
        q.choices = shuf.map(function (o) { return { text: fr(o.p[0], o.p[1]) }; });
        q.answer = shuf.map(function (o) { return o.i; }).indexOf(wantIdx);
        q.explain = 'Think of one whole cake shared each way: ' +
          three.slice().sort(function (x, y) { return x[0] / x[1] - y[0] / y[1]; })
            .map(function (p2) { return fr(p2[0], p2[1]) + ' (' + Math.round(100 * p2[0] / p2[1]) + '%)'; }).join(' &lt; ') +
          '. A bigger bottom number means <b>smaller</b> pieces, so you cannot judge by the bottom number alone.';
        q.explainVisual = { type: 'fracShape', shape: 'bar', parts: three[wantIdx][1], shaded: three[wantIdx][0], w: 300 };
        return q;
      }
      var dl = rng.pick([4, 5, 6, 8]), ml = rng.int(1, dl - 1);
      q.sub = 'Fractions on a number line'; q.prompt = 'What fraction does the arrow point to?';
      q.visual = { type: 'fracLine', den: dl, mark: ml };
      Object.assign(q, mc(rng, ml + '/' + dl, [(ml + 1) + '/' + dl, (dl - ml) + '/' + dl, ml + '/' + (dl + 1), ml + '/' + (dl - 1)],
        function (s) { var p2 = s.split('/'); return fr(p2[0], p2[1]); }));
      q.explain = '0 to 1 is split into <b>' + dl + '</b> equal jumps. The arrow is on jump <b>' + ml + '</b>, so it is ' + fr(ml, dl) + '.';
      return q;
    }
    // level 5
    var kind5 = rng.pick(['addsame', 'collectionbig', 'improper', 'compare3']);
    if (kind5 === 'addsame') {
      var d5 = rng.pick([5, 6, 8, 10]), a5 = rng.int(1, d5 - 2), b5 = rng.int(1, d5 - a5);
      q.sub = 'Adding fractions'; q.prompt = fr(a5, d5) + ' + ' + fr(b5, d5) + ' = ?';
      q.visual = { type: 'fracShape', shape: 'bar', parts: d5, shaded: a5, w: 300 };
      var sum = a5 + b5, isOne = sum === d5;
      Object.assign(q, mc(rng, isOne ? '1' : sum + '/' + d5,
        [sum + '/' + (d5 * 2), (a5 * b5) + '/' + d5, (sum + 1) + '/' + d5, a5 + b5 + '/' + (d5 + d5)],
        function (s) { return s === '1' ? '1 whole' : (function (p) { return fr(p[0], p[1]); })(s.split('/')); }));
      q.explain = 'Same bottom number, so just add the tops: ' + a5 + ' + ' + b5 + ' = ' + sum + ' → ' + (isOne ? '<b>' + d5 + '/' + d5 + ', which is 1 whole</b>' : '<b>' + fr(sum, d5) + '</b>') + '.';
      return q;
    }
    if (kind5 === 'collectionbig') {
      var dd = rng.pick([3, 4, 5, 8]), ee = rng.int(3, 7), tt = dd * ee, nn = rng.int(2, dd - 1);
      q.sub = 'Fraction of a big group';
      q.prompt = 'A class has ' + tt + ' pencils. ' + fr(nn, dd) + ' of them are blue. How many are blue?';
      q.visual = { type: 'barModel', total: String(tt) + ' pencils', parts: Array.from({ length: dd }, function (_, i) { return { label: i < nn ? String(ee) : '', size: 1, color: i < nn ? V.C[0] : 'var(--vfaint)' }; }) };
      Object.assign(q, mc(rng, nn * ee, [ee, tt - nn * ee, nn * dd, nn + ee, (nn + 1) * ee]));
      q.explain = tt + ' ÷ ' + dd + ' = ' + ee + ' in each part. ' + nn + ' × ' + ee + ' = <b>' + (nn * ee) + '</b> blue pencils.';
      return q;
    }
    if (kind5 === 'improper') {
      var di = rng.pick([2, 3, 4]), wholes = rng.int(1, 2), extra = rng.int(1, di - 1);
      while (gcd(extra, di) !== 1) extra = rng.int(1, di - 1);   // avoid 2/4 and friends
      var top = wholes * di + extra;
      q.sub = 'Mixed numbers'; q.prompt = 'How many ' + (di === 2 ? 'halves' : di === 3 ? 'thirds' : 'quarters') + ' are there in <b>' + wholes + ' ' + fr(extra, di) + '</b>?';
      q.visual = { type: 'fracShape', shape: 'circle', parts: di, shaded: di };
      Object.assign(q, mc(rng, top, [wholes + extra, top + 1, top - 1, wholes * di]));
      q.explain = 'Each whole is ' + di + ' ' + (di === 2 ? 'halves' : di === 3 ? 'thirds' : 'quarters') + '. ' + wholes + ' × ' + di + ' = ' + wholes * di + ', plus ' + extra + ' more = <b>' + top + '</b>.';
      return q;
    }
    var trio = rng.shuffle([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [5, 8], [3, 8]]).slice(0, 3);
    var sortedT = trio.slice().sort(function (x, y) { return x[0] / x[1] - y[0] / y[1]; });
    q.sub = 'Ordering fractions'; q.prompt = 'Put these fractions in order from <b>smallest to biggest</b>.';
    var fmtT = function (arr) { return arr.map(function (p) { return fr(p[0], p[1]); }).join(' , '); };
    Object.assign(q, mc(rng, fmtT(sortedT), [fmtT(sortedT.slice().reverse()), fmtT(trio), fmtT([sortedT[1], sortedT[0], sortedT[2]])]));
    q.explain = 'Think of each as part of the same cake: ' + sortedT.map(function (p) { return fr(p[0], p[1]) + ' (' + Math.round(100 * p[0] / p[1]) + '%)'; }).join(' &lt; ') + '.';
    return q;
  });

  /* =========================================================
     PATTERNS & ALGEBRA
     ========================================================= */
  topic('patterns', { label: 'Patterns & algebra', emoji: '🔷', strand: 'numeracy', modes: ['naplan', 'oc'] }, function (lv, rng) {
    var q = { topic: 'patterns', level: lv };
    var shapeNames = ['circle', 'square', 'triangle', 'star', 'hexagon', 'rhombus'];
    if (lv <= 2 && rng.chance(0.55)) {
      var A = rng.pick(shapeNames), B = rng.pick(shapeNames.filter(function (s) { return s !== A; }));
      var unit = lv === 1 ? [A, B] : [A, A, B];
      var items = [], i;
      for (i = 0; i < 6; i++) items.push({ name: unit[i % unit.length], color: unit[i % unit.length] === A ? V.C[0] : V.C[1] });
      var missing = 5, correctName = items[missing].name;
      items[missing] = '?';
      q.sub = 'Repeating pattern'; q.prompt = 'What comes next in the pattern?';
      q.visual = { type: 'seq', items: items, cell: 52 };
      var extra = rng.shuffle(shapeNames.filter(function (s) { return s !== A && s !== B; })).slice(0, 2);
      var opts = rng.shuffle([A, B].concat(extra));
      q.format = 'mc';
      q.choices = opts.map(function (nm) { return { visual: { type: 'shape', name: nm, size: 62, color: nm === A ? V.C[0] : nm === B ? V.C[1] : V.C[2] } }; });
      q.answer = opts.indexOf(correctName);
      q.explain = 'The pattern unit is <b>' + unit.length + '</b> shapes long and then it repeats.';
      return q;
    }
    if (lv <= 3) {
      var step = lv <= 2 ? rng.pick([2, 5, 10, 3]) : rng.pick([7, 8, 6, 9, 25]);
      var st = rng.int(1, 9) * (step > 9 ? 1 : 2), arr = [st, st + step, st + 2 * step, '?', st + 4 * step];
      q.sub = 'Growing pattern'; q.prompt = 'Find the missing number.';
      q.visual = { type: 'seq', items: arr.map(String), cell: 58 };
      Object.assign(q, mc(rng, st + 3 * step, [st + 3 * step + 1, st + 3 * step - 1, st + 3 * step + step, st + 2 * step + 1]));
      q.explain = 'The rule is <b>+ ' + step + '</b> each time, so ' + (st + 2 * step) + ' + ' + step + ' = <b>' + (st + 3 * step) + '</b>.';
      return q;
    }
    if (lv === 4) {
      var mult = rng.pick([2, 3, 4, 7, 8]), inputs = [1, 2, 3, 4].map(function (x) { return x + rng.int(0, 2); });
      var rule = rng.chance(0.5) ? { f: function (x) { return x * mult; }, s: '× ' + mult } : { f: function (x) { return x * 2 + 3; }, s: '× 2 then + 3' };
      var ins = [2, 3, 5, 8], outs = ins.map(rule.f), hideIdx = 3;
      q.sub = 'Function machine';
      q.prompt = 'A machine changes numbers by the same rule every time.<br>' +
        ins.slice(0, 3).map(function (x, i) { return x + ' → ' + outs[i]; }).join('&nbsp; · &nbsp;') +
        '<br>What does <b>' + ins[hideIdx] + '</b> become?';
      Object.assign(q, mc(rng, outs[hideIdx], [ins[hideIdx] + mult, outs[hideIdx] + 1, outs[hideIdx] - 1, ins[hideIdx] * 2]));
      q.explain = 'The rule is <b>' + rule.s + '</b>. Check it: ' + ins[0] + ' → ' + outs[0] + ' ✓. So ' + ins[hideIdx] + ' → <b>' + outs[hideIdx] + '</b>.';
      return q;
    }
    var start = rng.int(2, 6), mstep = rng.pick([2, 3]), addv = rng.int(1, 4);
    var seq5 = [start], k;
    for (k = 0; k < 4; k++) seq5.push(seq5[seq5.length - 1] * mstep + addv);
    q.sub = 'Find the rule';
    q.prompt = 'Look at this pattern: <b>' + seq5.slice(0, 4).join(', ') + '</b>. What is the next number?';
    Object.assign(q, mc(rng, seq5[4], [seq5[3] + (seq5[3] - seq5[2]), seq5[4] + 1, seq5[3] * mstep, seq5[4] - addv]));
    q.explain = 'Each number is <b>× ' + mstep + ' then + ' + addv + '</b>. ' + seq5[3] + ' × ' + mstep + ' = ' + (seq5[3] * mstep) + ', + ' + addv + ' = <b>' + seq5[4] + '</b>.';
    return q;
  });

  root.LEO.bank.topic = topic;
  root.LEO.bank._mc = mc; root.LEO.bank._near = near; root.LEO.bank._NAMES = NAMES;
})(window);
