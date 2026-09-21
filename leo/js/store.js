/* store.js — all progress lives in this browser (localStorage). Nothing is sent anywhere.
   Records are deliberately short-keyed: a year of daily practice stays well under the quota. */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var KEY = 'leo.progress.v1';

  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function blank() {
    return {
      v: 1,
      profile: { name: 'Leo', dob: '', year: 2, avatar: '🦁', country: 'AU' },
      settings: { sound: true, feedback: 'instant', theme: 'auto' },
      xp: 0, best: 0,
      streak: { days: 0, last: '' },
      sessions: [],   // {id, mode, t, ms, n, ok, lvEnd}
      answers: []     // {id, t, m, tp, sub, lv, ok, ms, nc}
    };
  }

  var S = {
    KEY: KEY,
    state: null,
    load: function () {
      if (S.state) return S.state;
      try {
        var raw = localStorage.getItem(KEY);
        S.state = raw ? JSON.parse(raw) : blank();
      } catch (e) { S.state = blank(); }
      var b = blank(), k;
      for (k in b) if (S.state[k] === undefined) S.state[k] = b[k];
      for (k in b.profile) if (S.state.profile[k] === undefined) S.state.profile[k] = b.profile[k];
      for (k in b.settings) if (S.state.settings[k] === undefined) S.state.settings[k] = b.settings[k];
      return S.state;
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(S.state)); }
      catch (e) {                                   // quota hit: drop the oldest quarter of the log
        S.state.answers = S.state.answers.slice(Math.floor(S.state.answers.length / 4));
        try { localStorage.setItem(KEY, JSON.stringify(S.state)); } catch (e2) {}
      }
      return S.state;
    },
    reset: function () { S.state = blank(); S.save(); return S.state; },

    touchStreak: function () {
      var st = S.load(), d = today();
      if (st.streak.last === d) return st.streak.days;
      var y = new Date(); y.setDate(y.getDate() - 1);
      var yd = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      st.streak.days = (st.streak.last === yd) ? st.streak.days + 1 : 1;
      st.streak.last = d; S.save();
      return st.streak.days;
    },

    logSession: function (sess, answers) {
      var st = S.load();
      st.sessions.push(sess);
      answers.forEach(function (a) { st.answers.push(a); });
      st.xp += answers.reduce(function (acc, a) { return acc + (a.ok ? 10 + a.lv * 2 : 2); }, 0);
      var pct = answers.length ? Math.round(100 * answers.filter(function (a) { return a.ok; }).length / answers.length) : 0;
      if (pct > st.best) st.best = pct;
      if (st.sessions.length > 400) st.sessions = st.sessions.slice(-400);
      if (st.answers.length > 6000) st.answers = st.answers.slice(-6000);
      S.save();
      return pct;
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
      if (!o || !o.profile || !Array.isArray(o.answers)) throw new Error('Bu dosya Leo verisi gibi görünmüyor.');
      S.state = o; S.save(); return o;
    }
  };
  L.store = S;
})(window);
