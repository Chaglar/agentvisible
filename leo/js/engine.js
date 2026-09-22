/* engine.js — session construction and the adaptive rule.

   NAPLAN mode reproduces NAPLAN's "tailored test" shape: questions come in blocks,
   and the block you get next depends on how the last one went. Do well and the next
   block is genuinely harder; struggle and it steps back down. That is the behaviour
   the real online test has, and it is why a hard-looking paper is a good sign.

   OC mode is deliberately NOT adaptive — the real Opportunity Class placement test
   is a fixed hard form for everyone, so this one sits high on the ladder throughout
   and defaults to exam-style feedback (all of it at the end).

   Drill mode adapts question by question, because the point there is practice at
   the edge of what Leo can already do. */
(function (root) {
  var L = root.LEO;

  var PLANS = {
    naplan: {
      label: 'NAPLAN practice', emoji: '🎯',
      pool: [['multdiv', 1.9], ['fractions', 1.9], ['number', 1.2], ['addsub', 1.2], ['patterns', 1.0],
             ['measurement', 1.1], ['geometry', 1.0], ['data', 1.0], ['reading', 1.3], ['language', 1.1]],
      adaptive: 'block', block: 5, start: null, feedback: 'instant', length: 12
    },
    oc: {
      label: 'OC test practice', emoji: '🏅',
      pool: [['thinking', 2.4], ['reasoning', 2.0], ['reading', 1.4], ['multdiv', 0.7], ['fractions', 0.7], ['patterns', 0.6]],
      adaptive: 'fixed', ladder: [3, 4, 4, 5, 4, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5], feedback: 'end', length: 12
    },
    coach: {                                   // not startable: the label for fix-up rounds
      label: 'Fix-ups', emoji: '🛠', pool: null, adaptive: 'none', feedback: 'instant', length: 0, internal: true
    },
    drill: {
      label: 'Focus drill', emoji: '⚡',
      pool: null, adaptive: 'step', feedback: 'instant', length: 10
    }
  };

  function weightFor(topicKey, base, store, norms) {
    var recs = store.load().answers.filter(function (a) { return a.tp === topicKey; }).slice(-40);
    if (recs.length < 6) return base * 1.15;                 // unseen topics get a small nudge up
    var pct = norms.percentile(norms.ability(recs).theta);
    return base * (1 + Math.max(0, (60 - pct) / 60));        // weaker topic → seen more often
  }

  function buildTopicPlan(mode, length, rng, opts) {
    var plan = PLANS[mode];
    if (mode === 'drill') {
      var t = opts.topic || weakest(1)[0].key;
      return Array.from({ length: length }, function () { return t; });
    }
    var weighted = plan.pool.map(function (p) { return [p[0], weightFor(p[0], p[1], L.store, L.norms)]; });
    var total = weighted.reduce(function (a, p) { return a + p[1]; }, 0);
    // proportional allocation, then shuffled so topics do not clump
    var out = [];
    weighted.forEach(function (p) {
      var n = Math.round(length * p[1] / total);
      for (var i = 0; i < n; i++) out.push(p[0]);
    });
    while (out.length < length) out.push(rng.pick(weighted)[0]);
    out = rng.shuffle(out).slice(0, length);
    // never the same topic three times running
    for (var i = 2; i < out.length; i++) {
      if (out[i] === out[i - 1] && out[i] === out[i - 2]) {
        var j = out.findIndex(function (x, k) { return k > i && x !== out[i]; });
        if (j > 0) { var tmp = out[i]; out[i] = out[j]; out[j] = tmp; }
      }
    }
    return out;
  }

  /* topics ranked weakest-first, for the focus-drill cards on the home screen */
  function weakest(n) {
    var out = Object.keys(L.bank.topics).map(function (k) {
      var meta = L.bank.topics[k], recs = L.store.byTopic(k).slice(-40);
      var a = L.norms.ability(recs);
      var pct = recs.length >= 6 ? L.norms.percentile(a.theta) : null;
      var acc = recs.length ? Math.round(100 * recs.filter(function (r) { return r.ok; }).length / recs.length) : null;
      return { key: k, meta: meta, n: recs.length, pct: pct, acc: acc, theta: a.theta,
               rank: (pct == null ? 55 : pct) - (meta.focus ? 18 : 0) };
    });
    out.sort(function (a, b) { return a.rank - b.rank; });
    return n ? out.slice(0, n) : out;
  }

  function sig(q) { return (q.topic + '|' + (q.sub || '') + '|' + q.prompt).slice(0, 160); }

  function create(opts) {
    opts = opts || {};
    var mode = opts.mode || 'naplan', plan = PLANS[mode];
    var length = opts.length || plan.length;
    var rng = L.RNG(opts.seed);
    var st = L.store.load();
    var recent = st.recentSigs || [];
    var topics = buildTopicPlan(mode, length, rng, opts);

    var startLv;
    if (mode === 'drill') startLv = L.norms.suggestLevel(L.store.byTopic(opts.topic).slice(-40));
    else if (mode === 'oc') startLv = 0;
    else startLv = Math.max(2, L.norms.suggestLevel(st.answers.slice(-80)));

    var S = {
      mode: mode, plan: plan, total: length, i: -1, level: startLv || 3,
      id: 's' + Date.now() + Math.random().toString(36).slice(2, 6),
      feedback: opts.feedback || plan.feedback,
      items: [], sessionSigs: [], blockNote: null, shownAt: 0, current: null,
      blockIdx: 0, blockScore: 0, blockSeen: 0,
      startedAt: Date.now(),

      levelFor: function (idx) {
        if (mode === 'oc') return plan.ladder[idx % plan.ladder.length];
        return S.level;
      },

      next: function () {
        S.i++;
        if (S.i >= length) return null;
        var topicKey = topics[S.i], lv = S.levelFor(S.i);
        var gen = L.bank.topics[topicKey], q = null, tries = 0;
        do {
          q = gen.gen(lv, rng); tries++;
        } while (tries < 14 && (recent.indexOf(sig(q)) >= 0 || S.sessionSigs.indexOf(sig(q)) >= 0));
        S.sessionSigs.push(sig(q));
        q.meta = gen;
        q.cur = L.curriculum ? L.curriculum.forQuestion(q.topic, lv) : null;
        S.current = q; S.shownAt = Date.now();
        var note = S.blockNote; S.blockNote = null;
        return { q: q, i: S.i, total: length, level: lv, note: note };
      },

      answer: function (choiceIdx) {
        var q = S.current, ms = Date.now() - S.shownAt;
        var ok = choiceIdx === q.answer ? 1 : 0;
        var at = Date.now(), cur = L.curriculum ? L.curriculum.forQuestion(q.topic, q.level) : { yr: null };
        S.items.push({
          t: at, aid: S.id + ':' + at + ':' + S.i, sid: S.id, m: mode,
          tp: q.topic, sub: q.sub || '', lv: q.level, yr: cur.yr,
          ok: ok, ms: Math.min(ms, 600000), nc: q.choices.length,
          prompt: q.prompt, chosen: choiceIdx
        });
        // adaptation
        if (plan.adaptive === 'block') {
          S.blockSeen++; S.blockScore += ok;
          if (S.blockSeen >= plan.block) {
            var before = S.level;
            if (S.blockScore >= plan.block - 1) S.level = Math.min(5, S.level + 1);
            else if (S.blockScore <= 1) S.level = Math.max(1, S.level - 1);
            if (S.level > before) S.blockNote = { dir: 'up', level: S.level };
            else if (S.level < before) S.blockNote = { dir: 'down', level: S.level };
            S.blockSeen = 0; S.blockScore = 0; S.blockIdx++;
          }
        } else if (plan.adaptive === 'step') {
          S.run = (S.run || 0);
          S.run = ok ? Math.max(1, S.run + 1) : Math.min(-1, S.run - 1);
          if (S.run >= 2) { S.level = Math.min(5, S.level + 1); S.run = 0; S.blockNote = { dir: 'up', level: S.level }; }
          if (S.run <= -2) { S.level = Math.max(1, S.level - 1); S.run = 0; S.blockNote = { dir: 'down', level: S.level }; }
        }
        return {
          ok: !!ok, answer: q.answer, explain: q.explain, explainVisual: q.explainVisual,
          correctText: q.choices[q.answer].text || null
        };
      },

      finish: function () {
        var okN = S.items.filter(function (a) { return a.ok; }).length;
        var sess = {
          id: S.id, mode: mode, t: S.startedAt, ms: Date.now() - S.startedAt,
          n: S.items.length, ok: okN, lvEnd: S.level
        };
        var before = L.norms.ability(L.store.load().answers.slice(-200));
        var light = S.items.map(function (a) {
          return { t: a.t, aid: a.aid, sid: a.sid, m: a.m, tp: a.tp, sub: a.sub, lv: a.lv, yr: a.yr, ok: a.ok, ms: a.ms, nc: a.nc };
        });
        L.store.logSession(sess, light);
        var stx = L.store.load();
        stx.recentSigs = (recent.concat(S.sessionSigs)).slice(-150);
        L.store.save();
        var after = L.norms.ability(stx.answers.slice(-200));
        var byTopic = {};
        S.items.forEach(function (a) {
          byTopic[a.tp] = byTopic[a.tp] || { n: 0, ok: 0 };
          byTopic[a.tp].n++; byTopic[a.tp].ok += a.ok;
        });
        return {
          n: S.items.length, ok: okN, pct: S.items.length ? Math.round(100 * okN / S.items.length) : 0,
          items: S.items, byTopic: byTopic, level: S.level,
          thetaBefore: before.theta, thetaAfter: after.theta,
          xpEarned: S.items.reduce(function (a, x) { return a + (x.ok ? 10 + x.lv * 2 : 2); }, 0),
          streak: L.store.touchStreak(), secs: Math.round((Date.now() - S.startedAt) / 1000)
        };
      }
    };
    return S;
  }

  L.engine = { create: create, PLANS: PLANS, weakest: weakest };
})(window);
