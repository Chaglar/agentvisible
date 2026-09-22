/* api/progress.js — server-side storage for Leo's practice log.
 *
 * Why it exists: the first version kept everything in localStorage, so the quiz on
 * an iPad and the dashboard on a laptop were two separate universes. This makes the
 * record central, so any device sees the same history.
 *
 * Storage is a Redis-compatible REST store (Vercel KV or Upstash — same API).
 * Configure in the Vercel project:
 *     KV_REST_API_URL   + KV_REST_API_TOKEN          (Vercel KV), or
 *     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *     LEO_ACCESS_KEY    a shared secret the pages must send
 *
 * With no store configured the endpoint reports { configured: false } and the client
 * falls back to local-only storage rather than breaking.
 *
 * GET  /api/progress?profile=leo   -> { ok, configured, state }
 * POST /api/progress               -> merge { profile, answers[], sessions[], writing[], facts[], patch{} }
 * DELETE /api/progress?profile=leo -> wipe that profile
 *
 * Merging is by id and is idempotent, so a retried or duplicated POST cannot
 * double-count a session. Derived values (xp, streak, best) are recomputed from the
 * merged answer log rather than trusted from the client.
 */

const KEY_PREFIX = 'leo:progress:';
const MAX_ANSWERS = 20000;
const MAX_SESSIONS = 2000;
const MAX_WRITING = 500;
const MAX_FACTS = 20000;

function store() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function redis(cmd) {
  const s = store();
  if (!s) throw new Error('no store configured');
  const r = await fetch(s.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error(`store responded ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function blankState() {
  return {
    v: 2,
    profile: { name: 'Leo', dob: '2018-08-15', year: 2, avatar: '🦁', country: 'AU' },
    settings: { sound: true, feedback: 'instant' },
    model: null,
    xp: 0, best: 0,
    streak: { days: 0, last: '' },
    sessions: [],
    answers: [],
    writing: [],
    facts: []
  };
}

function dayOf(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* xp, best and streak are functions of the answer log, so recompute rather than trust */
function derive(state) {
  if (!Array.isArray(state.writing)) state.writing = [];
  if (!Array.isArray(state.facts)) state.facts = [];
  const a = state.answers;
  state.xp = a.reduce((sum, x) => sum + (x.ok ? 10 + (x.lv || 3) * 2 : 2), 0);
  state.best = state.sessions.reduce((m, s) => (s.n ? Math.max(m, Math.round(100 * s.ok / s.n)) : m), 0);
  const days = [...new Set(a.map(x => dayOf(x.t)))].sort();
  let run = 0, last = '';
  for (let i = 0; i < days.length; i++) {
    const prev = i ? new Date(days[i - 1] + 'T00:00:00Z') : null;
    const cur = new Date(days[i] + 'T00:00:00Z');
    run = prev && (cur - prev) === 86400000 ? run + 1 : 1;
    last = days[i];
  }
  // a streak only counts as live if the last active day is today or yesterday
  const today = dayOf(Date.now());
  const yest = dayOf(Date.now() - 86400000);
  state.streak = { days: (last === today || last === yest) ? run : 0, last };
  return state;
}

function mergeById(existing, incoming, idOf) {
  const seen = new Set(existing.map(idOf));
  const out = existing.slice();
  for (const item of incoming) {
    const id = idOf(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  out.sort((x, y) => (x.t || 0) - (y.t || 0));
  return out;
}

function answerId(a) { return a.aid || (a.sid && a.t ? `${a.sid}:${a.t}` : null); }
function factId(f) { return f.fid || (f.fact && f.t ? `${f.fact}:${f.t}` : null); }

function clean(profile) {
  return String(profile || 'leo').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'leo';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const configured = !!store();
  const required = process.env.LEO_ACCESS_KEY || '';
  if (!configured) {
    return res.status(200).json({
      ok: false, configured: false,
      reason: 'No storage configured. Set KV_REST_API_URL and KV_REST_API_TOKEN (or the UPSTASH_* pair) in the Vercel project, then redeploy.'
    });
  }
  if (required) {
    const sent = req.headers['x-leo-key'] || '';
    if (sent !== required) {
      return res.status(401).json({ ok: false, configured: true, reason: 'Wrong or missing access key.' });
    }
  }

  const profile = clean((req.query && req.query.profile) || (req.body && req.body.profile));
  const key = KEY_PREFIX + profile;

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', key]);
      const state = raw ? JSON.parse(raw) : blankState();
      return res.status(200).json({ ok: true, configured: true, keyRequired: !!required, state: derive(state) });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const raw = await redis(['GET', key]);
      const state = raw ? JSON.parse(raw) : blankState();

      state.answers = mergeById(state.answers, body.answers || [], answerId).slice(-MAX_ANSWERS);
      state.sessions = mergeById(state.sessions, body.sessions || [], s => s.id).slice(-MAX_SESSIONS);
      state.writing = mergeById(state.writing || [], body.writing || [], w => w.id).slice(-MAX_WRITING);
      state.facts = mergeById(state.facts || [], body.facts || [], factId).slice(-MAX_FACTS);
      if (body.patch && typeof body.patch === 'object') {
        if (body.patch.profile) Object.assign(state.profile, body.patch.profile);
        if (body.patch.settings) Object.assign(state.settings, body.patch.settings);
        if (body.patch.model !== undefined) state.model = body.patch.model;
      }
      derive(state);
      await redis(['SET', key, JSON.stringify(state)]);
      return res.status(200).json({ ok: true, configured: true, state });
    }

    if (req.method === 'DELETE') {
      await redis(['DEL', key]);
      return res.status(200).json({ ok: true, configured: true, state: derive(blankState()) });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, reason: 'Method not allowed' });
  } catch (e) {
    return res.status(502).json({ ok: false, configured: true, reason: 'Storage error: ' + e.message });
  }
};
