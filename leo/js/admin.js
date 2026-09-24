/* admin.js — parent dashboard controller. */
(function () {
  var L = window.LEO, S = L.store, N = L.norms, CH = L.charts, CUR = L.curriculum;
  var $ = function (id) { return document.getElementById(id); };
  var range = 0;                                  // days; 0 = all time

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2);
  }
  function median(arr) {
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function since() { return range ? Date.now() - range * 864e5 : 0; }
  function answers() { return S.load().answers.filter(function (a) { return a.t >= since(); }); }
  function sessions() { return S.load().sessions.filter(function (s) { return s.t >= since(); }); }
  function age() { return N.ageYears(S.load().profile.dob); }

  /* ---------------- sync bar ---------------- */
  function paintSync() {
    var st = S.statusText();
    var colour = { ok: 'var(--good)', wait: 'var(--warn)', local: 'var(--serious)', err: 'var(--critical)' }[st.cls] || 'var(--mut)';
    $('syncDot').style.background = colour;
    $('syncText').innerHTML = st.text +
      (S.remote.lastSync ? ' <span class="sub">· last sync ' + new Date(S.remote.lastSync).toLocaleTimeString() + '</span>' : '');
    $('btnKey').style.display = (S.remote.configured === false) ? 'none' : '';
  }

  /* ---------------- KPIs ---------------- */
  function paintKpis() {
    var st = S.load(), all = answers(), a = N.ability(all), ag = age();
    var pctCohort = N.percentile(a.theta);
    var pctAge = ag != null ? N.agePercentile(a.theta, ag) : null;
    var shown = pctAge != null ? pctAge : pctCohort;
    var band = N.band(a.enough ? shown : null);
    var loPct = a.enough ? (ag != null ? N.agePercentile(a.theta - a.se, ag) : N.percentile(a.theta - a.se)) : null;
    var hiPct = a.enough ? (ag != null ? N.agePercentile(a.theta + a.se, ag) : N.percentile(a.theta + a.se)) : null;
    var acc = all.length ? Math.round(100 * all.filter(function (x) { return x.ok; }).length / all.length) : 0;
    var weekAgo = Date.now() - 7 * 864e5;
    var weekN = st.answers.filter(function (x) { return x.t >= weekAgo; }).length;
    var medS = Math.round(median(all.map(function (x) { return x.ms; })) / 100) / 10;

    var cards = [
      { k: ag != null ? 'Compared with his age' : 'Compared with Year 2',
        v: a.enough ? shown : '—', suf: a.enough ? ordinal(shown) + ' percentile' : '',
        d: a.enough ? ('68% interval: ' + loPct + '–' + hiPct + (ag != null ? ' · aged ' + ag.toFixed(1) : ''))
                    : 'Needs at least ' + N.params.minItems + ' answers (currently ' + all.length + ')',
        note: ageNote(ag, a, pctCohort, pctAge),
        band: band },
      { k: 'Working at', v: a.enough ? N.yearEquivalent(a.theta).toFixed(1) : '—', suf: a.enough ? ' year level' : '',
        d: a.enough ? ('θ = ' + a.theta.toFixed(2) + ' ± ' + a.se.toFixed(2) + ' logits') : 'Still gathering data' },
      { k: 'Accuracy', v: acc, suf: '%',
        d: all.length + ' questions · ' + sessions().length + ' sessions · about ' + medS + 's each' },
      { k: 'Routine', v: st.streak.days, suf: st.streak.days === 1 ? ' day running' : ' days running',
        d: weekN + ' questions in the last 7 days · ' + st.xp + ' XP total' }
    ];
    $('kpis').innerHTML = cards.map(function (c) {
      return '<div class="card kpi"><div class="k">' + c.k + '</div>' +
        '<div class="v">' + c.v + (c.suf ? '<small>' + c.suf + '</small>' : '') + '</div>' +
        '<div class="d">' + c.d + '</div>' +
        (c.band ? '<div class="band"><i class="dot" style="background:' + c.band.color + '"></i>' + c.band.label + '</div>' : '') +
        (c.note ? '<div class="d" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">' + c.note + '</div>' : '') +
        '</div>';
    }).join('');
  }
  /* Two percentiles for the same child invites "which one is right?". Both are —
     they answer different questions. Say so whenever the child is meaningfully older
     or younger than the middle of their year group, because that is exactly when the
     two numbers pull apart. */
  function ageNote(ag, a, pctCohort, pctAge) {
    if (ag == null || !a.enough || pctAge == null) return '';
    var gap = ag - N.params.cohortAgeMid;
    if (Math.abs(gap) < 0.3) return '';
    var older = gap > 0;
    return 'He is <b>' + Math.abs(gap).toFixed(1) + ' years ' + (older ? 'older' : 'younger') +
      '</b> than the middle of Year 2, so this is the ' + (older ? 'harder' : 'gentler') +
      ' of the two comparisons. Against his year group he is <b>' + pctCohort + ordinal(pctCohort) +
      '</b>. The age figure is the one that matters for selective entry.';
  }

  function ordinal(n) {
    if (n == null) return '';
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  /* ---------------- ability over time ---------------- */
  function paintAbility() {
    var st = S.load(), ss = sessions(), pts = [];
    ss.forEach(function (s) {
      var upTo = st.answers.filter(function (a) { return a.t <= s.t + Math.max(s.ms, 60000); });
      if (upTo.length < 4) return;
      var a = N.ability(upTo), ag = age();
      pts.push({
        label: fmtDate(s.t), full: fmtDate(s.t) + ' · ' + (L.engine.PLANS[s.mode] ? L.engine.PLANS[s.mode].label : s.mode),
        y: a.theta, lo: a.theta - a.se, hi: a.theta + a.se,
        tip: 'θ = ' + a.theta.toFixed(2) + ' ± ' + a.se.toFixed(2) + '<br>' +
             (ag != null ? N.agePercentile(a.theta, ag) : N.percentile(a.theta)) + ordinal(ag != null ? N.agePercentile(a.theta, ag) : N.percentile(a.theta)) +
             ' percentile · scored ' + s.ok + '/' + s.n
      });
    });
    $('abilityN').textContent = pts.length + (pts.length === 1 ? ' session' : ' sessions');
    CH.line($('chartAbility'), {
      points: pts, yMin: -2.5, yMax: 2.5,
      ticks: [{ v: -2, label: '−2' }, { v: -1, label: '−1' }, { v: 0, label: '0', strong: true }, { v: 1, label: '+1' }, { v: 2, label: '+2' }],
      format: function (v) { return 'θ ' + v.toFixed(2); }
    });
  }

  /* ---------------- topics ---------------- */
  function topicStats() {
    var all = answers(), ag = age();
    return Object.keys(L.bank.topics).map(function (k) {
      var meta = L.bank.topics[k], recs = all.filter(function (a) { return a.tp === k; });
      var a = N.ability(recs);
      var enough = recs.length >= N.params.minItems;
      var pct = enough ? (ag != null ? N.agePercentile(a.theta, ag) : N.percentile(a.theta)) : null;
      var acc = recs.length ? Math.round(100 * recs.filter(function (r) { return r.ok; }).length / recs.length) : null;
      var half = Math.floor(recs.length / 2), trend = null;
      if (recs.length >= 12) trend = N.ability(recs.slice(half)).theta - N.ability(recs.slice(0, half)).theta;
      var maxLv = recs.length ? Math.max.apply(null, recs.map(function (r) { return r.lv; })) : null;
      var cur = maxLv ? CUR.forQuestion(k, maxLv) : null;
      return {
        key: k, meta: meta, n: recs.length, acc: acc, pct: pct, theta: a.theta, se: a.se,
        med: recs.length ? Math.round(median(recs.map(function (r) { return r.ms; })) / 1000) : null,
        trend: trend, maxLv: maxLv, cur: cur
      };
    });
  }

  function paintTopics(stats) {
    var rows = stats.filter(function (t) { return t.n >= 6; })
      .sort(function (x, y) { return (x.pct == null ? 200 : x.pct) - (y.pct == null ? 200 : y.pct); });
    CH.hbar($('chartTopics'), {
      ref: 50, refLabel: 'average for his age',
      rows: rows.map(function (t) {
        var b = N.band(t.pct);
        return {
          label: t.meta.label, value: t.pct == null ? 0 : t.pct,
          valueLabel: t.pct == null ? 'too few' : t.pct,
          color: t.pct == null ? 'var(--line)' : b.color,
          tip: '<b>' + t.meta.label + '</b>' + t.n + ' questions · ' + t.acc + '% correct<br>θ = ' + t.theta.toFixed(2) +
               (t.pct != null ? '<br>' + t.pct + ordinal(t.pct) + ' percentile — ' + b.label : '')
        };
      })
    });

    var head = '<thead><tr><th>Topic</th><th class="num">Qs</th><th class="num">Accuracy</th>' +
      '<th style="min-width:80px">Spread</th><th class="num">Percentile</th><th>Curriculum</th>' +
      '<th class="num">Median time</th><th class="num">Trend</th><th>Status</th></tr></thead>';
    var body = stats.sort(function (x, y) {
      return (x.pct == null ? 150 : x.pct) - (y.pct == null ? 150 : y.pct);
    }).map(function (t) {
      var b = N.band(t.pct);
      var tr = t.trend == null ? '<span class="trend" style="color:var(--mut)">—</span>'
        : '<span class="trend" style="color:' + (t.trend > .12 ? 'var(--good)' : t.trend < -.12 ? 'var(--critical)' : 'var(--mut)') + '">' +
          (t.trend > .12 ? '▲' : t.trend < -.12 ? '▼' : '▬') + ' ' + (t.trend > 0 ? '+' : '') + t.trend.toFixed(2) + '</span>';
      var curCell = t.cur
        ? '<span class="pill" title="' + (t.cur.note || '').replace(/"/g, '') + '">' + CUR.yearLabel(t.cur.yr) + '</span>' +
          (t.cur.ac && t.cur.ac.length ? '<div class="sub" style="font-size:11px">' + t.cur.ac.join(' · ') + '</div>' : '')
        : '<span class="sub">—</span>';
      return '<tr' + (t.meta.focus ? ' class="focus"' : '') + '>' +
        '<td><span class="tname">' + t.meta.emoji + ' ' + t.meta.label + '</span></td>' +
        '<td class="num">' + t.n + '</td>' +
        '<td class="num">' + (t.acc == null ? '—' : t.acc + '%') + '</td>' +
        '<td><div class="mini"><i style="width:' + (t.acc || 0) + '%"></i></div></td>' +
        '<td class="num">' + (t.pct == null ? '<span class="sub">too few</span>' : t.pct + ordinal(t.pct)) + '</td>' +
        '<td>' + curCell + '</td>' +
        '<td class="num">' + (t.med == null ? '—' : t.med + 's') + '</td>' +
        '<td class="num">' + tr + '</td>' +
        '<td><span class="pill" style="color:' + b.color + '">' + b.label + '</span></td></tr>';
    }).join('');
    $('topicTable').innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  /* ---------------- accuracy by difficulty ---------------- */
  function paintLevels() {
    var all = answers(), a = N.ability(all);
    var bars = [1, 2, 3, 4, 5].map(function (lv) {
      var r = all.filter(function (x) { return x.lv === lv; });
      var ok = r.filter(function (x) { return x.ok; }).length;
      var c = r.length ? r.reduce(function (s, x) { return s + 1 / (x.nc || 4); }, 0) / r.length : 0.25;
      return {
        label: 'Level ' + lv, n: r.length,
        value: r.length ? 100 * ok / r.length : 0,
        expected: 100 * N.pCorrect(a.theta, N.params.bAt[lv - 1], c)
      };
    });
    CH.barLine($('chartLevels'), { bars: bars });
  }

  /* ---------------- daily activity ---------------- */
  function paintDays() {
    var n = range === 7 ? 14 : range === 30 ? 30 : 42, st = S.load(), out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      var d2 = new Date(d); d2.setDate(d2.getDate() + 1);
      var cnt = st.answers.filter(function (a) { return a.t >= d.getTime() && a.t < d2.getTime(); }).length;
      out.push({ n: cnt, label: d.getDate() + '/' + (d.getMonth() + 1), full: fmtDate(d.getTime()) });
    }
    $('daysN').textContent = 'last ' + n + ' days';
    CH.days($('chartDays'), { days: out });
  }

  /* ---------------- writing ----------------
     His one declining area, so it gets its own section rather than being folded
     into the ability model — a writing score is a rubric judgement, not an item
     response, and averaging the two would be dishonest. */
  var writeBlockHTML = null;   // the empty state must not destroy the markup it needs later
  /* Same trap as the writing block: rendering the empty state destroys the markup
     the populated state needs, so keep a copy and put it back. */
  var factsBlockHTML = null;

  var libBlockHTML = null;

  /* ---------------- games from school ---------------- */
  /* The teacher sent nine games home and has no way of seeing any of them played.
     This panel is what she gets back: what was played, how it went, and the note
     itself, ready to copy. Deliberately only the games — nothing else in this
     dashboard is anyone else's business. */
  var gamesBlockHTML = null;
  function paintGames() {
    var block = $('gamesBlock');
    if (gamesBlockHTML === null) gamesBlockHTML = block.innerHTML;
    var G = L.games, log = S.load().games || [], sum = G.summary(log);
    $('gamesN').textContent = sum.sittings ? sum.sittings + (sum.sittings === 1 ? ' sitting' : ' sittings') : '';
    if (!sum.sittings) {
      block.innerHTML = '<div class="card empty">None of the nine games played yet. On the practice page, ' +
        '<b>Games from school</b> deals the cards and keeps the score.</div>';
      return;
    }
    if (!$('gameTable')) block.innerHTML = gamesBlockHTML;

    var pct = Math.round(100 * sum.ok / Math.max(1, sum.rounds));
    $('gameStats').innerHTML =
      '<div class="ftrack"><div class="t">🎲 Games played</div><div class="v">' + sum.played.length +
        ' <em>of ' + sum.games.length + '</em></div></div>' +
      '<div class="ftrack"><div class="t">Rounds</div><div class="v">' + sum.rounds +
        ' <em>· ' + pct + '% right</em></div></div>' +
      '<div class="ftrack"><div class="t">⏱ Time played</div><div class="v">' +
        (sum.mins >= 60 ? Math.round(sum.mins / 60) + ' <em>hours</em>' : sum.mins + ' <em>minutes</em>') +
        '</div></div>';

    $('gameTable').innerHTML =
      '<thead><tr><th>Game</th><th class="num">Sittings</th><th class="num">Rounds</th><th class="num">Right</th>' +
      '<th class="num">Typical think</th><th>Last played</th></tr></thead><tbody>' +
      sum.games.slice().sort(function (a, b) { return b.rounds - a.rounds; }).map(function (g) {
        return '<tr' + (g.plays ? '' : ' class="dim"') + '><td><b>' + esc(g.game.title) + '</b>' +
          '<div class="sub">' + esc(g.game.skills.join(' · ')) + '</div></td>' +
          '<td class="num">' + (g.plays || '–') + '</td>' +
          '<td class="num">' + (g.rounds || '–') + '</td>' +
          '<td class="num">' + (g.rounds ? g.pct + '%' : '–') + '</td>' +
          '<td class="num">' + (g.med ? (g.med / 1000).toFixed(1) + 's' : '–') + '</td>' +
          '<td>' + (g.last ? fmtDate(g.last) : 'not yet') + '</td></tr>';
      }).join('') + '</tbody>';

    var st = S.load();
    var rep = G.report(log, { name: st.profile.name || 'Leo' });
    var who = st.profile.teacher || '';
    if (document.activeElement !== $('gameWho')) $('gameWho').value = who;
    $('gameSlide').innerHTML = L.report.render(log,
      { name: st.profile.name || 'Leo', avatar: st.profile.avatar || '🦁', teacher: who });
    $('gameReport').textContent = rep.title + '\n' + (who ? 'For ' + who + '\n' : '') + '\n' + rep.lines.join('\n');
  }

  function paintLibrary() {
    var block = $('libBlock');
    if (libBlockHTML === null) libBlockHTML = block.innerHTML;
    var BK = L.books, log = S.load().library || [];
    var books = BK.shelf(log), tot = BK.totals(log);
    $('libN').textContent = tot.sittings ? tot.sittings + (tot.sittings === 1 ? ' sitting' : ' sittings') : '';
    if (!books.length) {
      block.innerHTML = '<div class="card empty">No books on the shelf yet. On the practice page, ' +
        '<b>Add a book</b> — a sticker goes on the cover every time he reads it, and listening counts.</div>';
      return;
    }
    if (!$('libTable')) block.innerHTML = libBlockHTML;

    var how = tot.how || {}, hows = ['self', 'together', 'listen'];
    var totalHow = hows.reduce(function (n2, k) { return n2 + (how[k] || 0); }, 0) || 1;
    $('libStats').innerHTML =
      '<div class="ftrack"><div class="t">📚 On the shelf</div><div class="v">' + tot.books +
        ' <em>· ' + tot.finished + ' finished</em></div></div>' +
      '<div class="ftrack"><div class="t">⏱ Time read</div><div class="v">' +
        (tot.minutes >= 60 ? Math.round(tot.minutes / 60) + ' <em>hours</em>' : tot.minutes + ' <em>minutes</em>') +
        '</div></div>' +
      '<div class="ftrack"><div class="t">How he reads</div><div class="v" style="font-size:15px;line-height:1.5">' +
        hows.map(function (k) {
          return BK.HOW[k].emoji + ' ' + Math.round(100 * (how[k] || 0) / totalHow) + '%';
        }).join(' · ') + '</div>' +
        '<div class="bar">' + hows.map(function (k, i) {
          var n2 = how[k] || 0;
          return n2 ? '<i style="width:' + (100 * n2 / totalHow) + '%;background:var(--s' + (i + 1) + ')"></i>' : '';
        }).join('') + '</div></div>';

    $('libTable').innerHTML =
      '<thead><tr><th>Book</th><th>Stickers</th><th>Minutes</th><th>How</th><th>Last read</th></tr></thead><tbody>' +
      books.map(function (b) {
        var h2 = {};
        b.sessions.forEach(function (x) { h2[x.how || 'self'] = (h2[x.how || 'self'] || 0) + 1; });
        var last = b.sessions.length ? b.sessions[b.sessions.length - 1].t : b.t;
        return '<tr><td><b>' + esc(b.title) + '</b>' + (b.finished ? ' 🎀' : '') +
          (b.author ? '<div class="sub">' + esc(b.author) + '</div>' : '') + '</td>' +
          '<td>' + b.stickers.length + '</td><td>' + b.mins + '</td>' +
          '<td>' + (Object.keys(h2).map(function (k) { return BK.HOW[k].emoji + h2[k]; }).join(' ') || '–') + '</td>' +
          '<td>' + (last ? new Date(last).toLocaleDateString() : '–') + '</td></tr>';
      }).join('') + '</tbody>';
  }

  function paintFacts() {
    var block = $('factsBlock');
    if (factsBlockHTML === null) factsBlockHTML = block.innerHTML;
    var F = L.facts, log = S.load().facts || [];
    $('factsN').textContent = log.length ? log.length + ' answers' : '';
    if (!log.length) {
      block.innerHTML = '<div class="card empty">No fact practice yet. On the practice page, pick one of the ' +
        '<b>Fast maths</b> sets — he types the answer instead of choosing it, and the clock measures how long ' +
        'he thinks before the first key.</div>';
      return;
    }
    if (!$('factGrid')) block.innerHTML = factsBlockHTML;   // restore after an empty render

    $('factTracks').innerHTML = Object.keys(F.TRACKS).map(function (k) {
      var T = F.TRACKS[k], sum = F.summary(log, k), c = sum.counts, tot = sum.total;
      var seg = function (n, col) { return n ? '<i style="width:' + (100 * n / tot) + '%;background:' + col + '"></i>' : ''; };
      return '<div class="ftrack"><div class="t">' + T.emoji + ' ' + T.label + '</div>' +
        '<div class="v">' + c.fluent + ' <em>of ' + tot + ' known</em></div>' +
        '<div class="bar">' + seg(c.fluent, 'var(--good)') + seg(c.nearly, 'var(--warn)') +
        seg(c.slow, 'var(--serious)') + seg(c.wrong, 'var(--critical)') + '</div></div>';
    }).join('');

    var rows = F.grid(log);
    var cols = rows[0].cells.length;
    var h = '<div class="fgrid" style="grid-template-columns:38px repeat(' + cols + ',1fr)">';
    h += '<div></div>' + rows[0].cells.map(function (c) { return '<div class="hd">×' + c.n + '</div>'; }).join('');
    rows.forEach(function (r) {
      h += '<div class="rh">' + r.table + '</div>';
      h += r.cells.map(function (c) {
        var secs = c.ms == null ? '' : (c.ms / 1000).toFixed(1);
        return '<div class="fcell ' + c.level + '" title="' + c.label + ' — ' +
          ({ fluent: 'known by heart', nearly: 'nearly there', slow: 'right, but counting it out',
             wrong: 'getting it wrong', 'new': 'not tried' }[c.level]) +
          (secs ? ', typically ' + secs + 's' : '') + '">' + (secs || '·') + '</div>';
      }).join('');
    });
    $('factGrid').innerHTML = h + '</div>';

    // Worst first: wrong facts above merely slow ones, slowest first within each.
    var idx = F.index(log);
    var worst = F.all().map(function (f) { return { f: f, st: idx[f.id] }; })
      .filter(function (x) { return x.st && x.st.seen && x.st.level !== 'fluent'; })
      .sort(function (a, b) {
        var aw = !a.st.lastOk, bw = !b.st.lastOk;          // wrong last time beats merely slow
        if (aw !== bw) return aw ? -1 : 1;
        return (b.st.medianMs || 0) - (a.st.medianMs || 0);
      }).slice(0, 12);
    $('factTable').innerHTML =
      '<thead><tr><th>Fact</th><th>Answer</th><th>Typical think</th><th>Tried</th><th>State</th></tr></thead><tbody>' +
      worst.map(function (x) {
        return '<tr><td><b>' + F.prompt(x.f).replace('?', '…') + '</b></td><td>' + x.f.answer + '</td>' +
          '<td>' + (x.st.medianMs == null ? '–' : (x.st.medianMs / 1000).toFixed(1) + 's') + '</td>' +
          '<td>' + x.st.seen + '</td>' +
          '<td>' + factState(x.st) + '</td></tr>';
      }).join('') + '</tbody>';
  }

  function factState(st) {
    if (!st.lastOk) return 'Got it wrong last time';
    if (st.wrong) return 'Right now, wrong before';
    return st.level === 'slow' ? 'Counting it out' : 'Nearly there';
  }

  function paintWriting() {
    var block = $('writeBlock');
    if (writeBlockHTML === null) writeBlockHTML = block.innerHTML;
    var w = (S.load().writing || []).filter(function (x) { return x.t >= since(); });
    $('writeN').textContent = w.length ? w.length + (w.length === 1 ? ' piece' : ' pieces') : '';
    if (!w.length) {
      block.innerHTML = '<div class="card empty">No writing marked yet. On the practice page, pick a writing task, ' +
        'write it on paper, and photograph it.</div>';
      return;
    }
    if (!$('chartWriting')) block.innerHTML = writeBlockHTML;   // restore after an empty render
    var DIMS = [['handwriting', 'Letters', 'var(--s1)'], ['spelling', 'Spelling', 'var(--s2)'],
                ['punctuation', 'Punctuation', 'var(--s3)'], ['ideas', 'Ideas', 'var(--good)'],
                ['structure', 'Structure', 'var(--serious)']];
    CH.lines($('chartWriting'), {
      yMin: 0, yMax: 5, ticks: [1, 2, 3, 4, 5],
      series: DIMS.map(function (d) {
        return { label: d[1], color: d[2],
          points: w.filter(function (x) { return x.scores && x.scores[d[0]]; })
                   .map(function (x) { return { y: x.scores[d[0]], label: fmtDate(x.t) }; }) };
      })
    });
    $('writeLegend').innerHTML = DIMS.map(function (d) {
      return '<span><i class="dot" style="background:' + d[2] + '"></i> ' + d[1] + '</span>';
    }).join('');

    var last = w[w.length - 1];
    $('writeLatest').innerHTML =
      '<div class="sub">' + fmtDate(last.t) + ' · ' + esc(last.title || last.kind) + ' · ' +
      (last.words || 0) + ' words in ' + Math.round((last.secs || 0) / 60) + ' min' +
      (last.typed ? ' · typed' : ' · handwritten') + '</div>' +
      (last.toLeo ? '<div style="margin-top:10px;font-size:14.5px;line-height:1.55">' + esc(last.toLeo) + '</div>' : '') +
      (last.fix && last.fix.length ? '<div style="margin-top:10px"><b style="font-size:13px">Told to fix next:</b><div class="sub">' +
        last.fix.map(esc).join(' · ') + '</div></div>' : '');

    var head = '<thead><tr><th>Date</th><th>Task</th><th class="num">Words</th><th class="num">Min</th>' +
      DIMS.map(function (d) { return '<th class="num">' + d[1].slice(0, 5) + '</th>'; }).join('') + '<th class="num">Spelling slips</th></tr></thead>';
    var body = w.slice().reverse().slice(0, 15).map(function (x) {
      return '<tr><td>' + fmtDate(x.t) + '</td><td>' + esc(x.title || x.kind) + '</td>' +
        '<td class="num">' + (x.words || 0) + '</td><td class="num">' + Math.round((x.secs || 0) / 60) + '</td>' +
        DIMS.map(function (d) {
          var v = x.scores && x.scores[d[0]];
          return '<td class="num" style="color:' + (v >= 4 ? 'var(--good)' : v >= 3 ? 'var(--ink)' : 'var(--critical)') + '">' + (v || '—') + '</td>';
        }).join('') +
        '<td class="num">' + ((x.spelling || []).length) + '</td></tr>';
    }).join('');
    $('writeTable').innerHTML = head + '<tbody>' + body + '</tbody>';

    var counts = {};
    w.forEach(function (x) {
      (x.spelling || []).forEach(function (pair) {
        var k = String(pair).split('→')[0].toLowerCase().trim();
        if (k) counts[k] = (counts[k] || 0) + 1;
      });
    });
    var rep = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    $('writeWords').innerHTML = rep.length
      ? rep.slice(0, 20).map(function (k) {
          return '<span class="pill" style="margin:0 6px 6px 0;display:inline-block' +
            (counts[k] > 1 ? ';border-color:var(--critical);color:var(--critical)' : '') + '">' +
            esc(k) + (counts[k] > 1 ? ' ×' + counts[k] : '') + '</span>';
        }).join('')
      : '<div class="sub">No spelling errors recorded yet.</div>';
  }

  function esc(s2) {
    return String(s2 == null ? '' : s2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------------- recommendations ---------------- */
  function paintRecs(stats) {
    var out = [], all = answers(), a = N.ability(all);
    var overall = N.percentile(a.theta);
    // a strong child's weak spot can still sit near average, so flag anything well
    // below his own level as well as anything below the cohort
    var weak = stats.filter(function (t) {
      return t.n >= 6 && t.pct != null && (t.pct < 45 || (a.enough && overall - t.pct >= 20));
    }).sort(function (x, y) { return x.pct - y.pct; });
    var unseen = stats.filter(function (t) { return t.n < 6; });
    var strong = stats.filter(function (t) { return t.pct != null && t.pct >= 85; })
      .sort(function (x, y) { return y.pct - x.pct; });

    weak.slice(0, 3).forEach(function (t) {
      out.push({ e: t.meta.emoji, t: t.meta.label + ' — ' + t.pct + ordinal(t.pct) + ' percentile' + (overall - t.pct >= 20 ? ' (he is ' + overall + ordinal(overall) + ' overall)' : ''),
        d: t.n + ' questions at ' + t.acc + '% correct' + (t.med ? ', median ' + t.med + 's' : '') + '. ' +
           (overall - t.pct >= 20 ? 'That is <b>' + (overall - t.pct) + ' percentile points</b> below his own level — this is the real gap.'
                                  : 'Below the average for his age.') +
           ' Ten focused questions a day will move this faster than anything else.',
        a: '../?drill=' + t.key, al: 'Practise 10 questions on this →' });
    });
    if (strong.length) {
      out.push({ e: '🚀', t: 'Strongest areas: ' + strong.slice(0, 3).map(function (t) { return t.meta.label; }).join(', '),
        d: 'Questions in these topics are consistently arriving at level 4–5. Running the OC mode more often is the way to keep pushing the ceiling here.' });
    }
    if (unseen.length) {
      out.push({ e: '🧭', t: 'Not yet measured: ' + unseen.slice(0, 4).map(function (t) { return t.meta.label; }).join(', '),
        d: 'Fewer than ' + N.params.minItems + ' answers, so no percentile can be shown. A few NAPLAN rounds will fill this in on their own.' });
    }
    var slow = stats.filter(function (t) { return t.med != null && t.n >= 8 && t.med > 35; });
    if (slow.length) {
      out.push({ e: '⏱', t: 'Slow topics: ' + slow.map(function (t) { return t.meta.label + ' (' + t.med + 's)'; }).join(', '),
        d: 'Accuracy can look fine while speed is the real problem — in a timed paper it costs marks. These need fluency work, not more explanation.' });
    }
    if (a.enough && overall >= 80) {
      out.push({ e: '🏅', t: 'On the OC timeline',
        d: 'He is in the upper band overall. The NSW OC placement test is sat in Year 4 for Year 5 entry, so this is early foundation work. Thinking Skills and inferential reading are the two most discriminating sections over the long run.' });
    }
    if (!out.length) out.push({ e: '📈', t: 'Recommendations appear once there is enough data', d: 'After a few sessions the strong and weak topic analysis builds itself.' });

    $('recs').innerHTML = out.map(function (r) {
      return '<div class="rec"><span class="e">' + r.e + '</span><div><div class="t">' + r.t + '</div>' +
        '<div class="d">' + r.d + '</div>' + (r.a ? '<a href="' + r.a + '">' + r.al + '</a>' : '') + '</div></div>';
    }).join('');
  }

  /* ---------------- session log ---------------- */
  function paintSessions() {
    var ss = sessions().slice().reverse().slice(0, 20), st = S.load();
    if (!ss.length) { $('sessionTable').innerHTML = '<tbody><tr><td class="sub">Nothing recorded yet.</td></tr></tbody>'; return; }
    var head = '<thead><tr><th>Date</th><th>Mode</th><th class="num">Score</th><th class="num">Accuracy</th>' +
      '<th class="num">Final level</th><th class="num">Time</th><th>Topics</th></tr></thead>';
    var body = ss.map(function (s) {
      var items = st.answers.filter(function (a) {
        return a.sid ? a.sid === s.id : (a.t >= s.t && a.t <= s.t + s.ms + 2000);
      });
      var tp = {}; items.forEach(function (a) { tp[a.tp] = (tp[a.tp] || 0) + 1; });
      var pct = s.n ? Math.round(100 * s.ok / s.n) : 0;
      var plan = L.engine.PLANS[s.mode];
      return '<tr><td>' + fmtDate(s.t) + '</td>' +
        '<td><span class="pill">' + (plan ? plan.emoji + ' ' + plan.label : s.mode) + '</span></td>' +
        '<td class="num">' + s.ok + '/' + s.n + '</td>' +
        '<td class="num" style="color:' + (pct >= 70 ? 'var(--good)' : pct >= 45 ? 'var(--ink)' : 'var(--critical)') + '">' + pct + '%</td>' +
        '<td class="num">' + (s.mode === 'oc' ? '<span class="sub">fixed</span>' : s.lvEnd) + '</td>' +
        '<td class="num">' + (s.ms < 30000 ? '<1 min' : Math.round(s.ms / 60000) + ' min') + '</td>' +
        '<td class="sub">' + Object.keys(tp).map(function (k) { return (L.bank.topics[k] ? L.bank.topics[k].emoji : '') + tp[k]; }).join(' ') + '</td></tr>';
    }).join('');
    $('sessionTable').innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  /* ---------------- settings ---------------- */
  function paintSettings() {
    var st = S.load();
    $('pName').value = st.profile.name || '';
    $('pDob').value = st.profile.dob || '';
    $('pYear').value = String(st.profile.year || 2);
    $('pAva').value = st.profile.avatar || '🦁';
    $('pId').value = st.profileId || 'leo';
    $('mGrowth').value = N.params.growthPerYear;
    $('mSD').value = N.params.cohortSD;
    $('mAge').value = N.params.cohortAgeMid;
  }
  function loadParams() {
    var st = S.load();
    if (st.model) {
      N.params.growthPerYear = st.model.growthPerYear;
      N.params.cohortSD = st.model.cohortSD;
      N.params.cohortAgeMid = st.model.cohortAgeMid;
    }
  }

  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'application/json' }), u = URL.createObjectURL(b);
    var a = document.createElement('a'); a.href = u; a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
  }

  /* ---------------- paint all ---------------- */
  function render() {
    var st = S.load(), ag = age();
    paintSync();
    $('ava').textContent = st.profile.avatar || '🦁';
    $('title').textContent = (st.profile.name || 'Leo') + ' · Parent Dashboard';
    $('subtitle').textContent = 'Year ' + (st.profile.year || 2) + ' · Australian Curriculum' +
      (ag != null ? ' · aged ' + ag.toFixed(1) : ' · no date of birth set, so the age comparison is off') +
      (st.answers.length ? ' · last practised ' + fmtDate(st.answers[st.answers.length - 1].t) : '');

    var has = answers().length > 0;
    var hasWriting = (st.writing || []).length > 0;
    var hasFacts = (st.facts || []).length > 0;
    var hasBooks = (st.library || []).length > 0;
    var hasGames = (st.games || []).length > 0;
    $('empty').classList.toggle('hide', has || hasWriting || hasFacts || hasBooks || hasGames);
    $('dash').style.display = (has || hasWriting || hasFacts || hasBooks || hasGames) ? '' : 'none';
    if (!has) { paintGames(); paintLibrary(); paintFacts(); paintWriting(); paintSettings(); return; }

    var stats = topicStats();
    paintKpis(); paintAbility(); paintTopics(stats); paintLevels(); paintGames(); paintLibrary(); paintFacts(); paintDays(); paintWriting(); paintRecs(stats); paintSessions(); paintSettings();
  }

  /* ---------------- wiring ---------------- */
  /* The same field as the practice page: the name rides in the profile so it is
     typed once, not once per device. */
  document.addEventListener('change', function (e) {
    if (!e.target.closest || !e.target.closest('#gameWho')) return;
    S.patch({ profile: { teacher: $('gameWho').value.trim().slice(0, 60) } }).then(paintGames);
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#btnPrintReport')) { window.print(); return; }
    if (!e.target.closest || !e.target.closest('#btnCopyReport')) return;
    var txt = $('gameReport').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(function () {});
    $('btnCopyReport').textContent = 'Copied';
    setTimeout(function () { $('btnCopyReport').textContent = 'Copy the text'; }, 1600);
  });

  $('rangeTabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-range]'); if (!b) return;
    range = +b.dataset.range;
    Array.prototype.forEach.call($('rangeTabs').children, function (c) { c.classList.toggle('on', c === b); });
    render();
  });
  $('btnSync').addEventListener('click', function () {
    $('btnSync').textContent = 'Syncing…';
    S.sync().then(function () { $('btnSync').textContent = 'Sync now'; loadParams(); render(); });
  });
  $('btnKey').addEventListener('click', function () {
    var k = prompt('Access key for the server record (set as LEO_ACCESS_KEY in the Vercel project):', S.getKey());
    if (k === null) return;
    S.setKey(k.trim());
    S.sync().then(function () { loadParams(); render(); });
  });
  $('saveProfile').addEventListener('click', function () {
    var st = S.load();
    var newId = ($('pId').value || 'leo').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'leo';
    var changedId = newId !== st.profileId;
    st.profileId = newId;
    S.patch({ profile: {
      name: $('pName').value.trim() || 'Leo',
      dob: $('pDob').value,
      year: +$('pYear').value,
      avatar: $('pAva').value.trim() || '🦁'
    } }).then(function () {
      if (changedId) return S.sync();
    }).then(function () { render(); });
    $('saveProfile').textContent = 'Saved ✓';
    setTimeout(function () { $('saveProfile').textContent = 'Save'; }, 1500);
  });
  $('saveModel').addEventListener('click', function () {
    var model = {
      growthPerYear: Math.max(.2, +$('mGrowth').value || 1),
      cohortSD: Math.max(.4, +$('mSD').value || 1),
      cohortAgeMid: +$('mAge').value || 7.5
    };
    S.patch({ model: model }).then(function () { loadParams(); render(); });
    $('saveModel').textContent = 'Saved ✓';
    setTimeout(function () { $('saveModel').textContent = 'Save'; }, 1500);
  });
  $('btnExport').addEventListener('click', function () {
    download('leo-progress-' + S.today() + '.json', S.exportJSON());
  });
  $('btnExportCsv').addEventListener('click', function () {
    var rows = [['timestamp', 'date', 'mode', 'topic', 'subtopic', 'level', 'curriculum_year', 'correct', 'seconds', 'n_choices']];
    S.load().answers.forEach(function (a) {
      rows.push([a.t, new Date(a.t).toISOString(), a.m, a.tp, '"' + String(a.sub || '').replace(/"/g, '""') + '"',
        a.lv, a.yr == null ? '' : a.yr, a.ok, (a.ms / 1000).toFixed(1), a.nc || 4]);
    });
    download('leo-answers-' + S.today() + '.csv', rows.map(function (r) { return r.join(','); }).join('\n'), 'text/csv');
  });
  $('btnImport').addEventListener('click', function () { $('fileIn').click(); });
  $('fileIn').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      S.importJSON(rd.result).then(function () { loadParams(); render(); alert('Data imported and merged.'); })
        .catch(function (err) { alert('Import failed: ' + err.message); });
    };
    rd.readAsText(f);
  });
  $('btnReset').addEventListener('click', function () {
    if (!confirm('This deletes every answer, session and setting — on this device and on the server. It cannot be undone. Continue?')) return;
    if (!confirm('Really? Export a backup first if you might want this data later.')) return;
    S.reset(true).then(function () { render(); });
  });
  window.addEventListener('scroll', function () { CH.hideTip(); }, { passive: true });

  S.onchange = paintSync;
  loadParams();
  render();
  S.sync().then(function () { loadParams(); render(); });
})();
