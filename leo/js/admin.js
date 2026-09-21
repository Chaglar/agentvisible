/* admin.js — parent dashboard controller (Turkish UI). */
(function () {
  var L = window.LEO, S = L.store, N = L.norms, CH = L.charts;
  var $ = function (id) { return document.getElementById(id); };
  var range = 0;                                  // days; 0 = all time

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
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

  function age() {
    var st = S.load();
    return N.ageYears(st.profile.dob);
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
    var yearEq = N.yearEquivalent(a.theta);
    var weekAgo = Date.now() - 7 * 864e5;
    var weekN = st.answers.filter(function (x) { return x.t >= weekAgo; }).length;
    var medS = Math.round(median(all.map(function (x) { return x.ms; })) / 100) / 10;

    var cards = [
      { k: ag != null ? 'Yaşıtlarına göre' : 'Year 2 grubuna göre',
        v: a.enough ? shown : '—', suf: a.enough ? '. yüzdelik' : '',
        d: a.enough ? ('%68 güven aralığı: ' + loPct + '–' + hiPct + '. yüzdelik' + (ag != null ? ' · ' + ag.toFixed(1) + ' yaş' : ''))
                    : 'En az ' + N.params.minItems + ' soru gerekli (şu an ' + all.length + ')',
        band: band },
      { k: 'Yıl seviyesi karşılığı', v: a.enough ? yearEq.toFixed(1) : '—', suf: a.enough ? ' . sınıf' : '',
        d: a.enough ? ('θ = ' + a.theta.toFixed(2) + ' ± ' + a.se.toFixed(2) + ' logit') : 'Veri birikiyor' },
      { k: 'Doğruluk', v: acc, suf: '%',
        d: all.length + ' soru · ' + sessions().length + ' oturum · soru başına ~' + medS + ' sn' },
      { k: 'Düzen', v: st.streak.days, suf: ' gün seri',
        d: 'Son 7 günde ' + weekN + ' soru · toplam ' + st.xp + ' XP' }
    ];
    $('kpis').innerHTML = cards.map(function (c) {
      return '<div class="card kpi"><div class="k">' + c.k + '</div>' +
        '<div class="v">' + c.v + (c.suf ? '<small>' + c.suf + '</small>' : '') + '</div>' +
        '<div class="d">' + c.d + '</div>' +
        (c.band ? '<div class="band"><i class="dot" style="background:' + c.band.color + '"></i>' + c.band.tr + '</div>' : '') +
        '</div>';
    }).join('');
  }

  /* ---------------- ability over time ---------------- */
  function paintAbility() {
    var st = S.load(), ss = sessions(), pts = [];
    ss.forEach(function (s) {
      var upTo = st.answers.filter(function (a) { return a.t <= s.t + Math.max(s.ms, 60000); });
      if (upTo.length < 4) return;
      var a = N.ability(upTo);
      var ag = age();
      pts.push({
        label: fmtDate(s.t), full: fmtDate(s.t) + ' · ' + (L.engine.PLANS[s.mode] ? L.engine.PLANS[s.mode].tr : s.mode),
        y: a.theta, lo: a.theta - a.se, hi: a.theta + a.se,
        tip: 'θ = ' + a.theta.toFixed(2) + ' ± ' + a.se.toFixed(2) + '<br>' +
             (ag != null ? N.agePercentile(a.theta, ag) : N.percentile(a.theta)) + '. yüzdelik · o oturumda ' + s.ok + '/' + s.n
      });
    });
    $('abilityN').textContent = pts.length + ' oturum';
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
      if (recs.length >= 12) {
        var t1 = N.ability(recs.slice(0, half)).theta, t2 = N.ability(recs.slice(half)).theta;
        trend = t2 - t1;
      }
      return {
        key: k, meta: meta, n: recs.length, acc: acc, pct: pct, theta: a.theta, se: a.se,
        med: recs.length ? Math.round(median(recs.map(function (r) { return r.ms; })) / 1000) : null,
        trend: trend, lastLv: recs.length ? recs[recs.length - 1].lv : null,
        maxLv: recs.length ? Math.max.apply(null, recs.map(function (r) { return r.lv; })) : null
      };
    });
  }

  function paintTopics(stats) {
    var rows = stats.filter(function (t) { return t.n >= 6; })
      .sort(function (x, y) { return (x.pct == null ? 200 : x.pct) - (y.pct == null ? 200 : y.pct); });
    CH.hbar($('chartTopics'), {
      ref: 50, refLabel: 'yaşıt ortalaması',
      rows: rows.map(function (t) {
        var b = N.band(t.pct);
        return {
          label: t.meta.tr, value: t.pct == null ? 0 : t.pct,
          valueLabel: t.pct == null ? 'veri az' : t.pct,
          color: t.pct == null ? 'var(--line)' : b.color,
          tip: '<b>' + t.meta.tr + '</b>' + t.n + ' soru · %' + t.acc + ' doğru<br>θ = ' + t.theta.toFixed(2) +
               (t.pct != null ? '<br>' + t.pct + '. yüzdelik — ' + b.tr : '')
        };
      })
    });

    var head = '<thead><tr><th>Konu</th><th class="num">Soru</th><th class="num">Doğruluk</th>' +
      '<th style="min-width:80px">Dağılım</th><th class="num">Yüzdelik</th><th class="num">En zor sv.</th>' +
      '<th class="num">Medyan süre</th><th class="num">Eğilim</th><th>Durum</th></tr></thead>';
    var body = stats.sort(function (x, y) {
      return (x.pct == null ? 150 : x.pct) - (y.pct == null ? 150 : y.pct);
    }).map(function (t) {
      var b = N.band(t.pct);
      var tr = t.trend == null ? '<span class="trend" style="color:var(--mut)">—</span>'
        : '<span class="trend" style="color:' + (t.trend > .12 ? 'var(--good)' : t.trend < -.12 ? 'var(--critical)' : 'var(--mut)') + '">' +
          (t.trend > .12 ? '▲' : t.trend < -.12 ? '▼' : '▬') + ' ' + (t.trend > 0 ? '+' : '') + t.trend.toFixed(2) + '</span>';
      return '<tr' + (t.meta.focus ? ' class="focus"' : '') + '>' +
        '<td><span class="tname">' + t.meta.emoji + ' ' + t.meta.tr + '</span>' +
          '<div class="sub" style="font-size:11.5px">' + t.meta.label + '</div></td>' +
        '<td class="num">' + t.n + '</td>' +
        '<td class="num">' + (t.acc == null ? '—' : '%' + t.acc) + '</td>' +
        '<td><div class="mini"><i style="width:' + (t.acc || 0) + '%"></i></div></td>' +
        '<td class="num">' + (t.pct == null ? '<span class="sub">veri az</span>' : t.pct) + '</td>' +
        '<td class="num">' + (t.maxLv || '—') + '</td>' +
        '<td class="num">' + (t.med == null ? '—' : t.med + ' sn') + '</td>' +
        '<td class="num">' + tr + '</td>' +
        '<td><span class="pill" style="color:' + b.color + '">' + b.tr + '</span></td></tr>';
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
        label: 'Seviye ' + lv, n: r.length,
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
      out.push({ n: cnt, label: d.getDate() + '.' + (d.getMonth() + 1), full: fmtDate(d.getTime()) });
    }
    $('daysN').textContent = 'son ' + n + ' gün';
    CH.days($('chartDays'), { days: out });
  }

  /* ---------------- recommendations ---------------- */
  function paintRecs(stats) {
    var out = [], all = answers(), a = N.ability(all);
    var overall = N.percentile(a.theta);
    // a high-potential child's weak spot can still sit near the cohort average, so
    // flag anything well below their OWN level as well as anything below the cohort
    var weak = stats.filter(function (t) {
      return t.n >= 6 && t.pct != null && (t.pct < 45 || (a.enough && overall - t.pct >= 20));
    }).sort(function (x, y) { return x.pct - y.pct; });
    var unseen = stats.filter(function (t) { return t.n < 6; });
    var strong = stats.filter(function (t) { return t.pct != null && t.pct >= 85; })
      .sort(function (x, y) { return y.pct - x.pct; });

    weak.slice(0, 3).forEach(function (t) {
      out.push({ e: t.meta.emoji, t: t.meta.tr + ' — ' + t.pct + '. yüzdelik' + (overall - t.pct >= 20 ? ' (genel seviyesi ' + overall + ')' : ''),
        d: t.n + ' soruda %' + t.acc + ' doğru' + (t.med ? ', medyan ' + t.med + ' sn' : '') + '. ' +
           (overall - t.pct >= 20 ? 'Genel seviyesinin <b>' + (overall - t.pct) + ' yüzdelik</b> altında — asıl açık burada.'
                                  : 'Yaşıt ortalamasının altında.') +
           ' Günde 10 soruluk hedefli çalışma en hızlı kazancı burada verir.',
        a: '../?drill=' + t.key, al: 'Bu konuda 10 soru çöz →' });
    });
    if (strong.length) {
      out.push({ e: '🚀', t: 'Güçlü olduğu alanlar: ' + strong.slice(0, 3).map(function (t) { return t.meta.tr; }).join(', '),
        d: 'Bu konularda sorular sürekli seviye 4–5 geliyor. OC provasını daha sık yaptırmak burada tavanı zorlamanı sağlar.' });
    }
    if (unseen.length) {
      out.push({ e: '🧭', t: 'Henüz yeterince test edilmemiş: ' + unseen.slice(0, 4).map(function (t) { return t.meta.tr; }).join(', '),
        d: 'Bu konularda ' + N.params.minItems + ' sorudan az veri var, yüzdelik hesaplanamıyor. Birkaç NAPLAN provası bunu kendiliğinden dolduracak.' });
    }
    var slow = stats.filter(function (t) { return t.med != null && t.n >= 8 && t.med > 35; });
    if (slow.length) {
      out.push({ e: '⏱', t: 'Yavaş kaldığı konular: ' + slow.map(function (t) { return t.meta.tr + ' (' + t.med + ' sn)' ; }).join(', '),
        d: 'Doğruluk iyi olsa bile süre uzunsa gerçek sınavda sorun çıkar. Bu konularda otomatikleşme (ezber + hız) çalışması gerekiyor.' });
    }
    if (a.enough && N.percentile(a.theta) >= 80) {
      out.push({ e: '🏅', t: 'OC hazırlığı için not',
        d: 'Genel seviyesi üst dilimde. OC sınavı NSW’de Year 4’te (Year 5 girişi için) yapılır; şu anki çalışma erken temel atma amaçlı. Thinking Skills ve okuma-çıkarım soruları uzun vadede en ayırt edici kısım.' });
    }
    if (!out.length) out.push({ e: '📈', t: 'Yeterli veri biriktiğinde öneriler burada çıkacak', d: 'Birkaç oturum sonra konu bazlı güçlü/zayıf analizi otomatik oluşur.' });

    $('recs').innerHTML = out.map(function (r) {
      return '<div class="rec"><span class="e">' + r.e + '</span><div><div class="t">' + r.t + '</div>' +
        '<div class="d">' + r.d + '</div>' + (r.a ? '<a href="' + r.a + '">' + r.al + '</a>' : '') + '</div></div>';
    }).join('');
  }

  /* ---------------- session log ---------------- */
  function paintSessions() {
    var ss = sessions().slice().reverse().slice(0, 20), st = S.load();
    if (!ss.length) { $('sessionTable').innerHTML = '<tbody><tr><td class="sub">Kayıt yok.</td></tr></tbody>'; return; }
    var head = '<thead><tr><th>Tarih</th><th>Tür</th><th class="num">Skor</th><th class="num">Doğruluk</th>' +
      '<th class="num">Bitiş sv.</th><th class="num">Süre</th><th>Konular</th></tr></thead>';
    var body = ss.map(function (s) {
      var items = st.answers.filter(function (a) {
        return a.sid ? a.sid === s.id : (a.t >= s.t && a.t <= s.t + s.ms + 2000);
      });
      var tp = {}; items.forEach(function (a) { tp[a.tp] = (tp[a.tp] || 0) + 1; });
      var pct = s.n ? Math.round(100 * s.ok / s.n) : 0;
      var plan = L.engine.PLANS[s.mode];
      return '<tr><td>' + fmtDate(s.t) + '</td>' +
        '<td><span class="pill">' + (plan ? plan.emoji + ' ' + plan.tr : s.mode) + '</span></td>' +
        '<td class="num">' + s.ok + '/' + s.n + '</td>' +
        '<td class="num" style="color:' + (pct >= 70 ? 'var(--good)' : pct >= 45 ? 'var(--ink)' : 'var(--critical)') + '">%' + pct + '</td>' +
        '<td class="num">' + (s.mode === 'oc' ? '<span class="sub">sabit</span>' : s.lvEnd) + '</td>' +
        '<td class="num">' + (s.ms < 30000 ? '<1 dk' : Math.round(s.ms / 60000) + ' dk') + '</td>' +
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
    $('mGrowth').value = N.params.growthPerYear;
    $('mSD').value = N.params.cohortSD;
    $('mAge').value = N.params.cohortAgeMid;
  }
  function loadParams() {
    var st = S.load();
    if (st.model) { N.params.growthPerYear = st.model.growthPerYear; N.params.cohortSD = st.model.cohortSD; N.params.cohortAgeMid = st.model.cohortAgeMid; }
  }

  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'application/json' }), u = URL.createObjectURL(b);
    var a = document.createElement('a'); a.href = u; a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
  }

  /* ---------------- paint all ---------------- */
  function render() {
    var st = S.load(), ag = age();
    $('ava').textContent = st.profile.avatar || '🦁';
    $('title').textContent = (st.profile.name || 'Leo') + ' · Veli Paneli';
    $('subtitle').textContent = 'Year ' + (st.profile.year || 2) + ' · Avustralya müfredatı' +
      (ag != null ? ' · ' + ag.toFixed(1) + ' yaşında' : ' · doğum tarihi girilmedi (yaşa göre karşılaştırma kapalı)') +
      (st.answers.length ? ' · son çalışma ' + fmtDate(st.answers[st.answers.length - 1].t) : '');

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
  $('saveProfile').addEventListener('click', function () {
    var st = S.load();
    st.profile.name = $('pName').value.trim() || 'Leo';
    st.profile.dob = $('pDob').value;
    st.profile.year = +$('pYear').value;
    st.profile.avatar = $('pAva').value.trim() || '🦁';
    S.save(); render();
    $('saveProfile').textContent = 'Kaydedildi ✓';
    setTimeout(function () { $('saveProfile').textContent = 'Kaydet'; }, 1500);
  });
  $('saveModel').addEventListener('click', function () {
    var st = S.load();
    st.model = {
      growthPerYear: Math.max(.2, +$('mGrowth').value || 1),
      cohortSD: Math.max(.4, +$('mSD').value || 1),
      cohortAgeMid: +$('mAge').value || 7.5
    };
    S.save(); loadParams(); render();
    $('saveModel').textContent = 'Kaydedildi ✓';
    setTimeout(function () { $('saveModel').textContent = 'Kaydet'; }, 1500);
  });
  $('btnExport').addEventListener('click', function () {
    download('leo-progress-' + S.today() + '.json', S.exportJSON());
  });
  $('btnExportCsv').addEventListener('click', function () {
    var rows = [['timestamp', 'date', 'mode', 'topic', 'subtopic', 'level', 'correct', 'seconds', 'n_choices']];
    S.load().answers.forEach(function (a) {
      rows.push([a.t, new Date(a.t).toISOString(), a.m, a.tp, '"' + String(a.sub || '').replace(/"/g, '""') + '"',
        a.lv, a.ok, (a.ms / 1000).toFixed(1), a.nc || 4]);
    });
    download('leo-answers-' + S.today() + '.csv', rows.map(function (r) { return r.join(','); }).join('\n'), 'text/csv');
  });
  $('btnImport').addEventListener('click', function () { $('fileIn').click(); });
  $('fileIn').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { S.importJSON(rd.result); loadParams(); render(); alert('Veri içe aktarıldı.'); }
      catch (err) { alert('Hata: ' + err.message); }
    };
    rd.readAsText(f);
  });
  $('btnReset').addEventListener('click', function () {
    if (!confirm('Tüm çözülmüş sorular, oturumlar ve ayarlar silinecek. Geri alınamaz. Devam edilsin mi?')) return;
    if (!confirm('Emin misin? Silmeden önce "JSON dışa aktar" ile yedek alabilirsin.')) return;
    S.reset(); render();
  });
  window.addEventListener('scroll', function () { CH.hideTip(); }, { passive: true });

  loadParams();
  render();
})();
