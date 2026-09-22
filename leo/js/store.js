/* store.js — the progress record.
 *
 * The record lives on the server (see /api/progress) so the quiz on a tablet and
 * the dashboard on a laptop are the same history. A local copy is kept in
 * localStorage as a cache, so the page paints instantly and keeps working offline;
 * anything recorded while offline is queued and pushed on the next successful call.
 *
 * Merging is by answer id and is idempotent, on both sides, so a replayed push can
 * never double-count a session.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var CACHE = 'leo.progress.v2';
  var KEYSTORE = 'leo.accesskey';
  var API = (location.pathname.indexOf('/leo/admin') === 0 || /\/admin\/?$/.test(location.pathname))
    ? '../../api/progress' : '/api/progress';

  function today(ts) {
    var d = new Date(ts == null ? Date.now() : ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function blank() {
    return {
      v: 2,
      profileId: 'leo',
      profile: { name: 'Leo', dob: '', year: 2, avatar: '🦁', country: 'AU' },
      settings: { sound: true, feedback: 'instant' },
      model: null,
      xp: 0, best: 0,
      streak: { days: 0, last: '' },
      sessions: [], answers: [],
      pending: { sessions: [], answers: [] }   // not yet acknowledged by the server
    };
  }

  function answerId(a) { return a.aid || (a.sid && a.t ? a.sid + ':' + a.t : null); }

  function mergeById(base, add, idOf) {
    var seen = {}, out = base.slice(), i;
    for (i = 0; i < base.length; i++) seen[idOf(base[i])] = 1;
    for (i = 0; i < add.length; i++) {
      var id = idOf(add[i]);
      if (!id || seen[id]) continue;
      seen[id] = 1; out.push(add[i]);
    }
    out.sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
    return out;
  }

  var S = {
    state: null,
    remote: { configured: null, ok: false, reason: '', keyRequired: false, lastSync: 0, syncing: false },
    onchange: null,

    /* ---------- local cache ---------- */
    load: function () {
      if (S.state) return S.state;
      var raw = null;
      try { raw = localStorage.getItem(CACHE) || localStorage.getItem('leo.progress.v1'); } catch (e) {}
      try { S.state = raw ? JSON.parse(raw) : blank(); } catch (e) { S.state = blank(); }
      var b = blank(), k;
      for (k in b) if (S.state[k] === undefined) S.state[k] = b[k];
      for (k in b.profile) if (S.state.profile[k] === undefined) S.state.profile[k] = b.profile[k];
      for (k in b.settings) if (S.state.settings[k] === undefined) S.state.settings[k] = b.settings[k];
      if (!S.state.pending) S.state.pending = { sessions: [], answers: [] };
      // v1 records predate answer ids; give them stable ones so they merge exactly once
      S.state.answers.forEach(function (a, i) {
        if (!a.aid) a.aid = (a.sid || 'v1') + ':' + (a.t || i) + ':' + i;
      });
      return S.state;
    },
    save: function () {
      try { localStorage.setItem(CACHE, JSON.stringify(S.state)); }
      catch (e) {
        S.state.answers = S.state.answers.slice(Math.floor(S.state.answers.length / 4));
        try { localStorage.setItem(CACHE, JSON.stringify(S.state)); } catch (e2) {}
      }
      if (S.onchange) S.onchange();
      return S.state;
    },

    /* ---------- access key ---------- */
    getKey: function () { try { return localStorage.getItem(KEYSTORE) || ''; } catch (e) { return ''; } },
    setKey: function (k) { try { localStorage.setItem(KEYSTORE, k || ''); } catch (e) {} },

    /* ---------- server ---------- */
    call: function (method, body) {
      var st = S.load();
      var url = API + '?profile=' + encodeURIComponent(st.profileId || 'leo');
      var opt = { method: method, headers: { 'Content-Type': 'application/json' } };
      var k = S.getKey();
      if (k) opt.headers['x-leo-key'] = k;
      if (body) opt.body = JSON.stringify(body);
      return fetch(url, opt).then(function (r) {
        return r.json().catch(function () { return { ok: false, reason: 'Server sent a non-JSON reply (' + r.status + ')' }; });
      });
    },

    applyRemote: function (res) {
      var st = S.load();
      S.remote.configured = !!res.configured;
      S.remote.ok = !!res.ok;
      S.remote.reason = res.reason || '';
      S.remote.keyRequired = !!res.keyRequired;
      if (!res.ok || !res.state) return st;
      var rs = res.state;
      st.answers = mergeById(st.answers, rs.answers || [], answerId);
      st.sessions = mergeById(st.sessions, rs.sessions || [], function (x) { return x.id; });
      if (rs.profile) st.profile = Object.assign({}, st.profile, rs.profile);
      if (rs.settings) st.settings = Object.assign({}, st.settings, rs.settings);
      if (rs.model) st.model = rs.model;
      st.xp = rs.xp || st.xp; st.best = rs.best || st.best;
      if (rs.streak) st.streak = rs.streak;
      S.remote.lastSync = Date.now();
      S.save();
      return st;
    },

    /* pull, then push anything the server has not acknowledged */
    sync: function () {
      var st = S.load();
      if (S.remote.syncing) return Promise.resolve(st);
      S.remote.syncing = true;
      return S.call('GET').then(function (res) {
        S.applyRemote(res);
        if (!res.ok) return st;
        var p = st.pending;
        if ((p.answers && p.answers.length) || (p.sessions && p.sessions.length)) {
          return S.call('POST', { answers: p.answers, sessions: p.sessions }).then(function (r2) {
            if (r2.ok) { st.pending = { sessions: [], answers: [] }; S.applyRemote(r2); }
            return st;
          });
        }
        return st;
      }).catch(function (e) {
        S.remote.ok = false;
        S.remote.reason = 'Could not reach the server (' + e.message + ') — working from this device only.';
        return st;
      }).then(function (r) { S.remote.syncing = false; if (S.onchange) S.onchange(); return r; });
    },

    /* ---------- writes ---------- */
    logSession: function (sess, answers) {
      var st = S.load();
      st.sessions = mergeById(st.sessions, [sess], function (x) { return x.id; });
      st.answers = mergeById(st.answers, answers, answerId);
      st.pending.sessions = mergeById(st.pending.sessions, [sess], function (x) { return x.id; });
      st.pending.answers = mergeById(st.pending.answers, answers, answerId);
      st.xp += answers.reduce(function (acc, a) { return acc + (a.ok ? 10 + a.lv * 2 : 2); }, 0);
      var pct = answers.length ? Math.round(100 * answers.filter(function (a) { return a.ok; }).length / answers.length) : 0;
      if (pct > st.best) st.best = pct;
      if (st.answers.length > 20000) st.answers = st.answers.slice(-20000);
      S.save();
      S.sync();                                  // fire and forget; the queue covers failure
      return pct;
    },

    patch: function (obj) {
      var st = S.load();
      if (obj.profile) Object.assign(st.profile, obj.profile);
      if (obj.settings) Object.assign(st.settings, obj.settings);
      if (obj.model !== undefined) st.model = obj.model;
      S.save();
      return S.call('POST', { patch: obj }).then(function (r) { S.applyRemote(r); return st; })
        .catch(function () { return st; });
    },

    touchStreak: function () {
      var st = S.load(), d = today();
      if (st.streak.last === d) return st.streak.days;
      var yd = today(Date.now() - 86400000);
      st.streak.days = (st.streak.last === yd) ? st.streak.days + 1 : 1;
      st.streak.last = d; S.save();
      return st.streak.days;
    },

    reset: function (alsoServer) {
      S.state = blank(); S.save();
      if (alsoServer) return S.call('DELETE').then(function (r) { S.applyRemote(r); }).catch(function () {});
      return Promise.resolve();
    },

    byTopic: function (topicKey, sinceMs) {
      return S.load().answers.filter(function (a) {
        return (!topicKey || a.tp === topicKey) && (!sinceMs || a.t >= sinceMs);
      });
    },
    today: function () { return today(); },

    exportJSON: function () { return JSON.stringify(S.load(), null, 2); },
    importJSON: function (txt) {
      var o = JSON.parse(txt);
      if (!o || !o.profile || !Array.isArray(o.answers)) throw new Error('That file does not look like Leo’s data.');
      var st = S.load();
      st.answers = mergeById(st.answers, o.answers.map(function (a, i) {
        if (!a.aid) a.aid = (a.sid || 'imp') + ':' + (a.t || i) + ':' + i;
        return a;
      }), answerId);
      st.sessions = mergeById(st.sessions, o.sessions || [], function (x) { return x.id; });
      if (o.profile) Object.assign(st.profile, o.profile);
      if (o.model) st.model = o.model;
      st.pending.answers = st.answers.slice();
      st.pending.sessions = st.sessions.slice();
      S.save();
      return S.sync().then(function () { return st; });
    },

    statusText: function () {
      if (S.remote.configured === null) return { cls: 'wait', text: 'Checking server…' };
      if (S.remote.configured === false) return { cls: 'local', text: 'This device only — server storage is not set up' };
      if (!S.remote.ok) return { cls: 'err', text: S.remote.reason || 'Server unavailable — this device only' };
      var pend = S.load().pending;
      var n = (pend.answers || []).length;
      if (n) return { cls: 'wait', text: n + ' answers waiting to sync' };
      return { cls: 'ok', text: 'Synced' };
    }
  };
  L.store = S;
})(window);
