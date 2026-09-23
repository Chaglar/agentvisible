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
      var seq = kind === 'ok' ? [[660, 0], [880, .09]]
              : kind === 'no' ? [[240, 0], [180, .1]]
              : kind === 'tick' ? [[880, 0]]                 // keypad: one soft blip, not a fanfare
              : [[520, 0], [660, .08], [880, .16]];
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
  /* The first version scattered pieces up to half a screen ABOVE the viewport and
     ran for a second or so, so most of them never came into view and the ones that
     did were gone before he looked up. Pieces now start just above the fold, are
     recycled when they fall off the bottom, and fade out at the end — so the
     duration actually is how long he sees it. */
  function confetti(ms) {
    var cv = $('confetti'), ctx = cv.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var total = reduce ? 900 : (ms || 3000);
    cv.width = innerWidth; cv.height = innerHeight; cv.classList.remove('hide');
    var cols = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'];
    function spawn(first) {
      return { x: Math.random() * cv.width,
               y: first ? -20 - Math.random() * cv.height * .35 : -20 - Math.random() * 120,
               w: 6 + Math.random() * 7, h: 8 + Math.random() * 9,
               v: 2 + Math.random() * 3.4, drift: (Math.random() - .5) * 1.1,
               a: Math.random() * 6.28, s: (Math.random() - .5) * .22,
               c: cols[(Math.random() * cols.length) | 0] };
    }
    var bits = Array.from({ length: 110 }, function () { return spawn(true); });
    var started = Date.now(), end = started + total, FADE = 700;
    (function frame() {
      var left = end - Date.now();
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = left < FADE ? Math.max(0, left / FADE) : 1;
      bits.forEach(function (b, i) {
        b.y += b.v; b.x += b.drift; b.a += b.s;
        // keep the screen full for the whole run instead of emptying after one pass
        if (b.y > cv.height + 30 && left > FADE) bits[i] = spawn(false);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (left > 0) requestAnimationFrame(frame);
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
    ['home', 'quiz', 'coach', 'result', 'write', 'wResult', 'fluency', 'fResult', 'addBook', 'logRead', 'chapters', 'reader',
     'gIntro', 'games', 'gResult', 'report']
      .forEach(function (s) { $(s).classList.toggle('hide', s !== id); });
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

    $('writeCards').innerHTML = Object.keys(L.writing.KINDS).map(function (k) {
      var K = L.writing.KINDS[k], done = (st.writing || []).filter(function (w) { return w.kind === k; }).length;
      return '<button class="drill" data-write="' + k + '">' +
        '<div class="e">' + K.emoji + '</div><div class="t">' + K.label + '</div>' +
        '<div class="n">' + K.blurb + (done ? ' · ' + done + ' done' : '') + '</div></button>';
    }).join('');

    paintShelf();
    paintGames();

    $('factCards').innerHTML = Object.keys(L.facts.TRACKS).map(function (k) {
      var T = L.facts.TRACKS[k], sum = L.facts.summary(st.facts || [], k);
      return '<button class="drill" data-fact="' + k + '">' +
        '<div class="e">' + T.emoji + '</div><div class="t">' + T.label + '</div>' +
        '<div class="b"><i style="width:' + sum.pct + '%"></i></div>' +
        '<div class="n">' + (sum.counts['new'] === sum.total ? T.blurb
          : sum.counts.fluent ? sum.counts.fluent + ' of ' + sum.total + ' known by heart'
          : (sum.total - sum.counts['new']) + ' started · none locked in yet') + '</div></button>';
    }).join('');

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
    sess.sel = null;
    $('btnCheck').classList.remove('hide');
    $('btnCheck').disabled = true;

    var visualChoices = q.choices.some(function (c) { return c.visual; });
    var box = $('qChoices');
    box.className = 'choices' + (visualChoices ? ' grid4' : '');
    box.innerHTML = q.choices.map(function (c, i) {
      return '<button class="ch' + (visualChoices ? ' visual' : '') + '" data-i="' + i + '">' +
        (visualChoices ? '' : '<span class="k">' + 'ABCD'[i] + '</span>') +
        (c.visual ? V.render(c.visual) : '<span>' + c.text + '</span>') + '</button>';
    }).join('');
    Array.prototype.forEach.call(box.children, function (b) {
      b.addEventListener('click', function () { select(+b.dataset.i); });
    });
  }

  /* Choosing and answering are two separate acts. A stray tap on a phone used to
     commit an answer outright; now it only highlights, and nothing is recorded
     until "Check my answer". Tapping another option just moves the highlight. */
  function select(idx) {
    if ($('qChoices').dataset.done) return;
    sess.sel = idx;
    Array.prototype.forEach.call($('qChoices').children, function (b, i) {
      b.classList.toggle('sel', i === idx);
    });
    $('btnCheck').disabled = false;
    beep('tick');
  }

  function pick(idx) {
    if ($('qChoices').dataset.done || idx == null) return;
    $('qChoices').dataset.done = '1';
    $('btnCheck').classList.add('hide');
    Array.prototype.forEach.call($('qChoices').children, function (b) { b.classList.remove('sel'); });
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

  /* ---------- writing ----------
     Photograph what he wrote on paper and have it marked. Paper rather than a
     keyboard because letter formation is the skill that slipped, and because the
     real Year 3 NAPLAN writing test is handwritten. The clock counts up and never
     runs out. */
  var wr = null;   // { task, startedAt, tick, dataUrl }

  function startWriting(kind) {
    var task = L.writing.pick(kind);
    wr = { task: task, startedAt: Date.now(), dataUrl: null };
    show('write');
    $('wKind').textContent = L.writing.KINDS[kind].emoji + ' ' + L.writing.KINDS[kind].label;
    $('wTitle').textContent = task.title;
    $('wMins').textContent = 'about ' + task.mins + ' min';
    $('wSym').textContent = task.sym;
    $('wPrompt').innerHTML = task.prompt;
    $('wFocus').textContent = task.focus;
    $('wError').innerHTML = '';
    wShow('pick');
    clearInterval(wr.tick);
    wr.tick = setInterval(function () {
      var s = Math.round((Date.now() - wr.startedAt) / 1000);
      $('wClock').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
    $('wClock').textContent = '0:00';
  }

  function wShow(which) {
    ['wPick', 'wTyped', 'wPreview', 'wBusy'].forEach(function (id) {
      $(id).classList.toggle('hide', id !== 'w' + which.charAt(0).toUpperCase() + which.slice(1));
    });
    $('wTaskCard').querySelector('.wsym').style.display = which === 'busy' ? 'none' : '';
  }

  /* Phone photos are many megabytes and mostly wasted detail. Scale the long edge
     to 1600px — enough to read a child's handwriting, a fraction of the upload. */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1600, w = img.width, h = img.height;
        if (Math.max(w, h) > max) { var r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That file is not an image we can read.')); };
      img.src = url;
    });
  }

  function wError(msg) {
    $('wError').innerHTML = '<div class="fb no" style="margin-top:14px"><div class="h">⚠ Could not mark it</div>' + msg + '</div>';
  }

  function sendWriting(payload) {
    wShow('busy');
    $('wError').innerHTML = '';
    $('wBusyText').textContent = payload.image ? 'Reading your handwriting…' : 'Reading what you wrote…';
    var headers = { 'Content-Type': 'application/json' };
    var k = S.getKey(); if (k) headers['x-leo-key'] = k;
    var api = /\/admin\/?$/.test(location.pathname) ? '../../api/writing' : '/api/writing';
    fetch(api, { method: 'POST', headers: headers, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, reason: 'The server sent back something unreadable (' + r.status + ').' }; }); })
      .then(function (res) {
        if (!res.ok) { wShow(payload.image ? 'preview' : 'typed'); return wError(res.reason || 'Something went wrong.'); }
        recordWriting(res.assessment, payload);
        showWritingResult(res.assessment);
      })
      .catch(function (e) {
        wShow(payload.image ? 'preview' : 'typed');
        wError('Could not reach the server — ' + e.message);
      });
  }

  function recordWriting(a, payload) {
    var st = S.load();
    st.writing = st.writing || [];
    st.writing.push({
      id: 'w' + Date.now(), t: Date.now(), taskId: wr.task.id, kind: wr.task.kind,
      title: wr.task.title, secs: Math.round((Date.now() - wr.startedAt) / 1000),
      typed: !payload.image,
      words: a.word_count, sentences: a.sentence_count,
      scores: a.scores, spelling: (a.spelling || []).map(function (s2) { return s2.written + '→' + s2.correct; }),
      fix: (a.fix_next || []).map(function (f) { return f.what; }),
      transcription: String(a.transcription || '').slice(0, 1200),
      toLeo: a.to_leo || ''
    });
    if (st.writing.length > 300) st.writing = st.writing.slice(-300);
    S.save();
    S.pushWriting();
  }

  function showWritingResult(a) {
    clearInterval(wr.tick);
    show('wResult');
    var dims = [['handwriting', 'Letters'], ['spelling', 'Spelling'], ['punctuation', 'Punct.'], ['ideas', 'Ideas'], ['structure', 'Order']];
    $('wScores').innerHTML = dims.map(function (d) {
      var v = (a.scores && a.scores[d[0]]) || 0;
      var col = v >= 4 ? 'var(--good)' : v >= 3 ? 'var(--acc)' : 'var(--bad)';
      return '<div><div class="s">' + d[1] + '</div><div class="n" style="color:' + col + '">' + v + '</div>' +
        '<div class="b"><i style="width:' + (v / 5 * 100) + '%;background:' + col + '"></i></div></div>';
    }).join('');
    $('wToLeo').textContent = a.to_leo || '';

    var h = '';
    if (a.strengths && a.strengths.length) {
      h += '<div class="wsec"><h3>What worked</h3><div class="card">' +
        a.strengths.map(function (s2) { return '<div class="wgood">' + esc(s2) + '</div>'; }).join('') + '</div></div>';
    }
    if (a.fix_next && a.fix_next.length) {
      h += '<div class="wsec"><h3>🎯 ' + (a.fix_next.length === 1 ? 'One thing' : 'Two things') + ' to fix next time</h3>' +
        a.fix_next.map(function (f) {
          return '<div class="wfix"><div class="t">' + esc(f.what) + '</div><div class="h">' + esc(f.how) + '</div>' +
            (f.example ? '<div class="e">' + esc(f.example) + '</div>' : '') + '</div>';
        }).join('') + '</div>';
    }
    if (a.spelling && a.spelling.length) {
      h += '<div class="wsec"><h3>🔤 Spelling</h3><div class="card">' + a.spelling.map(function (s2) {
        return '<div class="wrow"><div><span class="bad">' + esc(s2.written) + '</span> → <span class="good">' +
          esc(s2.correct) + '</span><div class="hint">' + esc(s2.hint) + '</div></div></div>';
      }).join('') + '</div></div>';
    } else {
      h += '<div class="wsec"><h3>🔤 Spelling</h3><div class="card"><div class="wgood">Every word spelled correctly.</div></div></div>';
    }
    if (a.letter_formation && a.letter_formation.length) {
      h += '<div class="wsec"><h3>✍️ Your letters</h3><div class="card">' + a.letter_formation.map(function (f) {
        return '<div class="wrow"><div><b>' + esc(f.letters) + '</b><div class="hint">' + esc(f.note) + '</div></div></div>';
      }).join('') + '</div></div>';
    }
    if (a.punctuation && a.punctuation.length) {
      h += '<div class="wsec"><h3>. ? ! Punctuation</h3><div class="card">' + a.punctuation.map(function (p) {
        return '<div class="wrow"><div>' + esc(p.issue) + (p.example ? '<div class="hint">' + esc(p.example) + '</div>' : '') + '</div></div>';
      }).join('') + '</div></div>';
    }
    h += '<div class="wsec"><h3>What you wrote</h3><div class="wtrans">' + esc(a.transcription || '') + '</div>' +
      '<div class="sub" style="margin-top:6px">' + (a.word_count || 0) + ' words · ' + spentLabel() + '</div></div>';
    $('wFeedback').innerHTML = h;
    confetti(2600); beep('up');
    paintHome();
  }

  function spentLabel() {
    var secs = Math.round((Date.now() - wr.startedAt) / 1000);
    if (secs < 90) return secs + ' seconds';
    return Math.round(secs / 60) + ' minutes';
  }

  function esc(s2) {
    return String(s2 == null ? '' : s2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    coach.sel = null;
    $('cCheck').classList.remove('hide');
    $('cCheck').disabled = true;
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
      b.addEventListener('click', function () { coachSelect(+b.dataset.i); });
    });
    window.scrollTo(0, 0);
  }

  function coachSelect(idx) {
    if ($('cQChoices').dataset.done) return;
    coach.sel = idx;
    Array.prototype.forEach.call($('cQChoices').children, function (b, i) {
      b.classList.toggle('sel', i === idx);
    });
    $('cCheck').disabled = false;
    beep('tick');
  }

  function coachAnswer(idx) {
    var box = $('cQChoices');
    if (box.dataset.done || idx == null) return;
    box.dataset.done = '1';
    $('cCheck').classList.add('hide');
    Array.prototype.forEach.call(box.children, function (b) { b.classList.remove('sel'); });
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
    if (n) { confetti(3200); beep('up'); }
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
    if (r.pct >= 65) { confetti(r.pct >= 90 ? 4200 : 3200); beep('up'); }
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
    var w = e.target.closest('[data-write]');
    if (w) { startWriting(w.dataset.write); return; }
  });
  $('wFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    $('wError').innerHTML = '';
    shrink(f).then(function (url) {
      wr.dataUrl = url; $('wImg').src = url; wShow('preview');
    }).catch(function (err) { wError(err.message); });
    e.target.value = '';
  });
  $('wType').addEventListener('click', function () { wShow('typed'); $('wText').focus(); });
  $('wBackPick').addEventListener('click', function () { wShow('pick'); });
  $('wRetake').addEventListener('click', function () { wr.dataUrl = null; wShow('pick'); });
  $('wSend').addEventListener('click', function () {
    sendWriting({ image: wr.dataUrl, taskPrompt: wr.task.prompt, kind: wr.task.kind, minutes: wr.task.mins });
  });
  $('wSendTyped').addEventListener('click', function () {
    var t = $('wText').value.trim();
    if (t.length < 5) return wError('Write a bit more first.');
    sendWriting({ typed: t, taskPrompt: wr.task.prompt, kind: wr.task.kind, minutes: wr.task.mins });
  });
  $('wQuit').addEventListener('click', function () { clearInterval(wr && wr.tick); show('home'); paintHome(); });
  $('wDone').addEventListener('click', function () { show('home'); paintHome(); });
  $('wAgain').addEventListener('click', function () { startWriting(wr.task.kind); });

  $('btnCheck').addEventListener('click', function () { pick(sess && sess.sel); });
  $('btnNext').addEventListener('click', step);
  $('cCheck').addEventListener('click', function () { coachAnswer(coach && coach.sel); });
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
      if (e.key === 'Enter' || e.key === ' ') {
        if (!$('cNext').classList.contains('hide')) { e.preventDefault(); coachStep(); }
        else if (!$('cCheck').classList.contains('hide') && !$('cCheck').disabled) { e.preventDefault(); coachAnswer(coach.sel); }
      }
      return;
    }
    if ($('quiz').classList.contains('hide')) return;
    if (/^[1-4]$/.test(e.key) && !$('qChoices').dataset.done) {
      var b = $('qChoices').children[+e.key - 1]; if (b) b.click();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (!$('btnNext').classList.contains('hide')) { e.preventDefault(); step(); }
      else if (!$('btnCheck').classList.contains('hide') && !$('btnCheck').disabled) { e.preventDefault(); pick(sess.sel); }
    }
  });

  /* ---------- the reading shelf ---------- */
  var BK = L.books;
  var logBook = null, logHow = 'self', logMins = 10, justStuck = null;

  function coverHTML(b, newestId) {
    return '<div class="cov" style="--h:' + b.hue + '">' +
      '<span class="tt">' + esc(b.title) + '</span>' +
      b.stickers.map(function (st, i) {
        var isNew = newestId && b.sessions[i] && b.sessions[i].id === newestId;
        return '<span class="st' + (isNew ? ' new' : '') + '" style="left:' + st.x + '%;top:' + st.y +
          '%;transform:rotate(' + st.rot + 'deg)">' + st.emoji + '</span>';
      }).join('') +
      (b.finished ? '<span class="ribbon">🎀</span>' : '') + '</div>';
  }

  function paintShelf() {
    var st = S.load(), books = BK.shelf(st.library || []), tot = BK.totals(st.library || []);
    $('shelfN').textContent = tot.stickers ? tot.stickers + (tot.stickers === 1 ? ' sticker' : ' stickers') : '';
    if (!books.length) {
      $('shelf').innerHTML = '<div class="sub" style="grid-column:1/-1">No books yet. Add one and every time you ' +
        'read it, a sticker goes on the cover.</div>';
      return;
    }
    $('shelf').innerHTML = books.map(function (b) {
      return '<button class="bk' + (b.finished ? ' done' : '') + '" data-book="' + b.id + '">' +
        coverHTML(b, justStuck) +
        '<span class="cnt">' + (b.stickers.length || 'not yet') +
        (b.stickers.length ? (b.stickers.length === 1 ? ' sticker' : ' stickers') : '') + '</span></button>';
    }).join('');
    justStuck = null;
  }

  function openAddBook() {
    var have = {};
    BK.shelf(S.load().library || []).forEach(function (b) { have[b.id] = 1; });
    $('bookPicks').innerHTML = BK.SUGGESTED.filter(function (p) { return !have[p.id]; }).map(function (p) {
      return '<button class="pick" data-pick="' + p.id + '">' +
        '<div class="t">' + esc(p.title) + '</div>' +
        (p.author ? '<div class="a">' + esc(p.author) + '</div>' : '') +
        '<div class="k">' + esc(p.kid) + '</div>' +
        '<span class="tag">' + p.tag + '</span></button>';
    }).join('') || '<div class="sub">You have added all the suggestions. Type your own below.</div>';
    $('bookOwn').value = '';
    show('addBook');
  }

  function addBook(id, title, author) {
    S.pushLibrary([{ id: id, kind: 'book', title: title, author: author || '', t: Date.now() }]);
    paintHome();
    cpId = id;
    if (READABLE[id]) return openChapters(id);   // we hold the text — go straight to it
    openLog(id);
  }

  /* Which suggestions we hold the full text of. Uses L.reader rather than the RD
     alias below: `var` hoists the declaration but not the assignment, and this runs
     first. */
  var READABLE = {};
  L.reader.index().then(function (ix) {
    ix.forEach(function (b) { READABLE[b.id] = b; });
    paintHome();
  }).catch(function () {});

  function openLog(id) {
    var b = BK.shelf(S.load().library || []).filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    logBook = b; logHow = 'self'; logMins = 10;
    $('logCover').innerHTML = '<div class="bk">' + coverHTML(b) + '</div>';
    $('logTitle').textContent = b.title;
    $('logMeta').textContent = b.sessions.length
      ? b.stickers.length + (b.stickers.length === 1 ? ' sticker' : ' stickers') + ' so far · ' + b.mins + ' minutes'
      : 'Nothing on this cover yet.';
    $('logHow').innerHTML = Object.keys(BK.HOW).map(function (k) {
      var h = BK.HOW[k];
      return '<button data-how="' + k + '"' + (k === logHow ? ' class="on"' : '') + '>' +
        '<span class="e">' + h.emoji + '</span><span>' + h.label +
        '<span class="n">' + h.note + '</span></span></button>';
    }).join('');
    Array.prototype.forEach.call($('logMins').children, function (b2) {
      b2.classList.toggle('on', +b2.dataset.m === logMins);
    });
    $('logFinish').classList.toggle('hide', b.finished);
    $('logReadHere').classList.toggle('hide', !READABLE[id]);
    cpId = id;
    show('logRead');
  }

  function saveRead() {
    if (!logBook) return;
    var id = logBook.id + ':' + Date.now();
    S.pushLibrary([{ id: id, kind: 'read', book: logBook.id, how: logHow, mins: logMins, t: Date.now() }]);
    justStuck = id;
    var st = S.load();
    var b = BK.shelf(st.library).filter(function (x) { return x.id === logBook.id; })[0];
    var line = BK.praise(b, BK.totals(st.library));
    beep('ok');
    popup('🎉', 'Sticker on the book!', line || (b.stickers.length + ' on this cover now'), 2200);
    show('home'); paintHome();
  }

  function finishBook() {
    if (!logBook) return;
    S.pushLibrary([{ id: logBook.id + ':fin:' + Date.now(), kind: 'finished', book: logBook.id, t: Date.now() }]);
    confetti(3600); beep('up');
    popup('🎀', 'Finished!', esc(logBook.title), 2600);
    show('home'); paintHome();
  }

  $('btnAddBook').addEventListener('click', openAddBook);
  $('bookCancel').addEventListener('click', function () { show('home'); paintHome(); });
  $('bookPicks').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (!b) return;
    var p = BK.SUGGESTED.filter(function (x) { return x.id === b.dataset.pick; })[0];
    if (p) addBook(p.id, p.title, p.author);
  });
  $('bookOwnAdd').addEventListener('click', function () {
    var v = ($('bookOwn').value || '').trim().slice(0, 80);
    if (!v) return;
    addBook('own:' + Date.now(), v, '');
  });
  $('bookOwn').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('bookOwnAdd').click(); });
  $('shelf').addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]'); if (b) openLog(b.dataset.book);
  });
  $('logReadHere').addEventListener('click', function () { openChapters(cpId); });
  $('logHow').addEventListener('click', function (e) {
    var b = e.target.closest('[data-how]'); if (!b) return;
    logHow = b.dataset.how;
    Array.prototype.forEach.call($('logHow').children, function (x) { x.classList.toggle('on', x === b); });
  });
  $('logMins').addEventListener('click', function (e) {
    var b = e.target.closest('[data-m]'); if (!b) return;
    logMins = +b.dataset.m;
    Array.prototype.forEach.call($('logMins').children, function (x) { x.classList.toggle('on', x === b); });
  });
  $('logSave').addEventListener('click', saveRead);
  $('logFinish').addEventListener('click', finishBook);
  $('logBack').addEventListener('click', function () { show('home'); paintHome(); });

  /* ---------- reading the books in the app ---------- */
  var RD = L.reader, rd = null;   // { book, ch }

  function openChapters(id) {
    RD.load(id).then(function (b) {
      var at = RD.lastAt(id), read = readChapters(id);
      $('cpTitle').textContent = b.title;
      $('cpMeta').textContent = b.author + ' · ' + b.year + ' · ' + b.chapters.length +
        (b.verse ? ' poems' : ' chapters') + ' · ' + b.source;
      $('cpResume').classList.toggle('hide', !at);
      if (at) $('cpResume').textContent = 'Carry on — ' + b.chapters[at.ch].t + ' →';
      $('cpList').innerHTML = b.chapters.map(function (c, i) {
        var words = c.p.join(' ').split(/\s+/).length;
        return '<button class="cpRow' + (read[i] ? ' read' : '') + '" data-ch="' + i + '">' +
          '<span class="n">' + (read[i] ? '✓' : i + 1) + '</span>' +
          '<span class="t">' + esc(c.t) + '</span>' +
          '<span class="m">' + (words < 400 ? '~1 min' : Math.round(words / 130) + ' min') + '</span></button>';
      }).join('');
      show('chapters');
    }).catch(function (e) {
      popup('😕', 'Could not open that book', e.message, 2600);
    });
  }

  // Which chapters he has finished, derived from the same library log as the stickers
  function readChapters(id) {
    var out = {};
    (S.load().library || []).forEach(function (e) {
      if (e && e.kind === 'read' && e.book === id && e.ch != null) out[e.ch] = 1;
    });
    return out;
  }

  function openReader(id, ch, jumpTo) {
    RD.load(id).then(function (b) {
      rd = { book: b, ch: ch };
      var p = RD.prefs();
      $('rdBook').textContent = b.title;
      $('rdCh').textContent = b.chapters[ch].t + ' · ' + (ch + 1) + ' of ' + b.chapters.length;
      $('rdBody').style.setProperty('--rd', RD.SIZES[p.size] + 'px');
      $('rdBody').innerHTML = RD.chapterHTML(b, ch);
      $('rdTip').classList.toggle('hide', !RD.canSpeak);
      $('rdPrev').disabled = ch === 0;
      $('rdNext').disabled = ch >= b.chapters.length - 1;
      show('reader');
      if (jumpTo) {
        setTimeout(function () {
          var el = $('rdBody');
          window.scrollTo(0, el.offsetTop + el.scrollHeight * jumpTo);
        }, 30);
      }
    });
  }

  var markTick = null;
  window.addEventListener('scroll', function () {
    if (!rd || $('reader').classList.contains('hide')) return;
    clearTimeout(markTick);
    markTick = setTimeout(function () {
      var el = $('rdBody');
      var r = Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / Math.max(1, el.scrollHeight)));
      RD.mark(rd.book.id, rd.ch, r);
    }, 400);
  }, { passive: true });

  $('rdBody').addEventListener('click', function (e) {
    var w = e.target.closest('w');
    if (!w) return;
    if (!RD.say(w.textContent)) return;
    var prev = $('rdBody').querySelector('w.said');
    if (prev) prev.classList.remove('said');
    w.classList.add('said');
    setTimeout(function () { w.classList.remove('said'); }, 900);
  });

  function resize(d) {
    var p = RD.prefs();
    p.size = Math.max(0, Math.min(RD.SIZES.length - 1, p.size + d));
    RD.savePrefs(p);
    $('rdBody').style.setProperty('--rd', RD.SIZES[p.size] + 'px');
  }
  $('rdBigger').addEventListener('click', function () { resize(1); });
  $('rdSmaller').addEventListener('click', function () { resize(-1); });
  $('rdBack').addEventListener('click', function () { openChapters(rd.book.id); });
  $('rdPrev').addEventListener('click', function () { if (rd.ch > 0) { openReader(rd.book.id, rd.ch - 1); window.scrollTo(0, 0); } });
  $('rdNext').addEventListener('click', function () { if (rd.ch < rd.book.chapters.length - 1) { openReader(rd.book.id, rd.ch + 1); window.scrollTo(0, 0); } });

  /* Reading here records itself: the chapter is logged as a sitting, which is what
     puts the sticker on the cover. No separate step to remember. */
  $('rdDone').addEventListener('click', function () {
    if (!rd) return;
    var b = rd.book, words = b.chapters[rd.ch].p.join(' ').split(/\s+/).length;
    var mins = Math.max(2, Math.round(words / 130));
    var have = BK.shelf(S.load().library || []).some(function (x) { return x.id === b.id; });
    var entries = [];
    if (!have) entries.push({ id: b.id, kind: 'book', title: b.title, author: b.author, t: Date.now() });
    entries.push({ id: b.id + ':' + Date.now(), kind: 'read', book: b.id, how: 'self',
                   mins: mins, ch: rd.ch, t: Date.now() });
    if (rd.ch >= b.chapters.length - 1) {
      entries.push({ id: b.id + ':fin:' + Date.now(), kind: 'finished', book: b.id, t: Date.now() });
    }
    justStuck = entries[entries.length - 1].id;
    S.pushLibrary(entries);
    beep('ok');
    if (rd.ch >= b.chapters.length - 1) { confetti(3600); popup('🎀', 'You finished it!', esc(b.title), 2800); }
    else popup('🎉', 'Sticker on the book!', b.chapters[rd.ch].t, 2200);
    show('home'); paintHome();
  });

  $('cpBack').addEventListener('click', function () { show('home'); paintHome(); });
  $('cpResume').addEventListener('click', function () {
    var at = RD.lastAt(rd && rd.book ? rd.book.id : cpId);
    openReader(cpId, at ? at.ch : 0, at ? at.at : 0);
  });
  var cpId = null;
  $('cpList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ch]');
    if (b) { openReader(cpId, +b.dataset.ch); window.scrollTo(0, 0); }
  });

  /* ---------- fast maths ---------- */
  /* Answers are typed, and the clock runs from the question appearing to the FIRST
     keypress. That is thinking time. Total time would be dominated by how fast he
     can find digits on a keypad, which is not the thing being trained. */
  var fl = null;   // { track, queue, i, shown, firstKey, typed, done[], locked }

  function startFacts(track) {
    var st = S.load();
    var queue = L.facts.pickSession(track, st.facts || [], 20);
    if (!queue.length) return;
    fl = { track: track, queue: queue, i: 0, done: [], typed: '', shown: 0, firstKey: 0, locked: false };
    show('fluency');
    $('fTrack').textContent = L.facts.TRACKS[track].label;
    factRender();
  }

  function factDots() {
    var h = '';
    for (var i = 0; i < fl.queue.length; i++) {
      var d = fl.done[i];
      h += '<i class="' + (d ? (d.ok ? 'ok' : 'no') : (i === fl.i ? 'now' : '')) + '"></i>';
    }
    $('fDots').innerHTML = h;
  }

  function factRender() {
    var f = fl.queue[fl.i];
    fl.typed = ''; fl.firstKey = 0; fl.locked = false;
    fl.shown = Date.now();
    $('fPrompt').textContent = L.facts.prompt(f);
    $('fPrompt').className = 'fq' + (f.kind === 'skip' ? ' seq' : '');
    var vis = L.facts.visualFor(f);
    $('fVis').innerHTML = vis && f.kind === 'skip' ? V.render(vis) : '';
    $('fAns').className = 'fans';
    $('fTyped').textContent = '';
    $('fMark').innerHTML = '';
    $('fNext').classList.add('hide');
    Array.prototype.forEach.call($('fPad').children, function (b) { b.disabled = false; });
    var ok = fl.done.filter(function (d) { return d.ok; }).length;
    $('fScore').textContent = ok + '/' + fl.done.length;
    var run = 0;
    for (var i = fl.done.length - 1; i >= 0 && fl.done[i].ok; i--) run++;
    $('fStreak').textContent = run >= 3 ? '🔥 ' + run + ' in a row' : '';
    factDots();
  }

  function factKey(k) {
    if (!fl || fl.locked) return;
    if (k === 'ok') return factSubmit();
    if (k === 'del') { fl.typed = fl.typed.slice(0, -1); $('fTyped').textContent = fl.typed; return; }
    if (fl.typed.length >= 3) return;
    if (!fl.firstKey) fl.firstKey = Date.now();      // thinking time stops here
    fl.typed += k;
    $('fTyped').textContent = fl.typed;
    beep('tick');
  }

  function factSubmit() {
    if (!fl || fl.locked || !fl.typed.length) return;
    var f = fl.queue[fl.i];
    var ok = Number(fl.typed) === f.answer;
    var ms = Math.max(0, (fl.firstKey || Date.now()) - fl.shown);
    var quick = ok && ms <= L.facts.FAST_MS;
    fl.locked = true;
    Array.prototype.forEach.call($('fPad').children, function (b) { b.disabled = true; });

    fl.done[fl.i] = { fact: f.id, ok: ok, ms: ms, t: Date.now(), track: fl.track,
                      given: Number(fl.typed), answer: f.answer };
    $('fAns').className = 'fans done ' + (ok ? 'ok' : 'bad');
    $('fTyped').textContent = ok ? fl.typed : fl.typed + '  →  ' + f.answer;

    var line = ok
      ? (quick ? '<span class="zip">⚡ Straight out of your head</span>' : pickPraise())
      : 'Not this time';
    var hint = (!ok || !quick) ? L.facts.hint(f) : '';
    $('fMark').innerHTML = '<div class="fmark ' + (ok ? 'ok' : 'bad') + '">' + line + '</div>' +
      (hint ? '<div class="fhint">' + hint + '</div>' : '');
    beep(ok ? 'ok' : 'no');

    $('fNext').classList.remove('hide');
    $('fNext').textContent = fl.i + 1 >= fl.queue.length ? 'See how you went →' : 'Next →';
    factDots();
  }

  function factNext() {
    if (fl.i + 1 >= fl.queue.length) return factFinish();
    fl.i++; factRender();
  }

  function factFinish() {
    var st = S.load();
    st.facts = (st.facts || []).concat(fl.done);
    S.save();
    S.pushFacts();

    var ok = fl.done.filter(function (d) { return d.ok; }).length;
    var quick = fl.done.filter(function (d) { return d.ok && d.ms <= L.facts.FAST_MS; }).length;
    var med = fl.done.filter(function (d) { return d.ok; }).map(function (d) { return d.ms; })
                     .sort(function (x, y) { return x - y; });
    var sum = L.facts.summary(st.facts, fl.track);

    $('frTitle').textContent = ok === fl.done.length ? 'Every one!' : ok + ' out of ' + fl.done.length;
    /* A fact is only "known" after two fast answers on separate days, so after a
       first session the honest count is zero. Saying "0 of 88 are yours" to a child
       who just got 15 straight out of his head is both true and useless. */
    $('frSub').textContent = quick + (quick === 1 ? ' came' : ' came') + ' straight out of your head. ' +
      (sum.counts.fluent
        ? sum.counts.fluent + ' of the ' + sum.total + ' in this set are yours for good now.'
        : 'Come back tomorrow — that is how we find out which ones really stuck.');
    $('frStats').innerHTML =
      '<div><b>' + ok + '/' + fl.done.length + '</b><span>right</span></div>' +
      '<div><b>' + quick + '</b><span>⚡ instant</span></div>' +
      '<div><b>' + (med.length ? (med[(med.length - 1) >> 1] / 1000).toFixed(1) + 's' : '–') + '</b><span>typical think</span></div>';

    // Only the ones worth another look — right-but-slow counts, it means still counting up
    var work = fl.done.filter(function (d) { return !d.ok || d.ms > L.facts.FAST_MS; });
    $('frList').innerHTML = work.length
      ? '<h3 style="margin:18px 0 4px;font-size:16px">Worth another go</h3>' +
        '<p class="sub" style="margin-bottom:6px">These came slowly or went wrong. They will be back next time.</p>' +
        work.map(function (d) {
          var f = L.facts.byId(d.fact);
          return '<div class="frow' + (d.ok ? '' : ' bad') + '"><span class="f">' +
            L.facts.prompt(f).replace(/\?/, '') + (f.kind === 'skip' ? '' : ' = ') + f.answer + '</span>' +
            '<span class="ms">' + (d.ok ? (d.ms / 1000).toFixed(1) + 's' : 'said ' + d.given) + '</span></div>';
        }).join('')
      : '<p class="sub" style="margin-top:16px">Nothing slow, nothing wrong. That set is solid.</p>';

    if (ok === fl.done.length) confetti(4200);
    show('fResult');
    paintHome();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-fact]') : null;
    if (t) startFacts(t.dataset.fact);
  });
  $('fPad').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) factKey(b.dataset.k);
  });
  $('fNext').addEventListener('click', factNext);
  $('fQuit').addEventListener('click', function () {
    if (fl && fl.done.length) { var st = S.load(); st.facts = (st.facts || []).concat(fl.done); S.save(); S.pushFacts(); }
    fl = null; show('home'); paintHome();
  });
  $('frAgain').addEventListener('click', function () { startFacts(fl.track); });
  $('frHome').addEventListener('click', function () { show('home'); paintHome(); });

  document.addEventListener('keydown', function (e) {
    if (!fl || $('fluency').classList.contains('hide')) return;
    if (e.key >= '0' && e.key <= '9') { e.preventDefault(); factKey(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); factKey('del'); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (!$('fNext').classList.contains('hide')) factNext(); else factKey('ok');
    }
  });

  /* ---------- games from school ----------
   *
   * The teacher's sheet, playable. The app is the dealer and the scorer; the child
   * still plays it with somebody, which is why the first thing it asks is who.
   *
   * Four kinds of round, because the nine games genuinely need four:
   *   num   — type the total (adding, times tables, subtracting from 100)
   *   build — arrange four cards into two 2-digit numbers, then add them
   *   pick  — choose the cards that make the target (Go Fish, Brainy Cards)
   *   expr  — build a sum from five dice to hit a target
   * Everything else — timing, marking, the log, the report — is shared.
   */
  var GM = L.games;
  var gm = null;                         // the sitting in progress
  var giGame = null, giWho = 'parent', giOpt = null;

  function paintGames() {
    var sum = GM.summary(S.load().games || []);
    $('gamesN').textContent = sum.sittings ? sum.sittings + (sum.sittings === 1 ? ' sitting' : ' sittings') : '';
    $('gameCards').innerHTML = sum.games.map(function (g) {
      var note = g.plays
        ? g.plays + (g.plays === 1 ? ' time · ' : ' times · ') + g.pct + '% right'
        : (g.game.needs === 'dice' ? 'Dice · not played yet' : 'Cards · not played yet');
      return '<button class="drill" data-game="' + g.id + '">' +
        '<div class="e">' + g.game.emoji + '</div><div class="t">' + esc(g.game.title) + '</div>' +
        (g.rounds ? '<div class="b"><i style="width:' + (g.pct || 0) + '%"></i></div>' : '') +
        '<div class="n">' + note + '</div></button>';
    }).join('');
  }

  function openGameIntro(id) {
    var g = GM.byId(id);
    if (!g) return;
    giGame = g;
    giOpt = g.options ? g.options.choices[0].v : null;
    $('giEmoji').textContent = g.emoji;
    $('giTitle').textContent = g.title;
    $('giKid').textContent = g.kid;
    $('giSheet').textContent = g.sheet;
    $('giOpts').classList.toggle('hide', !g.options);
    if (g.options) {
      $('giOptLabel').textContent = g.options.label;
      $('giOptNote').textContent = g.options.note || '';
      $('giOptSeg').innerHTML = g.options.choices.map(function (c, i) {
        return '<button data-opt="' + c.v + '"' + (i === 0 ? ' class="on"' : '') + '>' + c.label + '</button>';
      }).join('');
    }
    $('giWho').innerHTML = Object.keys(GM.WHO).map(function (k) {
      var w = GM.WHO[k];
      return '<button data-who="' + k + '"' + (k === giWho ? ' class="on"' : '') + '>' + w.emoji + ' ' + w.label + '</button>';
    }).join('');
    show('gIntro');
  }

  function cardHTML(c, i, kind, cls) {
    if (kind === 'die') {
      /* Dice are drawn as pips, not digits: reading the pattern without counting it
         is half of what "Dots and Numerals" is for. */
      var spots = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]][c.v] || [];
      var cells = '';
      for (var p = 0; p < 9; p++) cells += spots.indexOf(p) >= 0 ? '<i></i>' : '<span></span>';
      return '<button class="die ' + cls + '" data-i="' + i + '" aria-label="' + c.v + '">' + cells + '</button>';
    }
    if (kind === 'tile') return '<button class="pcard tile ' + cls + '" data-i="' + i + '">' + c.v + '</button>';
    return '<button class="pcard ' + cls + (c.red ? ' red' : '') + '" data-i="' + i + '">' +
      '<span class="s">' + c.s + '</span>' + c.v + '<span class="s2">' + c.s + '</span></button>';
  }

  function startGame() {
    var g = giGame;
    if (!g) return;
    var run = Object.assign({ total: g.rounds, opt: giOpt }, g.start ? g.start() : {});
    gm = { game: g, run: run, i: 0, done: [], who: giWho, opt: giOpt, started: Date.now(),
           round: null, typed: '', shown: 0, firstKey: 0, locked: false, sel: [], tokens: [], usedIdx: [], slots: [] };
    $('gName').textContent = g.title;
    $('gWho').textContent = GM.WHO[giWho].label;
    gRound();
  }

  function gRound() {
    var g = gm.game;
    gm.round = g.round(gm.i, gm.run, Math.random);
    gm.typed = ''; gm.firstKey = 0; gm.locked = false; gm.sel = []; gm.tokens = []; gm.usedIdx = [];
    gm.slots = [null, null, null, null];
    gm.shown = Date.now();
    var r = gm.round;

    $('gPrompt').textContent = r.prompt;
    $('gSent').textContent = r.mode === 'num' && r.sentence ? r.sentence + ' = ?' : '';
    $('gDeal').className = 'deal' + (r.mode === 'pick' || r.mode === 'expr' || r.mode === 'build' ? ' tap' : '');
    $('gDeal').innerHTML = r.items.map(function (c, i) { return cardHTML(c, i, r.kind, ''); }).join('');
    $('gMark').innerHTML = '';
    $('gStrat').classList.add('hide');
    $('gNext').classList.add('hide');
    $('gTyped').textContent = '';
    $('gAns').className = 'fans' + (r.mode === 'num' ? '' : ' hide');
    $('gPad').classList.toggle('hide', r.mode !== 'num');
    $('gBuild').classList.toggle('hide', r.mode !== 'build');
    $('gExpr').classList.toggle('hide', r.mode !== 'expr');
    $('gOps').classList.toggle('hide', r.mode !== 'expr');
    $('gDone').classList.toggle('hide', r.mode !== 'pick' && r.mode !== 'expr');
    $('gDone').textContent = r.mode === 'pick' ? 'That is my pick →' : 'Check it →';
    Array.prototype.forEach.call($('gPad').children, function (b) { b.disabled = false; });
    if (r.mode === 'build') gPaintSlots();
    if (r.mode === 'expr') gPaintExpr();

    var ok = gm.done.filter(function (d) { return d.ok; }).length;
    $('gScore').textContent = ok + '/' + gm.done.length;
    $('gRun').textContent = 'Round ' + (gm.i + 1) + ' of ' + gm.game.rounds;
    var h = '';
    for (var i = 0; i < gm.game.rounds; i++) {
      var d = gm.done[i];
      h += '<i class="' + (d ? (d.ok ? 'ok' : 'no') : (i === gm.i ? 'now' : '')) + '"></i>';
    }
    $('gDots').innerHTML = h;
    show('games');
  }

  /* ----- build: four cards into two 2-digit numbers ----- */
  function gPaintSlots() {
    var s = gm.slots;
    $('gBuild').innerHTML =
      '<button class="slot' + (s[0] != null ? ' full' : '') + '" data-slot="0">' + (s[0] != null ? gm.round.items[s[0]].v : '') + '</button>' +
      '<button class="slot' + (s[1] != null ? ' full' : '') + '" data-slot="1">' + (s[1] != null ? gm.round.items[s[1]].v : '') + '</button>' +
      '<span class="plus">+</span>' +
      '<button class="slot' + (s[2] != null ? ' full' : '') + '" data-slot="2">' + (s[2] != null ? gm.round.items[s[2]].v : '') + '</button>' +
      '<button class="slot' + (s[3] != null ? ' full' : '') + '" data-slot="3">' + (s[3] != null ? gm.round.items[s[3]].v : '') + '</button>';
    Array.prototype.forEach.call($('gDeal').children, function (el, i) {
      el.className = el.className.replace(/ used/g, '') + (s.indexOf(i) >= 0 ? ' used' : '');
    });
    var full = s.every(function (x) { return x != null; });
    $('gPad').classList.toggle('hide', !full);
    $('gAns').className = 'fans' + (full ? '' : ' hide');
    if (full) {
      var n1 = gm.round.items[s[0]].v * 10 + gm.round.items[s[1]].v;
      var n2 = gm.round.items[s[2]].v * 10 + gm.round.items[s[3]].v;
      $('gSent').textContent = n1 + ' + ' + n2 + ' = ?';
    } else {
      $('gSent').textContent = 'Tap the cards to fill the boxes.';
    }
  }
  function gPlace(i) {
    var s = gm.slots, at = s.indexOf(i);
    if (at >= 0) { s[at] = null; gPaintSlots(); return; }
    for (var k = 0; k < 4; k++) if (s[k] == null) { s[k] = i; break; }
    gPaintSlots();
  }

  /* ----- expr: five dice and four operations ----- */
  /* Which die is spent is tracked by POSITION, not by value. Tracking by value
     looked identical on screen and worked until two dice came up the same: the app
     would grey out one 3 while the child had tapped the other, and his tap did
     nothing at all. */
  function gPaintExpr() {
    var t = gm.tokens;
    $('gExpr').className = 'expr' + (t.length ? '' : ' empty');
    $('gExpr').textContent = t.length ? GM.exprText(t) : 'Tap the dice and the signs to build a sum.';
    Array.prototype.forEach.call($('gDeal').children, function (el, i) {
      el.className = el.className.replace(/ used/g, '') + (gm.usedIdx.indexOf(i) >= 0 ? ' used' : '');
    });
  }

  /* ----- pick: tap the ones that make the target ----- */
  function gToggle(i) {
    var at = gm.sel.indexOf(i);
    if (at >= 0) gm.sel.splice(at, 1); else gm.sel.push(i);
    Array.prototype.forEach.call($('gDeal').children, function (el, k) {
      el.className = el.className.replace(/ on/g, '') + (gm.sel.indexOf(k) >= 0 ? ' on' : '');
    });
    var tot = gm.sel.reduce(function (n, k) { return n + gm.round.items[k].v; }, 0);
    var vals = gm.sel.map(function (k) { return gm.round.items[k].v; });
    // one card is not a sum: "4 = 4" reads like a mistake rather than a running total
    $('gSent').textContent = vals.length > 1 ? vals.join(' + ') + ' = ' + tot : vals.join('');
  }

  /* ----- typing a number ----- */
  function gKey(k) {
    if (!gm || gm.locked) return;
    var r = gm.round;
    if (r.mode === 'build' && gm.slots.some(function (x) { return x == null; })) return;
    if (k === 'ok') return gSubmitNum();
    if (k === 'del') { gm.typed = gm.typed.slice(0, -1); $('gTyped').textContent = gm.typed; return; }
    if (gm.typed.length >= 3) return;
    if (!gm.firstKey) gm.firstKey = Date.now();
    gm.typed += k;
    $('gTyped').textContent = gm.typed;
    beep('tick');
  }

  function gSubmitNum() {
    if (!gm.typed.length) return;
    var r = gm.round, want = r.answer;
    if (r.mode === 'build') {
      var s = gm.slots, it = r.items;
      want = (it[s[0]].v * 10 + it[s[1]].v) + (it[s[2]].v * 10 + it[s[3]].v);
      var best = it.map(function (c) { return c.v; }).sort(function (a, b) { return b - a; });
      gm.bestTotal = (best[0] + best[1]) * 10 + best[2] + best[3];
      gm.myTotal = want;
    }
    var ok = Number(gm.typed) === want;
    var why = ok ? '' : 'It comes to ' + want + '.';
    if (r.mode === 'num' && r.left != null) gm.run.left = r.answer;   // Card Friends carries the total on
    if (r.mode === 'num') gm.run.lastTotal = r.answer;
    $('gAns').className = 'fans done ' + (ok ? 'ok' : 'bad');
    $('gTyped').textContent = ok ? gm.typed : gm.typed + '  →  ' + want;
    gLand(ok, why);
  }

  function gConfirm() {
    if (!gm || gm.locked) return;
    var r = gm.round, res;
    if (r.mode === 'pick') {
      if (!gm.firstKey) gm.firstKey = Date.now();
      res = GM.checkPick(gm.sel.map(function (i) { return r.items[i]; }), r.rule);
    } else {
      res = GM.checkExpr(gm.tokens, r);
    }
    gLand(res.ok, res.why);
  }

  function gLand(ok, why) {
    var r = gm.round;
    gm.locked = true;
    Array.prototype.forEach.call($('gPad').children, function (b) { b.disabled = true; });
    var ms = Math.max(0, (gm.firstKey || Date.now()) - gm.shown);
    gm.done[gm.i] = { ok: ok, ms: ms, mode: r.mode, t: Date.now() };

    var extra = '';
    if (r.mode === 'build' && ok) {
      /* The sheet's winner is whoever makes the biggest total, so the second thing
         worth knowing is whether he put the big cards in the tens. */
      extra = gm.myTotal === gm.bestTotal
        ? 'And that is the biggest total those four cards can make.'
        : 'The biggest possible was ' + gm.bestTotal + ' — big cards in the tens.';
      gm.done[gm.i].best = gm.myTotal === gm.bestTotal;
    }
    if (r.mode === 'num' && r.last && ok) extra = 'Down to nothing. That is the whole game.';

    $('gMark').innerHTML = '<div class="fmark ' + (ok ? 'ok' : 'bad') + '">' +
      (ok ? pickPraise() : 'Not this time') + '</div>' +
      (why ? '<div class="fhint">' + esc(why) + '</div>' : '') +
      (extra ? '<div class="fhint">' + esc(extra) + '</div>' : '');
    beep(ok ? 'ok' : 'no');
    $('gDone').classList.add('hide');

    if (r.strategy) {
      $('gStrat').classList.remove('hide');
      $('gStrat').innerHTML = '<div class="h">How did you work it out?</div><div class="row">' +
        GM.STRATEGIES.map(function (s) {
          return '<button data-strat="' + s.id + '">' + s.label + '</button>';
        }).join('') + '</div>';
    }
    $('gNext').classList.remove('hide');
    $('gNext').textContent = gm.i + 1 >= gm.game.rounds ? 'See how you went →' : 'Next →';
    var h = '';
    for (var i = 0; i < gm.game.rounds; i++) {
      var d = gm.done[i];
      h += '<i class="' + (d ? (d.ok ? 'ok' : 'no') : (i === gm.i ? 'now' : '')) + '"></i>';
    }
    $('gDots').innerHTML = h;
  }

  function gNext() {
    if (gm.i + 1 >= gm.game.rounds) return gFinish(true);
    gm.i++; gRound();
  }

  function gSave() {
    if (!gm || !gm.done.length) return null;
    var okN = gm.done.filter(function (d) { return d.ok; }).length;
    var entry = {
      id: gm.game.id + ':' + gm.started, kind: 'play', game: gm.game.id, t: gm.started,
      mins: Math.max(1, Math.round((Date.now() - gm.started) / 60000)),
      rounds: gm.done.length, ok: okN, who: gm.who, opt: gm.opt || null,
      detail: gm.done.map(function (d) {
        return { ok: d.ok ? 1 : 0, ms: d.ms, strategy: d.strategy || '', best: d.best ? 1 : 0 };
      })
    };
    S.pushGames([entry]);
    return entry;
  }

  function gFinish(full) {
    var entry = gSave();
    if (!entry) { show('home'); paintHome(); return; }
    var g = gm.game, okN = entry.ok, n = entry.rounds;
    var times = gm.done.filter(function (d) { return d.ok && d.ms; }).map(function (d) { return d.ms; })
                       .sort(function (a, b) { return a - b; });
    $('grTitle').textContent = okN === n ? 'Every round!' : okN + ' out of ' + n;
    $('grSub').textContent = g.title + (full ? '' : ' — stopped early, and it still counts') +
      '. Your teacher’s note now has this in it.';
    $('grStats').innerHTML =
      '<div><b>' + okN + '/' + n + '</b><span>right</span></div>' +
      '<div><b>' + entry.mins + '</b><span>minutes</span></div>' +
      '<div><b>' + (times.length ? (times[(times.length - 1) >> 1] / 1000).toFixed(1) + 's' : '–') + '</b><span>typical think</span></div>';
    var sum = GM.statsFor(S.load().games || [], g.id);
    $('grList').innerHTML = '<p class="sub" style="margin-top:14px">' +
      esc(g.title + ': ' + sum.plays + (sum.plays === 1 ? ' sitting' : ' sittings') + ' so far, ' +
          sum.ok + ' of ' + sum.rounds + ' rounds right.') + '</p>';
    if (okN === n) confetti(3800);
    gm = null;
    show('gResult');
    paintHome();
  }

  /* ----- the note for school ----- */
  var TEACHER = 'leo.teacher';
  function teacher() {
    try { return JSON.parse(localStorage.getItem(TEACHER) || '{}'); } catch (e) { return {}; }
  }
  function saveTeacher(t) { try { localStorage.setItem(TEACHER, JSON.stringify(t)); } catch (e) {} }

  function openReport() {
    var t = teacher();
    $('rpWho').value = t.name || '';
    $('rpMail').value = t.email || '';
    paintReport();
    show('report');
  }
  function reportText() {
    var t = teacher(), st = S.load();
    var rep = GM.report(st.games || [], { name: st.profile.name || 'Leo' });
    var head = t.name ? 'For ' + t.name + '\n' : '';
    return rep.title + '\n' + head + '\n' + rep.lines.join('\n');
  }
  function paintReport() { $('rpText').textContent = reportText(); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-game]') : null;
    if (t) openGameIntro(t.dataset.game);
  });
  $('btnReport').addEventListener('click', openReport);
  $('giBack').addEventListener('click', function () { show('home'); paintHome(); });
  $('giStart').addEventListener('click', startGame);
  $('giWho').addEventListener('click', function (e) {
    var b = e.target.closest('[data-who]'); if (!b) return;
    giWho = b.dataset.who;
    Array.prototype.forEach.call($('giWho').children, function (x) { x.classList.toggle('on', x === b); });
  });
  $('giOptSeg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-opt]'); if (!b) return;
    giOpt = +b.dataset.opt;
    Array.prototype.forEach.call($('giOptSeg').children, function (x) { x.classList.toggle('on', x === b); });
  });

  $('gDeal').addEventListener('click', function (e) {
    var b = e.target.closest('[data-i]');
    if (!b || !gm || gm.locked) return;
    var i = +b.dataset.i, mode = gm.round.mode;
    if (mode === 'build') gPlace(i);
    else if (mode === 'pick') gToggle(i);
    else if (mode === 'expr') {
      if (gm.usedIdx.indexOf(i) >= 0) return;           // that die is already in the sum
      if (!gm.firstKey) gm.firstKey = Date.now();
      gm.tokens.push(gm.round.items[i].v); gm.usedIdx.push(i);
      gPaintExpr(); beep('tick');
    }
  });
  $('gBuild').addEventListener('click', function (e) {
    var b = e.target.closest('[data-slot]');
    if (!b || !gm || gm.locked) return;
    var k = +b.dataset.slot;
    if (gm.slots[k] != null) { gm.slots[k] = null; gPaintSlots(); }
  });
  $('gPad').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (b) gKey(b.dataset.k);
  });
  $('gOps').addEventListener('click', function (e) {
    var b = e.target.closest('[data-op]');
    if (!b || !gm || gm.locked) return;
    if (b.dataset.op === 'undo') {
      if (typeof gm.tokens.pop() === 'number') gm.usedIdx.pop();
    } else { if (!gm.firstKey) gm.firstKey = Date.now(); gm.tokens.push(b.dataset.op); }
    gPaintExpr();
  });
  $('gDone').addEventListener('click', gConfirm);
  $('gStrat').addEventListener('click', function (e) {
    var b = e.target.closest('[data-strat]');
    if (!b || !gm || !gm.done[gm.i]) return;
    gm.done[gm.i].strategy = b.dataset.strat;
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('[data-strat]'), function (x) {
      x.classList.toggle('on', x === b);
    });
  });
  $('gNext').addEventListener('click', gNext);
  $('gQuit').addEventListener('click', function () {
    /* A sitting that stopped halfway is still something the teacher asked him to
       do, so it is saved rather than thrown away. */
    if (gm && gm.done.length) return gFinish(false);
    gm = null; show('home'); paintHome();
  });
  $('grAgain').addEventListener('click', function () { if (giGame) startGame(); });
  $('grReport').addEventListener('click', openReport);
  $('grHome').addEventListener('click', function () { show('home'); paintHome(); });

  $('rpBack').addEventListener('click', function () { show('home'); paintHome(); });
  $('rpWho').addEventListener('input', function () {
    var t = teacher(); t.name = $('rpWho').value.trim().slice(0, 60); saveTeacher(t); paintReport();
  });
  $('rpMail').addEventListener('input', function () {
    var t = teacher(); t.email = $('rpMail').value.trim().slice(0, 120); saveTeacher(t);
  });
  $('rpCopy').addEventListener('click', function () {
    var txt = reportText();
    function fallback() {
      var r = document.createRange(); r.selectNodeContents($('rpText'));
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { document.execCommand('copy'); } catch (e2) {}
      popup('📋', 'Copied', 'Paste it into an email', 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        popup('📋', 'Copied', 'Paste it into an email', 1600);
      }).catch(fallback);
    } else fallback();
  });
  $('rpMailBtn').addEventListener('click', function () {
    var t = teacher(), st = S.load();
    var subject = (st.profile.name || 'Leo') + ' — numeracy games at home';
    location.href = 'mailto:' + encodeURIComponent(t.email || '') +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(reportText());
  });
  $('rpPrint').addEventListener('click', function () { window.print(); });

  document.addEventListener('keydown', function (e) {
    if (!gm || $('games').classList.contains('hide')) return;
    if (gm.round.mode === 'num' || gm.round.mode === 'build') {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); gKey(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); gKey('del'); }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!$('gNext').classList.contains('hide')) gNext();
      else if (!$('gDone').classList.contains('hide')) gConfirm();
      else gKey('ok');
    }
  });

  /* A read-only hook for the smoke test, so it can answer questions correctly or
     wrongly on purpose instead of guessing. It exposes nothing a child could not
     already read off the screen a moment later. */
  L.debug = {
    answerIndex: function () { return sess && sess.current ? sess.current.answer : null; },
    coachAnswerIndex: function () { return coach && coach.q ? coach.q.answer : null; },
    factAnswer: function () { return fl && fl.queue[fl.i] ? fl.queue[fl.i].answer : null; },
    factFact: function () { return fl && fl.queue[fl.i] ? fl.queue[fl.i].id : null; },
    gameRound: function () {
      if (!gm || !gm.round) return null;
      var r = gm.round;
      return { mode: r.mode, answer: r.answer, target: r.target,
               items: r.items.map(function (c) { return c.v; }),
               rule: r.rule || null, i: gm.i, rounds: gm.game.rounds };
    },
    screen: function () {
      return ['home', 'quiz', 'coach', 'result', 'write', 'wResult', 'fluency', 'fResult',
              'gIntro', 'games', 'gResult', 'report']
        .filter(function (id) { return !$(id).classList.contains('hide'); })[0] || null;
    }
  };

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
