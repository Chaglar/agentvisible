/* bank-measure.js — measurement, geometry, data & chance (Year 2 → Year 3/4 stretch) */
(function (root) {
  var L = root.LEO, V = L.vis, B = L.bank, topic = B.topic, mc = B._mc, near = B._near, NAMES = B._NAMES, fr = L.fr;

  /* ========================= MEASUREMENT ========================= */
  topic('measurement', { label: 'Measurement & time', emoji: '📏', strand: 'numeracy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'measurement', level: lv }, name = rng.pick(NAMES);
    // Levels 1-3 stay on Year 2 content: informal units, calendars, clock to the
    // quarter-hour, money. Formal units (cm, mL, g) start at level 4, which is Year 3.
    var kinds = lv === 1 ? ['clock', 'longer', 'informal'] :
                lv === 2 ? ['clock', 'informal', 'calendar', 'money'] :
                lv === 3 ? ['clock', 'money', 'calendar', 'mass', 'informal'] :
                lv === 4 ? ['clock', 'ruler', 'jug', 'money', 'area'] :
                           ['elapsed', 'convert', 'area', 'perimeter', 'money'];
    var kind = rng.pick(kinds);

    if (kind === 'clock' || kind === 'elapsed') {
      var h = rng.int(1, 12), mins = lv === 1 ? 0 : lv === 2 ? rng.pick([0, 30]) : lv === 3 ? rng.pick([0, 15, 30, 45]) : rng.pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      if (kind === 'elapsed') {
        var add = rng.pick([15, 20, 30, 45, 50]);
        var tot = (h % 12) * 60 + mins + add, nh = Math.floor(tot / 60) % 12 || 12, nm = tot % 60;
        q.sub = 'Elapsed time';
        q.prompt = 'The clock shows the time now. What time will it be in <b>' + add + ' minutes</b>?';
        q.visual = { type: 'clock', h: h, m: mins };
        var f = function (o) { return o.h + ':' + String(o.m).padStart(2, '0'); };
        Object.assign(q, mc(rng, { h: nh, m: nm }, [{ h: h, m: (mins + add) % 60 }, { h: nh, m: (nm + 5) % 60 }, { h: (nh % 12) + 1, m: nm }], f));
        q.explain = 'Now it is ' + h + ':' + String(mins).padStart(2, '0') + '. Count on ' + add + ' minutes → <b>' + nh + ':' + String(nm).padStart(2, '0') + '</b>.';
        return q;
      }
      var label = mins === 0 ? "o'clock" : mins === 30 ? 'half past' : mins === 15 ? 'quarter past' : mins === 45 ? 'quarter to' : String(mins) + ' past';
      var correct, dis;
      if (lv <= 3) {
        correct = mins === 45 ? 'quarter to ' + (h % 12 + 1) : label + (mins === 0 ? ' ' + h : ' ' + h);
        if (mins === 0) correct = h + " o'clock";
        else if (mins === 30) correct = 'half past ' + h;
        else if (mins === 15) correct = 'quarter past ' + h;
        else correct = 'quarter to ' + (h % 12 + 1);
        dis = [h + " o'clock", 'half past ' + h, 'quarter past ' + h, 'quarter to ' + (h % 12 + 1), 'half past ' + (h % 12 + 1)]
          .filter(function (s) { return s !== correct; });
      } else {
        correct = h + ':' + String(mins).padStart(2, '0');
        dis = [(h % 12 + 1) + ':' + String(mins).padStart(2, '0'), h + ':' + String((mins + 5) % 60).padStart(2, '0'),
               h + ':' + String((60 - mins) % 60).padStart(2, '0'), (h % 12 + 1) + ':' + String((mins + 30) % 60).padStart(2, '0')];
      }
      q.sub = 'Telling time'; q.prompt = 'What time does this clock show?';
      q.visual = { type: 'clock', h: h, m: mins };
      Object.assign(q, mc(rng, correct, dis));
      q.explain = 'The short hand is just past <b>' + h + '</b> and the long hand is on <b>' + (mins / 5 || 12) + '</b>, which means ' + mins + ' minutes. So it is <b>' + (lv <= 3 ? correct : correct) + '</b>.';
      return q;
    }
    if (kind === 'longer') {
      var lens = [], guard = 0;
      while (lens.length < 4 && guard++ < 80) { var c = rng.int(2, 8); if (lens.indexOf(c) < 0) lens.push(c); }
      var wantLong = rng.chance(0.5);
      var target = wantLong ? Math.max.apply(null, lens) : Math.min.apply(null, lens);
      q.sub = 'Longer or shorter';
      q.prompt = 'Which bar is the <b>' + (wantLong ? 'longest' : 'shortest') + '</b>?';
      q.format = 'mc';
      q.choices = lens.map(function (v) { return { visual: { type: 'ruler', cm: 8, obj: v, start: 0 } }; });
      q.answer = lens.indexOf(target);
      q.explain = 'They all start at 0, so just look at where each one stops. The ' + (wantLong ? 'longest' : 'shortest') +
        ' reaches <b>' + target + ' cm</b>.';
      return q;
    }
    if (kind === 'informal') {                    // AC9M2M01 — measuring with uniform informal units
      var unit = rng.pick([['paperclip', '📎'], ['block', '🧱'], ['cube', '🧊'], ['pencil', '✏️'], ['step', '👣']]);
      var obj = rng.pick([['desk', '🪑'], ['book', '📗'], ['shoe', '👟'], ['bag', '🎒'], ['ribbon', '🎀']]);
      var howMany = rng.int(4, 9);
      if (rng.chance(0.4)) {                      // why the units must be the same size
        q.sub = 'Informal units';
        q.prompt = 'Two children measure the same ' + obj[0] + '. One says it is 6 ' + unit[0] +
          's long, the other says 9. What is the most likely reason?';
        Object.assign(q, mc(rng, 'Their ' + unit[0] + 's were different sizes',
          ['One of them counted wrong', 'The ' + obj[0] + ' changed size', 'Both answers are wrong']));
        q.explain = 'A measuring unit only works if every one is <b>the same size</b>. Different ' + unit[0] +
          's give different counts for the same ' + obj[0] + '.';
        return q;
      }
      q.sub = 'Informal units';
      q.prompt = 'The ' + obj[1] + ' ' + obj[0] + ' is measured with ' + unit[1] + ' ' + unit[0] +
        's laid end to end, with no gaps. How long is it?';
      q.visual = { type: 'emojiRow', items: Array.from({ length: howMany }, function () { return unit[1]; }), cell: 32 };
      Object.assign(q, mc(rng, howMany + ' ' + unit[0] + 's',
        [(howMany + 1) + ' ' + unit[0] + 's', (howMany - 1) + ' ' + unit[0] + 's', (howMany + 2) + ' ' + unit[0] + 's']));
      q.explain = 'Count the ' + unit[0] + 's: <b>' + howMany + '</b>. They must touch with no gaps and no overlaps, or the count is wrong.';
      return q;
    }
    if (kind === 'calendar') {                    // AC9M2M03 — days between events on a calendar
      var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      var MONTHS = [['January', 31], ['March', 31], ['April', 30], ['June', 30], ['September', 30], ['November', 30]];
      if (rng.chance(0.45)) {
        var d0 = rng.int(0, 6), add = rng.int(2, 9);
        q.sub = 'Calendar';
        q.prompt = 'Today is <b>' + DAYS[d0] + '</b>. What day will it be in <b>' + add + ' days</b>?';
        Object.assign(q, mc(rng, DAYS[(d0 + add) % 7],
          [DAYS[(d0 + add + 1) % 7], DAYS[(d0 + add - 1) % 7], DAYS[(d0 + add + 2) % 7]]));
        q.explain = 'Count on ' + add + ' days from ' + DAYS[d0] + '. Every <b>7</b> days lands back on ' + DAYS[d0] +
          ', so ' + add + ' days is ' + Math.floor(add / 7) + ' whole week' + (Math.floor(add / 7) === 1 ? '' : 's') +
          ' and ' + (add % 7) + ' more → <b>' + DAYS[(d0 + add) % 7] + '</b>.';
        return q;
      }
      var mon = rng.pick(MONTHS), start = rng.int(2, 12), gap = rng.int(4, 16);
      q.sub = 'Calendar';
      q.prompt = 'Sports day is ' + mon[0] + ' ' + start + '. The school concert is ' + mon[0] + ' ' + (start + gap) +
        '. How many days apart are they?';
      Object.assign(q, mc(rng, gap, [gap + 1, gap - 1, start + gap, gap + 7]));
      q.explain = (start + gap) + ' − ' + start + ' = <b>' + gap + ' days</b>.';
      return q;
    }
    if (kind === 'ruler') {
      var len = rng.int(3, 9), start = lv >= 3 && rng.chance(0.5) ? rng.int(1, 2) : 0;
      q.sub = 'Using a ruler'; q.prompt = 'How long is the bar?';
      q.visual = { type: 'ruler', cm: 10, obj: len, start: start };
      Object.assign(q, mc(rng, len + ' cm', [(len + start) + ' cm', (len + 1) + ' cm', (len - 1) + ' cm', (start + 1) + ' cm']));
      q.explain = start ? 'It starts at ' + start + ' and ends at ' + (start + len) + '. ' + (start + len) + ' − ' + start + ' = <b>' + len + ' cm</b> — not ' + (start + len) + '!' : 'It reaches the ' + len + ' mark, so it is <b>' + len + ' cm</b> long.';
      return q;
    }
    if (kind === 'money') {
      var coins = { 2: [5, 10, 20, 50], 3: [5, 10, 20, 50, 100], 4: [10, 20, 50, 100, 200], 5: [20, 50, 100, 200] }[Math.max(2, lv)] || [10, 20, 50];
      var n = lv <= 2 ? rng.int(2, 3) : rng.int(3, 5), picks = [], i, sum = 0;
      for (i = 0; i < n; i++) { var c = rng.pick(coins); picks.push(c); sum += c; }
      var money = function (cents) { return cents >= 100 ? '$' + (cents / 100).toFixed(2) : cents + 'c'; };
      if (lv >= 4 && rng.chance(0.45)) {
        var payCents = Math.ceil(sum / 100) * 100 + (sum % 100 === 0 ? 100 : 0);
        q.sub = 'Change'; q.prompt = 'These coins are spent at the shop. If ' + name + ' pays with ' + money(payCents) + ', how much change comes back?';
        q.visual = { type: 'coins', vals: picks };
        Object.assign(q, mc(rng, money(payCents - sum), [money(sum), money(payCents - sum + 10), money(payCents - sum - 10), money(payCents + sum)]));
        q.explain = 'The coins add to ' + money(sum) + '. ' + money(payCents) + ' − ' + money(sum) + ' = <b>' + money(payCents - sum) + '</b>.';
        return q;
      }
      q.sub = 'Money'; q.prompt = 'How much money is this?';
      q.visual = { type: 'coins', vals: picks };
      Object.assign(q, mc(rng, money(sum), [money(sum + 10), money(sum - 10), money(sum + 5), money(sum * 2)]));
      q.explain = picks.map(money).join(' + ') + ' = <b>' + money(sum) + '</b>.';
      return q;
    }
    if (kind === 'jug') {
      var cap = rng.pick([400, 500, 1000]), div = 4, filled = cap * rng.int(1, 3) / div;
      q.sub = 'Capacity'; q.prompt = 'How much water is in the jug?';
      q.visual = { type: 'jug', cap: cap, fill: filled, div: div };
      Object.assign(q, mc(rng, filled + ' mL', [(cap - filled) + ' mL', (filled + cap / div) + ' mL', cap + ' mL', Math.max(cap / div, filled - cap / div) + ' mL']));
      q.explain = 'The jug holds ' + cap + ' mL and the water reaches the ' + filled + ' mL line → <b>' + filled + ' mL</b>.';
      return q;
    }
    if (kind === 'mass') {
      var lft = rng.int(2, 5), rgt = lft + rng.int(1, 3);
      q.sub = 'Mass'; q.prompt = 'Which side is <b>heavier</b>?';
      q.visual = { type: 'balance', left: Array.from({ length: lft }, function () { return '🧊'; }), right: Array.from({ length: rgt }, function () { return '🧊'; }), tilt: 0.55 };
      Object.assign(q, mc(rng, 'The right side', ['The left side', 'They are the same']));
      q.explain = 'The pan that goes <b>down</b> is heavier. Right has ' + rgt + ' cubes, left has ' + lft + '.';
      return q;
    }
    if (kind === 'area' || kind === 'perimeter') {
      var w = rng.int(2, 6), hh = rng.int(2, 5), cells = [], x, y;
      for (x = 0; x < w; x++) for (y = 0; y < hh; y++) cells.push([x, y]);
      var isArea = kind === 'area';
      q.sub = isArea ? 'Area' : 'Perimeter';
      q.prompt = isArea ? 'How many squares cover this shape?' : 'What is the distance all the way around this shape? (each side of a square = 1 cm)';
      q.visual = { type: 'areaGrid', rows: hh, cols: w, cells: cells };
      var ans = isArea ? w * hh : 2 * (w + hh);
      Object.assign(q, mc(rng, ans + (isArea ? ' squares' : ' cm'), [(w + hh) + (isArea ? ' squares' : ' cm'), (w * hh) + (isArea ? '' : ' cm'), (ans + 2) + (isArea ? ' squares' : ' cm'), (ans - 2) + (isArea ? ' squares' : ' cm')].filter(function (s) { return s.indexOf(String(ans) + ' ') !== 0; })));
      q.explain = isArea ? w + ' columns × ' + hh + ' rows = <b>' + (w * hh) + ' squares</b>.' :
        'Add all four sides: ' + w + ' + ' + hh + ' + ' + w + ' + ' + hh + ' = <b>' + ans + ' cm</b>.';
      return q;
    }
    // convert
    var conv = rng.pick([['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['L', 'mL', 1000]]);
    var amt = rng.int(2, 9);
    q.sub = 'Units'; q.prompt = 'How many <b>' + conv[1] + '</b> are in <b>' + amt + ' ' + conv[0] + '</b>?';
    Object.assign(q, mc(rng, amt * conv[2], [amt * conv[2] / 10, amt * conv[2] * 10, conv[2], amt + conv[2]]));
    q.explain = '1 ' + conv[0] + ' = ' + conv[2] + ' ' + conv[1] + ', so ' + amt + ' × ' + conv[2] + ' = <b>' + (amt * conv[2]) + ' ' + conv[1] + '</b>.';
    return q;
  });

  /* ========================= GEOMETRY ========================= */
  topic('geometry', { label: 'Shape & space', emoji: '🔺', strand: 'numeracy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'geometry', level: lv };
    var d2 = [['triangle', 3, 3], ['square', 4, 4], ['rectangle', 4, 4], ['pentagon', 5, 5], ['hexagon', 6, 6], ['octagon', 8, 8], ['rhombus', 4, 4], ['trapezium', 4, 4], ['circle', 0, 0], ['oval', 0, 0]];
    var solids = [['cube', 6, 12, 8], ['sphere', 1, 0, 0], ['cone', 2, 1, 1], ['cylinder', 3, 2, 0], ['pyramid', 5, 8, 5], ['prism', 6, 12, 8]];
    var kinds = lv === 1 ? ['name2d'] : lv === 2 ? ['name2d', 'sides'] : lv === 3 ? ['sides', 'symmetry', 'name3d'] :
                lv === 4 ? ['symmetry', 'faces', 'coords', 'name3d'] : ['faces', 'coords', 'property', 'transform'];
    var kind = rng.pick(kinds);

    if (kind === 'name2d') {
      var s = rng.pick(d2.slice(0, 8));
      q.sub = '2D shapes'; q.prompt = 'What is this shape called?';
      q.visual = { type: 'shape', name: s[0], color: V.C[rng.int(0, 5)], rotate: lv >= 2 ? rng.pick([0, 15, 30, 45]) : 0 };
      Object.assign(q, mc(rng, s[0], rng.shuffle(d2.map(function (x) { return x[0]; }).filter(function (n) { return n !== s[0]; })).slice(0, 3)));
      q.explain = 'It has ' + (s[1] || 'no straight') + ' sides → a <b>' + s[0] + '</b>. Turning a shape never changes its name.';
      return q;
    }
    if (kind === 'sides') {
      var s2 = rng.pick(d2.slice(0, 8)), askCorners = rng.chance(0.5);
      q.sub = 'Sides & corners';
      q.prompt = 'How many <b>' + (askCorners ? 'corners (vertices)' : 'sides') + '</b> does this shape have?';
      q.visual = { type: 'shape', name: s2[0], color: V.C[rng.int(0, 5)] };
      var v = askCorners ? s2[2] : s2[1];
      Object.assign(q, mc(rng, v, [v + 1, v - 1, v + 2, v * 2]));
      q.explain = 'A ' + s2[0] + ' has <b>' + v + '</b> ' + (askCorners ? 'corners' : 'sides') + ' — for straight-sided shapes the two numbers always match.';
      return q;
    }
    if (kind === 'symmetry') {
      var sym = [['square', 4], ['rectangle', 2], ['circle', 99], ['triangle', 3], ['hexagon', 6], ['rhombus', 2], ['star', 5], ['heart', 1], ['trapezium', 1], ['arrow', 1]];
      var pick = rng.pick(sym), n = pick[1] === 99 ? 'more than 5' : String(pick[1]);
      q.sub = 'Symmetry'; q.prompt = 'How many lines of symmetry does this shape have?';
      q.visual = { type: 'shape', name: pick[0], color: V.C[rng.int(0, 5)], lines: pick[0] === 'square' ? ['v'] : [] };
      Object.assign(q, mc(rng, n, ['0', '1', '2', '3', '4', '6'].filter(function (x) { return x !== n; })));
      q.explain = 'Fold the shape so both halves match exactly. A ' + pick[0] + ' folds <b>' + n + '</b> way' + (pick[1] === 1 ? '' : 's') + '.';
      return q;
    }
    if (kind === 'name3d') {
      var so = rng.pick(solids);
      q.sub = '3D objects'; q.prompt = 'What is this 3D object called?';
      q.visual = { type: 'solid', name: so[0] };
      Object.assign(q, mc(rng, so[0], rng.shuffle(solids.map(function (x) { return x[0]; }).filter(function (n) { return n !== so[0]; })).slice(0, 3)));
      q.explain = 'A <b>' + so[0] + '</b>' + (so[1] > 1 ? ' has ' + so[1] + ' faces' : ' is perfectly round') + '.';
      return q;
    }
    if (kind === 'faces') {
      var so2 = rng.pick(solids.filter(function (s) { return s[1] > 1; })), what = rng.pick(['faces', 'edges', 'vertices']);
      var idx = what === 'faces' ? 1 : what === 'edges' ? 2 : 3, v2 = so2[idx];
      q.sub = 'Faces, edges, vertices'; q.prompt = 'How many <b>' + what + '</b> does a ' + so2[0] + ' have?';
      q.visual = { type: 'solid', name: so2[0] };
      Object.assign(q, mc(rng, v2, [v2 + 2, v2 - 2, v2 + 1, v2 * 2].filter(function (x) { return x >= 0; })));
      q.explain = 'A ' + so2[0] + ' has ' + so2[1] + ' faces, ' + so2[2] + ' edges and ' + so2[3] + ' vertices → <b>' + v2 + '</b>.';
      return q;
    }
    if (kind === 'coords') {
      var cols = 5, rows = 4, sym2 = ['🐱', '🚗', '🌳', '⚽', '🎈'];
      var toks = rng.sample([0, 1, 2, 3, 4], 4).map(function (x, i) { return { x: x, y: rng.int(0, rows - 1), sym: sym2[i] }; });
      var target = rng.pick(toks);
      q.sub = 'Grid position';
      q.prompt = 'Where is the ' + target.sym + ' on the grid?';
      q.visual = { type: 'coordGrid', cols: cols, rows: rows, tokens: toks };
      var code = function (t) { return String.fromCharCode(65 + t.x) + (t.y + 1); };
      Object.assign(q, mc(rng, code(target), toks.filter(function (t) { return t !== target; }).map(code).concat([String.fromCharCode(65 + target.y) + (target.x + 1)])));
      q.explain = 'Read the <b>letter across</b> first, then the <b>number up</b>: <b>' + code(target) + '</b>.';
      return q;
    }
    if (kind === 'property') {
      var facts = [
        ['I have 4 equal sides and 4 square corners. What am I?', 'square', ['rectangle', 'rhombus', 'trapezium']],
        ['I have 3 sides and 3 corners. What am I?', 'triangle', ['pentagon', 'rhombus', 'square']],
        ['I have 6 sides. What am I?', 'hexagon', ['pentagon', 'octagon', 'trapezium']],
        ['I have 8 sides. What am I?', 'octagon', ['hexagon', 'pentagon', 'square']],
        ['I have no corners and no straight sides. What am I?', 'circle', ['oval', 'rhombus', 'triangle']],
        ['I have 4 sides. Only 2 of them are parallel. What am I?', 'trapezium', ['square', 'rectangle', 'rhombus']],
        ['I have 5 sides and 5 corners. What am I?', 'pentagon', ['hexagon', 'square', 'octagon']]
      ], f = rng.pick(facts);
      q.sub = 'Shape riddle'; q.prompt = f[0];
      Object.assign(q, mc(rng, f[1], f[2]));
      q.explain = 'Those clues describe a <b>' + f[1] + '</b>.';
      return q;
    }
    // transform: flip / turn
    var tn = rng.pick(['triangle', 'trapezium', 'arrow', 'rhombus']), rot = rng.pick([90, 180, 270]);
    q.sub = 'Turning shapes';
    q.prompt = 'The arrow shape below is turned a <b>' + (rot === 90 ? 'quarter turn' : rot === 180 ? 'half turn' : 'three-quarter turn') + ' clockwise</b>. Which picture shows the result?';
    q.visual = { type: 'shape', name: 'arrow', color: V.C[1], size: 120 };
    var opts = rng.shuffle([rot, (rot + 90) % 360, (rot + 180) % 360, (rot + 270) % 360]);
    q.format = 'mc';
    q.choices = opts.map(function (r) { return { visual: { type: 'shape', name: 'arrow', color: V.C[1], size: 84, rotate: r } }; });
    q.answer = opts.indexOf(rot);
    q.explain = 'A ' + (rot === 90 ? 'quarter' : rot === 180 ? 'half' : 'three-quarter') + ' turn clockwise moves the point ' + (rot === 90 ? 'from pointing right to pointing down' : rot === 180 ? 'to the opposite side' : 'to pointing up') + '.';
    return q;
  });

  /* ========================= DATA & CHANCE ========================= */
  topic('data', { label: 'Data & chance', emoji: '📊', strand: 'numeracy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'data', level: lv };
    var cats = rng.sample([['Cats', '🐱'], ['Dogs', '🐶'], ['Fish', '🐟'], ['Birds', '🐦'], ['Rabbits', '🐰'], ['Frogs', '🐸']], 4);
    var counts = cats.map(function () { return rng.int(1, 8); });
    while (new Set(counts).size < counts.length) counts[rng.int(0, counts.length - 1)] = rng.int(1, 9);

    if (lv <= 2) {
      var rows = cats.slice(0, 4).map(function (c, i) { return { label: c[0], count: counts[i], sym: c[1] }; });
      var idx = rng.int(0, 3), mostIdx = counts.slice(0, 4).indexOf(Math.max.apply(null, counts.slice(0, 4)));
      var askMost = lv === 2 && rng.chance(0.5);
      q.sub = 'Picture graph';
      q.prompt = askMost ? 'Which pet do the <b>most</b> children have?' : 'How many children chose <b>' + rows[idx].label + '</b>?';
      q.visual = { type: 'picto', rows: rows, key: 'Key: 1 picture = 1 child' };
      if (askMost) Object.assign(q, mc(rng, rows[mostIdx].label, rows.filter(function (r, i) { return i !== mostIdx; }).map(function (r) { return r.label; })));
      else Object.assign(q, mc(rng, rows[idx].count, near(rows[idx].count, rng, 3)));
      q.explain = askMost ? '<b>' + rows[mostIdx].label + '</b> has the longest row (' + rows[mostIdx].count + ').' :
        'Count the ' + rows[idx].sym + ' pictures in the ' + rows[idx].label + ' row: <b>' + rows[idx].count + '</b>.';
      return q;
    }
    if (lv === 3 || lv === 4) {
      var bars = cats.map(function (c, i) { return { label: c[0], value: counts[i], color: V.C[i] }; });
      var mx = counts.indexOf(Math.max.apply(null, counts)), mn = counts.indexOf(Math.min.apply(null, counts));
      var ask = lv === 3 ? rng.pick(['read', 'most', 'least']) : rng.pick(['diff', 'total', 'morethan']);
      q.sub = 'Bar graph'; q.visual = { type: 'bars', bars: bars };
      if (ask === 'read') {
        var i2 = rng.int(0, 3);
        q.prompt = 'How many votes did <b>' + bars[i2].label + '</b> get?';
        Object.assign(q, mc(rng, counts[i2], near(counts[i2], rng, 2)));
        q.explain = 'Follow the ' + bars[i2].label + ' bar up to the scale: <b>' + counts[i2] + '</b>.';
      } else if (ask === 'most' || ask === 'least') {
        var t = ask === 'most' ? mx : mn;
        q.prompt = 'Which got the <b>' + (ask === 'most' ? 'most' : 'fewest') + '</b> votes?';
        Object.assign(q, mc(rng, bars[t].label, bars.filter(function (b, i) { return i !== t; }).map(function (b) { return b.label; })));
        q.explain = '<b>' + bars[t].label + '</b> has the ' + (ask === 'most' ? 'tallest' : 'shortest') + ' bar (' + counts[t] + ').';
      } else if (ask === 'diff') {
        q.prompt = 'How many <b>more</b> votes did ' + bars[mx].label + ' get than ' + bars[mn].label + '?';
        Object.assign(q, mc(rng, counts[mx] - counts[mn], [counts[mx] + counts[mn], counts[mx], counts[mx] - counts[mn] + 1, counts[mx] - counts[mn] - 1]));
        q.explain = counts[mx] + ' − ' + counts[mn] + ' = <b>' + (counts[mx] - counts[mn]) + '</b> more.';
      } else if (ask === 'total') {
        var sum = counts.reduce(function (a, b) { return a + b; }, 0);
        q.prompt = 'How many children voted <b>altogether</b>?';
        Object.assign(q, mc(rng, sum, [sum + 2, sum - 2, sum + counts[0], Math.max.apply(null, counts)]));
        q.explain = counts.join(' + ') + ' = <b>' + sum + '</b>.';
      } else {
        var half = counts.filter(function (c) { return c > counts[mn]; }).length;
        q.prompt = 'How many pets got <b>more than ' + counts[mn] + '</b> votes?';
        Object.assign(q, mc(rng, half, [half + 1, half - 1, 4, counts[mn]]));
        q.explain = 'Count the bars taller than ' + counts[mn] + ': <b>' + half + '</b>.';
      }
      return q;
    }
    // level 5 — chance
    var kind5 = rng.pick(['spinner', 'bag', 'words']);
    var RED = '#d03b3b', BLUE = V.C[0], GREEN = V.C[2];
    if (kind5 === 'spinner') {
      var parts = [], nRed = rng.int(1, 3), nBlue = rng.int(1, 3), nGreen = 8 - nRed - nBlue, i;
      for (i = 0; i < nRed; i++) parts.push({ color: RED, label: 'R' });
      for (i = 0; i < nBlue; i++) parts.push({ color: BLUE, label: 'B' });
      for (i = 0; i < nGreen; i++) parts.push({ color: GREEN, label: 'G' });
      var counts5 = { R: nRed, B: nBlue, G: nGreen };
      var best = Object.keys(counts5).sort(function (a, b) { return counts5[b] - counts5[a]; })[0];
      var nameOf = { R: 'red', B: 'blue', G: 'green' };
      q.sub = 'Chance'; q.prompt = 'Which colour is the spinner <b>most likely</b> to land on?';
      q.visual = { type: 'spinner', parts: rng.shuffle(parts) };
      Object.assign(q, mc(rng, nameOf[best], Object.keys(nameOf).filter(function (k) { return k !== best; }).map(function (k) { return nameOf[k]; }).concat(['all the same'])));
      q.explain = nameOf[best] + ' covers ' + counts5[best] + ' of the 8 sections — the biggest share, so it is most likely.';
      return q;
    }
    if (kind5 === 'bag') {
      var r5 = rng.int(1, 5), b5 = rng.int(1, 5), g5 = rng.int(1, 3), tot = r5 + b5 + g5;
      var items = [].concat(Array.from({ length: r5 }, function () { return RED; }),
        Array.from({ length: b5 }, function () { return BLUE; }), Array.from({ length: g5 }, function () { return GREEN; }));
      q.sub = 'Chance'; q.prompt = 'One marble is taken from the bag without looking. What is the chance it is <b>red</b>?';
      q.visual = { type: 'bag', items: items };
      Object.assign(q, mc(rng, r5 + ' out of ' + tot, [b5 + ' out of ' + tot, r5 + ' out of ' + (tot - r5), tot + ' out of ' + r5, g5 + ' out of ' + tot]));
      q.explain = 'There are ' + r5 + ' red marbles out of ' + tot + ' altogether → <b>' + r5 + ' out of ' + tot + '</b>.';
      return q;
    }
    var ev = rng.pick([
      ['The sun will rise tomorrow.', 'certain'],
      ['A dropped ball will fall upwards.', 'impossible'],
      ['It will rain in Sydney next month.', 'likely'],
      ['You will roll a 7 on a normal dice.', 'impossible'],
      ['You will roll an even number on a dice.', 'even chance'],
      ['A coin lands on heads.', 'even chance'],
      ['It will snow in Sydney tomorrow.', 'unlikely']
    ]);
    q.sub = 'Chance words'; q.prompt = 'How would you describe this?<br><b>“' + ev[0] + '”</b>';
    Object.assign(q, mc(rng, ev[1], ['certain', 'likely', 'even chance', 'unlikely', 'impossible'].filter(function (x) { return x !== ev[1]; })));
    q.explain = 'This event is <b>' + ev[1] + '</b>.';
    return q;
  });
})(window);
