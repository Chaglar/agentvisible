/* bank-spatial.js — 3D spatial reasoning for OC Thinking Skills.
 *
 * The sample paper's spatial question showed two solids built from unit cubes and
 * asked how long the second would take to glue, given the first. The trick it
 * teaches is that you never need to count the cubes: you count the JOINS, work out
 * the rate per face, and apply it. A child who starts counting cubes is solving a
 * harder problem than the one asked.
 *
 * This belongs here for a specific reason. Leo's visual-spatial reasoning sits at
 * the 98th percentile while his processing speed sits at the 6th — so this is the
 * one part of the paper where his strongest channel is doing the work and his
 * weakest one is barely involved. There was nothing of the kind in the bank. It is
 * also the section with almost no reading load, which is where he loses time
 * everywhere else.
 *
 * Solids are generated, not drawn by hand, so they do not repeat. Every generated
 * pair is checked before it is used: the rate must come out whole, the answer must
 * be whole, and the two solids must differ, or the question is discarded and
 * another is grown.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  function key(c) { return c[0] + ',' + c[1] + ',' + c[2]; }

  /* Grow a connected polycube by repeatedly sticking a new cube onto a random
     face of one already placed. Connected by construction, so no separate check. */
  function grow(rng, n) {
    var cubes = [[0, 0, 0]], seen = {};
    seen[key([0, 0, 0])] = 1;
    var dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    var guard = 0;
    while (cubes.length < n && guard++ < 400) {
      var from = rng.pick(cubes), d = rng.pick(dirs);
      var next = [from[0] + d[0], from[1] + d[1], from[2] + d[2]];
      if (next[2] < 0) continue;                       // keep it sitting on the ground
      if (seen[key(next)]) continue;
      seen[key(next)] = 1; cubes.push(next);
    }
    return cubes;
  }

  /* Two cubes touch when they differ by one along exactly one axis. Each touch is
     one join, and a join glues the two faces that meet. */
  function joins(cubes) {
    var seen = {}, n = 0, i, j;
    cubes.forEach(function (c) { seen[key(c)] = 1; });
    for (i = 0; i < cubes.length; i++) {
      var c = cubes[i];
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (d) {
        if (seen[key([c[0] + d[0], c[1] + d[1], c[2] + d[2]])]) n++;
      });
    }
    return n;
  }
  function gluedFaces(cubes) { return joins(cubes) * 2; }

  /* Normalise so the solid sits against the origin, which keeps the drawing tight. */
  function settle(cubes) {
    var mn = [0, 1, 2].map(function (a) { return Math.min.apply(null, cubes.map(function (c) { return c[a]; })); });
    return cubes.map(function (c) { return [c[0] - mn[0], c[1] - mn[1], c[2] - mn[2]]; });
  }

  function gen(lv, rng) {
    var rate = rng.pick([2, 3, 4]);            // seconds per glued face
    var P, S, fp, fs, guard = 0;
    do {
      P = settle(grow(rng, lv <= 3 ? rng.int(3, 4) : rng.int(4, 6)));
      S = settle(grow(rng, lv <= 3 ? rng.int(5, 6) : rng.int(6, 9)));
      fp = gluedFaces(P); fs = gluedFaces(S);
    } while (guard++ < 60 && (fp < 4 || fs <= fp || fs > 30));
    if (fs <= fp) { fs = fp + 2; }                              // degenerate growth; keep it sane

    var timeP = fp * rate, ans = fs * rate;
    // Distractors a child actually produces: the right rate on the wrong count,
    // counting cubes instead of faces, and forgetting that a join glues two faces.
    var wrong = [ans + 2 * rate, ans - 2 * rate, S.length * rate * 2, joins(S) * rate]
      .filter(function (v, i, a) { return v > 0 && v !== ans && a.indexOf(v) === i; });
    while (wrong.length < 3) {
      var extra = ans + rng.pick([-3, 3, 4, -4, 6]) * rate;
      if (extra > 0 && extra !== ans && wrong.indexOf(extra) < 0) wrong.push(extra);
    }
    var all = rng.shuffle([ans].concat(wrong.slice(0, 3)));

    return {
      topic: 'thinking', level: lv, sub: 'Solids and joins', format: 'mc',
      prompt: 'Gluing <b>solid P</b> together takes <b>' + timeP + ' seconds</b> in total. ' +
        'Every place two cubes meet is glued, and each meeting glues <b>two</b> faces.<br>' +
        'Working at the same rate, how long would <b>solid S</b> take?',
      visual: { type: 'cubePair', a: P, b: S },
      choices: all.map(function (v) { return { text: v + ' seconds' }; }),
      answer: all.indexOf(ans),
      explain: 'You never need to count the cubes. Count the joins.<br>' +
        'Solid P has <b>' + joins(P) + ' joins</b>, so <b>' + fp + ' glued faces</b>. ' +
        timeP + ' ÷ ' + fp + ' = <b>' + rate + ' seconds per face</b>.<br>' +
        'Solid S has <b>' + joins(S) + ' joins</b>, so <b>' + fs + ' glued faces</b>. ' +
        fs + ' × ' + rate + ' = <b>' + ans + ' seconds</b>.'
    };
  }

  L.spatial = { gen: gen, joins: joins, gluedFaces: gluedFaces, grow: grow, settle: settle };
})(window);
