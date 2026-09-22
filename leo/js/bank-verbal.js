/* bank-verbal.js — reading, language conventions, OC thinking skills, OC maths reasoning */
(function (root) {
  var L = root.LEO, V = L.vis, B = L.bank, topic = B.topic, mc = B._mc, near = B._near, NAMES = B._NAMES;
  var C = L.content;   // passages, spelling, grammar, punctuation and thinking-skills banks

  /* ========================= READING ========================= */
  var PASSAGES = C.PASSAGES;

  topic('reading', { label: 'Reading', emoji: '📖', strand: 'literacy', modes: ['naplan', 'oc'] }, function (lv, rng) {
    var pool = PASSAGES.filter(function (p) { return Math.abs(p.lv - lv) <= 1; });
    if (!pool.length) pool = PASSAGES;
    var p = rng.pick(pool), qq = rng.pick(p.qs);
    var idx = qq.c.map(function (c, i) { return { c: c, i: i }; });
    // Extract-matching options ARE the labels A-D, so shuffling them would break the
    // link to the extract each one names. Those sets opt out.
    var order = qq.fixed ? idx : rng.shuffle(idx);
    return {
      topic: 'reading', level: lv, sub: p.title,
      passage: { title: p.title, text: p.text },
      prompt: qq.p, format: 'mc',
      choices: order.map(function (o) { return { text: o.c }; }),
      answer: order.map(function (o) { return o.i; }).indexOf(qq.a),
      explain: qq.e
    };
  });

  /* ========================= LANGUAGE CONVENTIONS ========================= */
  var SPELL = C.SPELL, GRAMMAR = C.GRAMMAR, PUNCT = C.PUNCT;

  topic('language', { label: 'Grammar & spelling', emoji: '✏️', strand: 'literacy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'language', level: lv };
    var kind = lv <= 2 ? rng.pick(['spell', 'punct']) : rng.pick(['spell', 'grammar', 'punct', 'grammar']);
    if (kind === 'spell') {
      var hi = Math.min(SPELL.length, Math.round(SPELL.length * (lv + 1) / 6));
      var lo = lv <= 2 ? 0 : Math.round(SPELL.length * (lv - 2) / 6);
      var w = rng.pick(SPELL.slice(lo, Math.max(lo + 6, hi)));
      q.sub = 'Spelling'; q.prompt = 'Which word is spelled <b>correctly</b>?';
      Object.assign(q, mc(rng, w[0], w.slice(1)));
      q.explain = 'The correct spelling is <b>' + w[0] + '</b>.';
      return q;
    }
    if (kind === 'grammar') {
      var gh = Math.min(GRAMMAR.length, Math.round(GRAMMAR.length * (lv + 1) / 6));
      var g = rng.pick(GRAMMAR.slice(0, Math.max(8, gh)));
      q.sub = 'Grammar'; q.prompt = g[0].replace('____', '<b>____</b>');
      Object.assign(q, mc(rng, g[1], g[2]));
      q.explain = g[3];
      return q;
    }
    var ph = Math.min(PUNCT.length, Math.round(PUNCT.length * (lv + 1) / 6));
    var p = rng.pick(PUNCT.slice(0, Math.max(6, ph)));
    q.sub = 'Punctuation'; q.prompt = p[0];
    Object.assign(q, mc(rng, p[1], p[2]));
    q.explain = p[3];
    return q;
  });

  /* ========================= OC THINKING SKILLS ========================= */
  var MUSTBETRUE = C.MUSTBETRUE;

  topic('thinking', { label: 'Thinking skills', emoji: '🧩', strand: 'thinking', modes: ['oc'] }, function (lv, rng) {
    var q = { topic: 'thinking', level: lv };
    var kinds = lv <= 2 ? ['odd', 'seq', 'matrix'] : lv === 3 ? ['odd', 'matrix', 'order', 'code', 'argue'] :
                lv === 4 ? ['order', 'matrix', 'code', 'balance', 'must', 'argue', 'argue'] :
                           ['order', 'must', 'balance', 'numlogic', 'code', 'argue', 'argue', 'argue'];
    var kind = rng.pick(kinds);

    // Argument analysis lives in bank-argue.js — four of the ten questions in the
    // real Thinking Skills sample were of this kind, so it is weighted heavily.
    if (kind === 'argue' && L.argue) return L.argue.pick(lv, rng);

    if (kind === 'odd') {
      var groups = C.ODDONE;
      var g0 = 0;
      var g = rng.pick(groups);
      var order = rng.shuffle(g[0].map(function (e, i) { return { e: e, i: i }; }));
      q.sub = 'Odd one out'; q.prompt = 'Which one does <b>not</b> belong with the others?';
      q.format = 'mc';
      q.choices = order.map(function (o) { return { visual: { type: 'emojiRow', items: [o.e], cell: 52 } }; });
      q.answer = order.map(function (o) { return o.i; }).indexOf(g[1]);
      q.explain = g[2];
      return q;
    }
    if (kind === 'seq') {
      var shapes = ['circle', 'square', 'triangle', 'star'], A = rng.pick(shapes), Bn = rng.pick(shapes.filter(function (s) { return s !== A; }));
      var unit = [A, Bn, Bn], items = [], i;
      for (i = 0; i < 7; i++) items.push({ name: unit[i % 3], color: V.C[unit[i % 3] === A ? 0 : 1] });
      var correct = items[6].name; items[6] = '?';
      q.sub = 'Pattern'; q.prompt = 'What comes next?';
      q.visual = { type: 'seq', items: items, cell: 46 };
      var others = rng.shuffle(shapes.filter(function (s) { return s !== A && s !== Bn; })).slice(0, 2);
      var opts = rng.shuffle([A, Bn].concat(others));
      q.format = 'mc';
      q.choices = opts.map(function (nm) { return { visual: { type: 'shape', name: nm, size: 60, color: V.C[nm === A ? 0 : nm === Bn ? 1 : 2] } }; });
      q.answer = opts.indexOf(correct);
      q.explain = 'The unit is <b>' + unit.join(', ') + '</b> and then it starts again.';
      return q;
    }
    if (kind === 'matrix') {
      var base = rng.pick(['circle', 'square', 'triangle', 'hexagon']);
      var rows = [0, 1, 2], cells = [], sizes = [0, 1, 2];
      // rule: colour changes down the columns, rotation changes across the rows
      var cols = [V.C[0], V.C[1], V.C[2]];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++)
        cells.push({ name: base, color: cols[r], rotate: c * 30 });
      var answerCell = cells[8]; cells[8] = '?';
      q.sub = 'Matrix'; q.prompt = 'Which shape completes the grid?';
      q.visual = { type: 'matrix', n: 3, cells: cells };
      var wrongs = [{ name: base, color: cols[0], rotate: 60 }, { name: base, color: cols[2], rotate: 0 }, { name: base, color: cols[1], rotate: 60 }];
      var all = rng.shuffle([answerCell].concat(wrongs));
      q.format = 'mc';
      q.choices = all.map(function (cc) { return { visual: { type: 'shape', name: cc.name, color: cc.color, rotate: cc.rotate, size: 74 } }; });
      q.answer = all.indexOf(answerCell);
      q.explain = 'Colour stays the same across each <b>row</b>, and the shape turns a little more in each <b>column</b>. The last cell needs the third row colour with the biggest turn.';
      return q;
    }
    if (kind === 'order') {
      var n = 4, people = rng.sample(NAMES, n);   // four options, as the real Thinking Skills paper has
      var order = rng.shuffle(people);             // order[0] = tallest
      var clues = [], i2;
      for (i2 = 0; i2 < n - 1; i2++) clues.push(order[i2] + ' is taller than ' + order[i2 + 1] + '.');
      if (lv >= 4) clues.push(order[0] + ' is taller than ' + order[n - 1] + '.');   // a redundant clue to read past
      var ask = rng.pick(['tallest', 'shortest', 'middle']);
      var correct = ask === 'tallest' ? order[0] : ask === 'shortest' ? order[n - 1] : order[1];
      q.sub = 'Logic puzzle';
      q.prompt = rng.shuffle(clues).join(' ') + '<br><br>Who is the <b>' + (ask === 'middle' ? 'second tallest' : ask) + '</b>?';
      Object.assign(q, mc(rng, correct, people.filter(function (p) { return p !== correct; })));
      q.explain = 'Line them up from tallest to shortest: <b>' + order.join(' → ') + '</b>.';
      return q;
    }
    if (kind === 'code') {
      var words = rng.sample(['CAT', 'DOG', 'SUN', 'BAT', 'PEN', 'CUP', 'HAT'], 2);
      var shift = rng.int(1, 3);
      var enc = function (w) { return w.split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65); }).join(''); };
      q.sub = 'Secret code';
      q.prompt = 'In a secret code <b>' + words[0] + '</b> is written as <b>' + enc(words[0]) + '</b>.<br>How is <b>' + words[1] + '</b> written?';
      Object.assign(q, mc(rng, enc(words[1]), [words[1].split('').reverse().join(''),
        words[1].split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 1) % 26) + 65); }).join(''),
        words[1].split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65); }).join('')]));
      q.explain = 'Each letter moves <b>' + shift + '</b> place' + (shift > 1 ? 's' : '') + ' forward in the alphabet. ' +
        words[1].split('').map(function (ch) { return ch + '→' + String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65); }).join(', ') + '.';
      return q;
    }
    if (kind === 'balance') {
      // 1 square = k circles ; how many circles balance m squares?
      var k = rng.int(2, 4), m = rng.int(2, 3);
      q.sub = 'Balance puzzle';
      q.prompt = 'One 🟦 balances exactly ' + k + ' 🔴.<br>How many 🔴 are needed to balance <b>' + m + ' 🟦</b>?';
      q.visual = { type: 'balance', left: ['🟦'], right: Array.from({ length: k }, function () { return '🔴'; }), tilt: 0 };
      Object.assign(q, mc(rng, k * m, [k + m, k * m + k, k * m - k, m]));
      q.explain = 'Each 🟦 needs ' + k + ' 🔴, and there are ' + m + ' of them: ' + m + ' × ' + k + ' = <b>' + (k * m) + '</b>.';
      return q;
    }
    if (kind === 'must') {
      var mb = rng.pick(MUSTBETRUE);
      q.sub = 'What must be true?';
      q.prompt = '<i>' + mb[0] + '</i><br><br>Which statement <b>must</b> be true?';
      Object.assign(q, mc(rng, mb[1], mb[2]));
      q.explain = mb[3];
      return q;
    }
    // numlogic — work out a number from clues
    var target = rng.int(21, 89);
    var clues2 = ['It is between ' + (target - rng.int(3, 8)) + ' and ' + (target + rng.int(3, 8)) + '.',
      'It is ' + (target % 2 === 0 ? 'an even' : 'an odd') + ' number.',
      'The digits add to ' + (Math.floor(target / 10) + target % 10) + '.'];
    var makeWrong = function () {
      for (var tries = 0; tries < 60; tries++) {
        var c = target + rng.int(-8, 8);
        if (c !== target && c > 9 && c < 100 && !(c % 2 === target % 2 && (Math.floor(c / 10) + c % 10) === (Math.floor(target / 10) + target % 10))) return c;
      }
      return target + 11;
    };
    q.sub = 'Number detective';
    q.prompt = 'I am thinking of a number.<br>' + clues2.join('<br>') + '<br><br>What is my number?';
    Object.assign(q, mc(rng, target, [makeWrong(), makeWrong(), makeWrong()]));
    q.explain = 'Only <b>' + target + '</b> fits all three clues at once. Test each option against every clue — one clue is never enough.';
    return q;
  });

  /* ========================= OC MATHEMATICAL REASONING ========================= */
  topic('reasoning', { label: 'Maths reasoning', emoji: '🧮', strand: 'thinking', modes: ['oc'] }, function (lv, rng) {
    var q = { topic: 'reasoning', level: lv }, name = rng.pick(NAMES), name2 = rng.pick(NAMES.filter(function (n) { return n !== name; }));
    var kinds = lv <= 2 ? ['twostep', 'combo'] : lv === 3 ? ['twostep', 'combo', 'backwards'] :
                lv === 4 ? ['backwards', 'combo', 'table', 'compare'] : ['backwards', 'table', 'compare', 'rate', 'combo'];
    var kind = rng.pick(kinds);

    if (kind === 'twostep') {
      var packs = rng.pick([7, 8, 6]), each = rng.int(3, 6), eaten = rng.int(3, 12);
      var res = packs * each - eaten;
      q.sub = 'Two-step problem';
      q.prompt = name + ' buys ' + each + ' packs of stickers. Each pack has ' + packs + ' stickers. ' + name + ' gives ' + eaten + ' away. How many are left?';
      q.visual = { type: 'groups', groups: Math.min(each, 4), per: Math.min(packs, 4), sym: '⭐' };
      Object.assign(q, mc(rng, res, [packs * each, packs * each + eaten, res - each, packs + each - eaten], null, 5));
      q.explain = 'First ' + each + ' × ' + packs + ' = ' + (each * packs) + '. Then ' + (each * packs) + ' − ' + eaten + ' = <b>' + res + '</b>.';
      return q;
    }
    if (kind === 'combo') {
      var tops = rng.int(3, 5), bots = rng.int(2, 4);
      q.sub = 'Combinations';
      q.prompt = name + ' has ' + tops + ' different t-shirts and ' + bots + ' different shorts. How many different outfits can ' + name + ' make?';
      q.visual = { type: 'array', rows: bots, cols: tops, cell: 30, sym: '👕' };
      Object.assign(q, mc(rng, tops * bots, [tops + bots, tops * bots + 1, tops * bots - bots, tops * 2 + bots], null, 5));
      q.explain = 'Each of the ' + tops + ' shirts can go with each of the ' + bots + ' shorts: ' + tops + ' × ' + bots + ' = <b>' + (tops * bots) + '</b> outfits. The grid shows every pair.';
      return q;
    }
    if (kind === 'backwards') {
      var m = rng.pick([2, 3, 7, 8]), add = rng.int(4, 19), start = rng.int(3, 12), end = start * m + add;
      q.sub = 'Work backwards';
      q.prompt = 'I think of a number. I multiply it by ' + m + ', then add ' + add + '. My answer is <b>' + end + '</b>. What number did I start with?';
      Object.assign(q, mc(rng, start, [end - add, Math.round((end + add) / m), start + 1, start - 1], null, 5));
      q.explain = 'Undo it backwards: ' + end + ' − ' + add + ' = ' + (end - add) + ', then ' + (end - add) + ' ÷ ' + m + ' = <b>' + start + '</b>.';
      return q;
    }
    if (kind === 'table') {
      var per = rng.pick([7, 8, 4, 6]), rowsN = [1, 2, 3, 5], hide = 3;
      q.sub = 'Reading a table';
      q.prompt = 'Each box holds the same number of pencils.<br>' +
        rowsN.slice(0, 3).map(function (r) { return r + ' box' + (r > 1 ? 'es' : '') + ' → ' + (r * per) + ' pencils'; }).join('<br>') +
        '<br><br>How many pencils in <b>' + rowsN[hide] + ' boxes</b>?';
      Object.assign(q, mc(rng, rowsN[hide] * per, [rowsN[hide] * per + per, 3 * per + 1, rowsN[hide] + per, rowsN[hide] * per - per], null, 5));
      q.explain = 'Each box holds ' + per + ' (because ' + rowsN[1] + ' boxes = ' + (rowsN[1] * per) + '). So ' + rowsN[hide] + ' × ' + per + ' = <b>' + (rowsN[hide] * per) + '</b>.';
      return q;
    }
    if (kind === 'compare') {
      var aTot = rng.int(4, 8) * rng.pick([7, 8]), bTot = aTot + rng.pick([-1, 1]) * rng.int(3, 15);
      q.sub = 'Compare and decide';
      q.prompt = name + ' saved $' + aTot + ' and ' + name2 + ' saved $' + bTot + '. A scooter costs $' + (Math.max(aTot, bTot) + rng.int(5, 20)) + '. How much <b>more</b> does ' + (aTot > bTot ? name2 : name) + ' need than ' + (aTot > bTot ? name : name2) + '?';
      var diff = Math.abs(aTot - bTot);
      Object.assign(q, mc(rng, '$' + diff, ['$' + (aTot + bTot), '$' + (diff + 5), '$' + Math.max(aTot, bTot), '$' + Math.min(aTot, bTot)], null, 5));
      q.explain = 'The scooter price cancels out — only the gap between the savings matters: ' + Math.max(aTot, bTot) + ' − ' + Math.min(aTot, bTot) + ' = <b>$' + diff + '</b>.';
      return q;
    }
    var rate = rng.pick([7, 8, 6]), mins = rng.pick([3, 4, 5]);
    q.sub = 'Rate problem';
    q.prompt = 'A machine makes ' + rate + ' toys every minute. How many toys does it make in <b>' + mins + ' minutes</b>?';
    q.visual = { type: 'skip', step: rate, jumps: mins, hideLast: true };
    Object.assign(q, mc(rng, rate * mins, [rate + mins, rate * mins + rate, rate * mins - rate, rate * (mins + 1)], null, 5));
    q.explain = 'Count on in ' + rate + 's for ' + mins + ' minutes: ' + rate + ' × ' + mins + ' = <b>' + (rate * mins) + '</b>.';
    return q;
  });
})(window);
