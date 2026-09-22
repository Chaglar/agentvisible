/* app.js — the student-facing controller. Screens: home → quiz → result. */
(function () {
  var L = window.LEO, S = L.store, N = L.norms, V = L.vis;
  var $ = function (id) { return document.getElementById(id); };
  var sess = null, lastOpts = null, timerId = null, lastItems = null;

  /* ---------- sound: three short WebAudio blips, no assets ---------- */
  var actx = null;
  function beep(kind) {
    if (!S.load().settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var seq = kind === 'ok' ? [[660, 0], [880, .09]] : kind === 'no' ? [[240, 0], [180, .1]] : [[520, 0], [660, .08], [880, .16]];
      seq.forEach(function (s) {
        var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + s[1];
        o.type = 'triangle'; o.frequency.setValueAtTime(s[0], t0);
        g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.18, t0 + .01);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + .16);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + .2);
      });
    } catch (e) {}
  }

  /* ---------- confetti ---------- */
  function confetti(ms) {
    var cv = $('confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight; cv.classList.remove('hide');
    var cols = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'];
    var bits = Array.from({ length: 90 }, function () {
      return { x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, w: 6 + Math.random() * 7,
               h: 8 + Math.random() * 9, v: 2 + Math.random() * 3.4, a: Math.random() * 6.28,
               s: (Math.random() - .5) * .22, c: cols[(Math.random() * cols.length) | 0] };
    });
    var end = Date.now() + (ms || 1700);
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      bits.forEach(function (b) {
        b.y += b.v; b.a += b.s;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (Date.now() < end) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.add('hide'); }
    })();
  }

  function popup(e, t, d, ms) {
    var el = document.createElement('div');
    el.className = 'pop';
    el.innerHTML = '<div class="e">' + e + '</div><div class="t">' + t + '</div>' + (d ? '<div class="d">' + d + '</div>' : '');
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, ms || 1400);
  }

  function show(id) {
    ['home', 'quiz', 'coach', 'result'].forEach(function (s) { $(s).classList.toggle('hide', s !== id); });
    window.scrollTo(0, 0);
  }

  /* ---------- home ---------- */
  function paintSync() {
    var st = S.statusText(), el = $('chipSync');
    if (!el) return;
    el.className = 'chip ' + st.cls;
    el.textContent = { ok: '☁︎', wait: '⟳', local: '⌂', err: '⚠' }[st.cls] || '⟳';
    el.title = st.text;
  }

  function paintHome() {
    var st = S.load();
    $('ava').textContent = st.profile.avatar || '🦁';
    $('who').textContent = st.profile.name || 'Leo';
    $('chipXp').textContent = '⚡ ' + st.xp;
    $('chipStreak').textContent = '🔥 ' + st.streak.days;
    $('btnSound').textContent = st.settings.sound ? '🔊' : '🔇';
    $('naplanLv').textContent = 'Starts at level ' + Math.max(2, N.suggestLevel(st.answers.slice(-80)));
    var fb = st.settings.feedback || 'instant';
    Array.prototype.forEach.call($('fbSeg').children, function (b) { b.classList.toggle('on', b.dataset.fb === fb); });
    paintSync();

    var weak = L.engine.weakest().filter(function (t) { return t.meta.modes.indexOf('naplan') >= 0 || t.meta.modes.indexOf('oc') >= 0; }).slice(0, 6);
    $('drills').innerHTML = weak.map(function (t) {
      var pct = t.acc == null ? 0 : t.acc;
      return '<button class="drill" data-drill="' + t.key + '">' +
        '<div class="e">' + t.meta.emoji + '</div><div class="t">' + t.meta.label + '</div>' +
        '<div class="b"><i style="width:' + pct + '%"></i></div>' +
        '<div class="n">' + (t.n ? pct + '% right · ' + t.n + ' tried' : 'Not tried yet') + '</div></button>';
    }).join('');
  }

  /* ---------- quiz ---------- */
  function paintDots() {
    var h = '';
    for (var i = 0; i < sess.total; i++) {
      var it = sess.items[i];
      h += '<i class="' + (it ? (it.ok ? 'ok' : 'no') : (i === sess.i ? 'now' : '')) + '"></i>';
    }
    $('dots').innerHTML = h;
  }
  function paintLadder(lv) {
    var bs = $('ladder').children;
    for (var i = 0; i < 5; i++) bs[i].className = i < lv ? 'on' : '';
  }

  function renderQuestion(step) {
    var q = step.q;
    paintDots(); paintLadder(step.level);
    $('noteSlot').innerHTML = step.note ?
      '<div class="fb ' + (step.note.dir === 'up' ? 'ok' : '') + '" style="margin:0 0 12px">' +
      '<div class="h">' + (step.note.dir === 'up' ? '🔥 Level up!' : '↩︎ Let’s steady up') + '</div>' +
      (step.note.dir === 'up' ? 'You earned harder questions. This is exactly what happens in the real NAPLAN test.'
        : 'The next few are a little easier so you can get your streak back.') + '</div>' : '';
    if (step.note) beep('up');

    $('qTopic').textContent = q.meta.label;
    $('qSub').textContent = q.sub || '';
    var yrEl = $('qYear');
    if (yrEl) {
      yrEl.textContent = q.cur && q.cur.yr ? 'Year ' + q.cur.yr + ' content' : '';
      yrEl.title = q.cur && q.cur.note ? q.cur.note : '';
    }
    $('qPassage').innerHTML = q.passage ?
      '<div class="passage"><h4>' + q.passage.title + '</h4>' + q.passage.text + '</div>' : '';
    $('qText').innerHTML = q.prompt;
    $('qVis').innerHTML = q.visual ? V.render(q.visual) : '';
    $('qVis').style.display = q.visual ? 'flex' : 'none';
    $('qFeedback').innerHTML = '';
    $('btnNext').classList.add('hide');

    var visualChoices = q.choices.some(function (c) { return c.visual; });
    var box = $('qChoices');
    box.className = 'choices' + (visualChoices ? ' grid4' : '');
    box.innerHTML = q.choices.map(function (c, i) {
      return '<button class="ch' + (visualChoices ? ' visual' : '') + '" data-i="' + i + '">' +
        (visualChoices ? '' : '<span class="k">' + 'ABCD'[i] + '</span>') +
        (c.visual ? V.render(c.visual) : '<span>' + c.text + '</span>') + '</button>';
    }).join('');
    Array.prototype.forEach.call(box.children, function (b) {
      b.addEventListener('click', function () { pick(+b.dataset.i); });
    });
  }

  function pick(idx) {
    if ($('qChoices').dataset.done) return;
    $('qChoices').dataset.done = '1';
    var res = sess.answer(idx);
    var kids = $('qChoices').children;
    if (sess.feedback === 'instant') {
      kids[res.answer].classList.add('right');
      if (!res.ok) kids[idx].classList.add('wrong');
      beep(res.ok ? 'ok' : 'no');
      $('qFeedback').innerHTML = '<div class="fb ' + (res.ok ? 'ok' : 'no') + '">' +
        '<div class="h">' + (res.ok ? '✅ ' + pickPraise() : '💡 Not quite' + (res.correctText ? ' — the answer is ' + res.correctText : '')) + '</div>' +
        res.explain + (res.explainVisual ? V.render(res.explainVisual) : '') + '</div>';
    } else {
      kids[idx].classList.add('pick');
      Array.prototype.forEach.call(kids, function (k) { k.style.pointerEvents = 'none'; });
      $('qFeedback').innerHTML = '<div class="fb"><div class="h">🔒 Answer locked in</div>In a real exam you find out at the end — keep going.</div>';
      beep('ok');
    }
    paintDots();
    $('btnNext').textContent = sess.i + 1 >= sess.total ? 'See how you did →' : 'Next question →';
    $('btnNext').classList.remove('hide');
    $('btnNext').focus({ preventScroll: true });
  }
  var PRAISE = ['Nailed it!', 'Yes!', 'Spot on.', 'Too easy for you.', 'Brilliant.', 'That’s the one.', 'Sharp.'];
  function pickPraise() { return PRAISE[(Math.random() * PRAISE.length) | 0]; }

  function step() {
    var s = sess.next();
    if (!s) return finish();
    $('qChoices').dataset.done = '';
    renderQuestion(s);
    window.scrollTo(0, 0);
  }

  function startSession(opts) {
    lastOpts = opts;
    sess = L.engine.create(Object.assign({ feedback: S.load().settings.feedback || 'instant' }, opts));
    show('quiz');
    $('timer').style.display = opts.mode === 'oc' ? '' : 'none';
    clearInterval(timerId);
    if (opts.mode === 'oc') {
      var t0 = Date.now();
      timerId = setInterval(function () {
        var s2 = Math.round((Date.now() - t0) / 1000);
        $('timer').textContent = '⏱ ' + Math.floor(s2 / 60) + ':' + String(s2 % 60).padStart(2, '0');
      }, 1000);
    }
    step();
  }

  /* ---------- coach: the after-the-test teaching step ----------
     Leo's assessments put his processing speed at the 6th percentile and his
     auditory working memory at the 25th, against visual-spatial reasoning at the
     98th. So this reveals ONE short line at a time, each with a picture, and then
     makes him actually do a fresh question of the same kind — an explanation he
     only nods at does not stick. */
  var coach = null;

  function buildFixList(items) {
    var byKind = {};
    items.filter(function (a) { return !a.ok; }).forEach(function (a) {
      var k = a.tp + '|' + a.sub;
      byKind[k] = byKind[k] || { topic: a.tp, sub: a.sub, level: a.lv, n: 0, prompt: a.prompt };
      byKind[k].n++;
      byKind[k].level = Math.min(byKind[k].level, a.lv);
    });
    return Object.keys(byKind).map(function (k) { return byKind[k]; })
      .sort(function (x, y) { return y.n - x.n; }).slice(0, 3);
  }

  function startCoach(items) {
    var list = buildFixList(items);
    if (!list.length) return false;
    coach = {
      list: list, i: 0, step: 0, phase: 'lesson', fixed: 0, attempt: 0,
      q: null, rng: L.RNG(), id: 'c' + Date.now(), logged: [], startedAt: Date.now()
    };
    show('coach');
    coachRender();
    return true;
  }

  function coachDots() {
    var h = '';
    coach.list.forEach(function (f, i) {
      h += '<i class="' + (f.done === 'fixed' ? 'ok' : f.done === 'missed' ? 'no' : (i === coach.i ? 'now' : '')) + '"></i>';
    });
    $('cDots').innerHTML = h;
    $('cCount').textContent = coach.fixed + ' fixed';
  }

  function coachRender() {
    var f = coach.list[coach.i];
    var lesson = L.coach.lessonFor(f.topic, f.sub, f.prompt);
    var meta = L.bank.topics[f.topic];
    coachDots();
    $('cTopic').textContent = meta.label;
    $('cSub').textContent = f.sub || '';
    $('cLesson').classList.remove('hide');
    $('cTry').classList.add('hide');
    $('cTitle').innerHTML = lesson.title;
    $('cWrong').innerHTML = f.prompt
      ? 'You had this one: <b>' + f.prompt + '</b>' + (f.n > 1 ? ' — and ' + (f.n - 1) + ' more like it.' : '')
      : (f.n > 1 ? 'You got ' + f.n + ' of these wrong.' : '');
    $('cWrong').style.display = $('cWrong').innerHTML ? '' : 'none';
    $('cSteps').innerHTML = lesson.steps.slice(0, coach.step + 1).map(function (st) {
      return '<div class="cstep"><p>' + st.say + '</p>' +
        (st.visual ? '<div class="vis">' + V.render(st.visual) + '</div>' : '') + '</div>';
    }).join('');
    var last = coach.step >= lesson.steps.length - 1;
    $('cRemember').classList.toggle('hide', !last);
    if (last) $('cRemember').innerHTML = '<span>Remember this bit</span>' + lesson.remember;
    $('cNext').textContent = last ? 'OK — let me try one →' : 'Then what? →';
    $('cNext').classList.remove('hide');
    window.scrollTo(0, document.body.scrollHeight);
  }

  function coachTry() {
    var f = coach.list[coach.i];
    var lv = Math.max(1, coach.attempt ? f.level - 1 : f.level);
    var gen = L.bank.topics[f.topic], q = null, tries = 0;
    do { q = gen.gen(lv, coach.rng); tries++; } while (tries < 40 && q.sub !== f.sub);
    coach.q = q; coach.shownAt = Date.now();
    coach.phase = 'try';
    $('cLesson').classList.add('hide');
    $('cTry').classList.remove('hide');
    $('cQText').innerHTML = q.prompt;
    $('cQVis').innerHTML = q.visual ? V.render(q.visual) : '';
    $('cQVis').style.display = q.visual ? 'flex' : 'none';
    $('cQFeedback').innerHTML = '';
    $('cNext').classList.add('hide');
    var visualChoices = q.choices.some(function (c) { return c.visual; });
    var box = $('cQChoices');
    box.className = 'choices' + (visualChoices ? ' grid4' : '');
    box.dataset.done = '';
    box.innerHTML = q.choices.map(function (c, i) {
      return '<button class="ch' + (visualChoices ? ' visual' : '') + '" data-i="' + i + '">' +
        (visualChoices ? '' : '<span class="k">' + 'ABCDE'[i] + '</span>') +
        (c.visual ? V.render(c.visual) : '<span>' + c.text + '</span>') + '</button>';
    }).join('');
    Array.prototype.forEach.call(box.children, function (b) {
      b.addEventListener('click', function () { coachAnswer(+b.dataset.i); });
    });
    window.scrollTo(0, 0);
  }

  function coachAnswer(idx) {
    var box = $('cQChoices');
    if (box.dataset.done) return;
    box.dataset.done = '1';
    var q = coach.q, ok = idx === q.answer, f = coach.list[coach.i];
    var at = Date.now();
    coach.logged.push({
      t: at, aid: coach.id + ':' + at + ':' + coach.logged.length, sid: coach.id, m: 'coach',
      tp: q.topic, sub: q.sub || '', lv: q.level, yr: q.cur ? q.cur.yr : null,
      ok: ok ? 1 : 0, ms: Math.min(at - coach.shownAt, 600000), nc: q.choices.length
    });
    box.children[q.answer].classList.add('right');
    if (!ok) box.children[idx].classList.add('wrong');
    beep(ok ? 'ok' : 'no');

    if (ok) {
      f.done = 'fixed'; coach.fixed++;
      $('cQFeedback').innerHTML = '<div class="fb ok"><div class="h">✅ Fixed it.</div>' +
        'That is the one you got wrong before. Now you can do it.</div>';
    } else if (coach.attempt === 0) {
      coach.attempt = 1;
      $('cQFeedback').innerHTML = '<div class="fb no"><div class="h">💡 Not yet — look again</div>' +
        q.explain + (q.explainVisual ? V.render(q.explainVisual) : '') +
        '<div style="margin-top:8px"><b>Let\u2019s try an easier one of the same kind.</b></div></div>';
    } else {
      f.done = 'missed';
      $('cQFeedback').innerHTML = '<div class="fb no"><div class="h">💡 The answer is ' +
        (q.choices[q.answer].text || 'the one in green') + '</div>' + q.explain +
        (q.explainVisual ? V.render(q.explainVisual) : '') +
        '<div style="margin-top:8px">This one is tricky. We will come back to it tomorrow \u2014 that is fine.</div></div>';
    }
    coachDots();
    $('cNext').textContent = (!ok && coach.attempt === 1) ? 'Try an easier one →'
      : (coach.i + 1 >= coach.list.length ? 'Finish →' : 'Next one →');
    $('cNext').classList.remove('hide');
    $('cNext').focus({ preventScroll: true });
  }

  function coachStep() {
    var f = coach.list[coach.i];
    var lesson = L.coach.lessonFor(f.topic, f.sub, f.prompt);
    if (coach.phase === 'lesson') {
      if (coach.step < lesson.steps.length - 1) { coach.step++; coachRender(); }
      else coachTry();
      return;
    }
    // in a try
    if (!f.done && coach.attempt === 1) { coachTry(); return; }   // second, easier attempt
    coachNextFix();
  }

  function coachNextFix() {
    coach.i++; coach.step = 0; coach.attempt = 0; coach.phase = 'lesson';
    if (coach.i >= coach.list.length) return coachFinish();
    coachRender();
  }

  function coachFinish() {
    if (coach.logged.length) {
      var okN = coach.logged.filter(function (a) { return a.ok; }).length;
      S.logSession({ id: coach.id, mode: 'coach', t: coach.startedAt, ms: Date.now() - coach.startedAt,
                     n: coach.logged.length, ok: okN, lvEnd: 0 }, coach.logged);
    }
    var n = coach.fixed, total = coach.list.length;
    show('result');
    $('btnFix').classList.add('hide');
    $('rEmoji').textContent = n === total ? '🛠️' : n ? '💪' : '🌱';
    $('rScore').textContent = n + '/' + total;
    $('rLbl').textContent = n === total ? 'You fixed every one of them. That is the whole point.'
      : n ? 'You fixed ' + n + ' of ' + total + '. The rest we do again tomorrow.'
          : 'These are the hard ones. Coming back to them tomorrow is how they get easy.';
    if (n) { confetti(1300); beep('up'); }
    paintHome();
  }

  /* ---------- result ---------- */
  function finish() {
    clearInterval(timerId);
    var r = sess.finish();
    show('result');
    var mood = r.pct >= 85 ? ['🏆', 'Outstanding.'] : r.pct >= 65 ? ['🎉', 'Strong work.'] :
               r.pct >= 45 ? ['💪', 'Good effort — a few to practise.'] : ['🌱', 'Tricky set. Practising the hard bits is how it gets easier.'];
    $('rEmoji').textContent = mood[0];
    $('rScore').textContent = r.ok + '/' + r.n;
    $('rLbl').textContent = mood[1] + ' ' + r.pct + '% correct.';
    $('rXp').textContent = '⚡ +' + r.xpEarned;
    $('rTime').textContent = '⏱ ' + Math.floor(r.secs / 60) + ':' + String(r.secs % 60).padStart(2, '0');
    $('rLevel').textContent = '📈 Finished on level ' + r.level;
    var wrongs = r.items.filter(function (a) { return !a.ok; });
    $('btnFix').classList.toggle('hide', wrongs.length === 0);
    if (wrongs.length) $('btnFix').textContent = '🛠 Let\u2019s fix the ' + wrongs.length +
      (wrongs.length === 1 ? ' one you got wrong' : ' you got wrong');
    lastItems = r.items;
    if (r.pct >= 65) { confetti(); beep('up'); }
    if (r.streak > 1) setTimeout(function () { popup('🔥', r.streak + ' days in a row', 'Keep the streak alive tomorrow'); }, 700);

    $('rList').innerHTML = r.items.map(function (a, i) {
      var meta = L.bank.topics[a.tp];
      return '<div class="rrow"><span class="s ' + (a.ok ? 'ok' : 'no') + '">' + (a.ok ? '✓' : '✕') + '</span>' +
        '<span class="g">' + meta.emoji + ' ' + (a.sub || meta.label) + '</span>' +
        '<span class="lv">L' + a.lv + ' · ' + (a.ms / 1000).toFixed(0) + 's</span></div>';
    }).join('');
    paintHome();
  }

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (e) {
    var m = e.target.closest('[data-mode]');
    if (m) { startSession({ mode: m.dataset.mode }); return; }
    var d = e.target.closest('[data-drill]');
    if (d) { startSession({ mode: 'drill', topic: d.dataset.drill }); return; }
  });
  $('btnNext').addEventListener('click', step);
  $('btnFix').addEventListener('click', function () { if (lastItems) startCoach(lastItems); });
  $('cNext').addEventListener('click', coachStep);
  $('cSkip').addEventListener('click', function () {
    if (!coach) return;
    coach.list[coach.i].done = coach.list[coach.i].done || 'missed';
    coachNextFix();
  });
  $('btnQuit').addEventListener('click', function () { clearInterval(timerId); show('home'); paintHome(); });
  $('btnHome').addEventListener('click', function () { show('home'); paintHome(); });
  $('btnAgain').addEventListener('click', function () { startSession(lastOpts); });
  $('fbSeg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-fb]'); if (!b) return;
    var st = S.load(); st.settings.feedback = b.dataset.fb; S.save();
    S.patch({ settings: { feedback: b.dataset.fb } });
    paintHome();
  });
  $('btnSound').addEventListener('click', function () {
    var st = S.load(); st.settings.sound = !st.settings.sound; S.save(); paintHome(); if (st.settings.sound) beep('ok');
  });
  document.addEventListener('keydown', function (e) {
    if (!$('coach').classList.contains('hide')) {
      if (/^[1-5]$/.test(e.key) && !$('cQChoices').dataset.done && !$('cTry').classList.contains('hide')) {
        var cb = $('cQChoices').children[+e.key - 1]; if (cb) cb.click();
      }
      if ((e.key === 'Enter' || e.key === ' ') && !$('cNext').classList.contains('hide')) { e.preventDefault(); coachStep(); }
      return;
    }
    if ($('quiz').classList.contains('hide')) return;
    if (/^[1-4]$/.test(e.key) && !$('qChoices').dataset.done) {
      var b = $('qChoices').children[+e.key - 1]; if (b) b.click();
    }
    if ((e.key === 'Enter' || e.key === ' ') && !$('btnNext').classList.contains('hide')) { e.preventDefault(); step(); }
  });

  S.onchange = paintSync;
  paintHome();
  S.sync().then(paintHome);

  // deep link from the dashboard: /leo/?drill=fractions starts that drill straight away
  var qp = new URLSearchParams(location.search);
  if (qp.get('drill') && L.bank.topics[qp.get('drill')]) {
    startSession({ mode: 'drill', topic: qp.get('drill') });
  } else if (qp.get('mode') && L.engine.PLANS[qp.get('mode')]) {
    startSession({ mode: qp.get('mode') });
  }
})();
