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
    $('empty').classList.toggle('hide', has);
    $('dash').style.display = has ? '' : 'none';
    if (!has) { paintSettings(); return; }

    var stats = topicStats();
    paintKpis(); paintAbility(); paintTopics(stats); paintLevels(); paintDays(); paintRecs(stats); paintSessions(); paintSettings();
  }

  /* ---------------- wiring ---------------- */
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
