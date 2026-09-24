/* api/video.js — one private video, reachable only through a link that can be withdrawn.
 *
 * Why it is built this way: the video is of a child, and the link will be printed as a
 * QR code on paper that leaves the house. So:
 *
 *   - the file sits in a PRIVATE Vercel Blob store — its own URL returns nothing;
 *   - the QR code carries a random code, not the file's address. Each time the page
 *     is opened, the code is swapped here for a signed URL that dies after two hours;
 *   - delete the code (or issue a new one) and every printed QR code stops working
 *     within two hours, even for someone who copied the video address out of the page;
 *   - the code travels in the #fragment, which the browser never sends to any server,
 *     so it does not land in access logs or referrer headers.
 *
 * Configure in the Vercel project:
 *     BLOB_READ_WRITE_TOKEN   set automatically when a Blob store is connected
 *                             (create the store as PRIVATE)
 *     KV_REST_API_URL / _TOKEN  (or the UPSTASH_* pair) — same store as api/progress.js
 *     LEO_ACCESS_KEY          REQUIRED here. Without it anyone could upload to the store,
 *                             so uploading is refused until it is set.
 *
 * GET    /api/video?v=CODE        public: { ok, title, note, kind, src, until }  (src is signed; kind is 'video' or 'pdf')
 * GET    /api/video               key:    { ok, configured, videos[] }
 * POST   /api/video  {type:'blob.generate-client-token', ...}   key: upload handshake
 * POST   /api/video  {op:'save', pathname, url, title, note, size}   key: -> { code }
 * POST   /api/video  {op:'rotate', v}                                key: new code, old one dies
 * POST   /api/video  {op:'edit', v, title, note}                     key
 * DELETE /api/video?v=CODE        key: deletes the file as well as the code
 */

const crypto = require('crypto');

const INDEX = 'leo:videos';
const WATCH_MS = 2 * 3600 * 1000;
const MAX_BYTES = 1024 * 1024 * 1024;
const TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'application/pdf'];
/* A PDF (a report, say) travels the same road as a video: private file, withdrawable code. */
function kindOf(pathname) { return /\.pdf$/i.test(pathname || '') ? 'pdf' : 'video'; }

/* The Blob SDK is reached through here so dev-server.js can stand in for it. */
const blob = {
  handleUpload: (...a) => require('@vercel/blob/client').handleUpload(...a),
  issueSignedToken: (...a) => require('@vercel/blob').issueSignedToken(...a),
  presignUrl: (...a) => require('@vercel/blob').presignUrl(...a),
  del: (...a) => require('@vercel/blob').del(...a)
};

function kvConf() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function redis(cmd) {
  const s = kvConf();
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

async function readIndex() {
  const raw = await redis(['GET', INDEX]);
  return raw ? JSON.parse(raw) : {};
}
async function writeIndex(ix) { await redis(['SET', INDEX, JSON.stringify(ix)]); }

function newCode() { return crypto.randomBytes(12).toString('base64url'); }
function cleanCode(v) { return String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32); }
function text(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n); }

function keyOk(req) {
  const need = process.env.LEO_ACCESS_KEY || '';
  if (!need) return false;
  const sent = String(req.headers['x-leo-key'] || '');
  const a = Buffer.from(sent), b = Buffer.from(need);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function configured() {
  return {
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    store: !!kvConf(),
    key: !!process.env.LEO_ACCESS_KEY
  };
}

async function signedSrc(pathname) {
  const until = Date.now() + WATCH_MS;
  const tok = await blob.issueSignedToken({ pathname, operations: ['get'], validUntil: until });
  const { presignedUrl } = await blob.presignUrl(tok, { operation: 'get', pathname, access: 'private' });
  return { src: presignedUrl, until };
}

function publicView(code, v) {
  return { code, title: v.title, note: v.note, size: v.size || 0, t: v.t, rotated: v.rotated || 0, kind: kindOf(v.pathname) };
}

async function main(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const conf = configured();
  const q = req.query || {};

  if (!conf.store || !conf.blob) {
    return res.status(200).json({
      ok: false, configured: conf,
      reason: !conf.blob
        ? 'No Blob store connected. In Vercel: Storage → Create → Blob, choose Private, connect it to this project, then redeploy.'
        : 'No key-value store configured (the same one the progress sync uses).'
    });
  }

  /* ---- the one public call: a code in, a short-lived address out ---- */
  if (req.method === 'GET' && q.v) {
    const code = cleanCode(q.v);
    const ix = await readIndex();
    const v = ix[code];
    // 200 rather than 404: the page shows its own message, and a code that never
    // existed looks exactly like one that was withdrawn.
    if (!v) return res.status(200).json({ ok: false, reason: 'This link has been withdrawn or never existed.' });
    const s = await signedSrc(v.pathname);
    return res.status(200).json({ ok: true, title: v.title, note: v.note, kind: kindOf(v.pathname), src: s.src, until: s.until });
  }

  /* ---- everything else is the parent's, and needs the key. A GET is the panel
     asking what state it is in, so it is answered with 200 and a reason. ---- */
  const soft = req.method === 'GET' ? 200 : 0;
  if (!conf.key) {
    return res.status(soft || 403).json({ ok: false, configured: conf,
      reason: 'Set LEO_ACCESS_KEY in the Vercel project first. Without it anyone could upload to your Blob store.' });
  }
  if (!keyOk(req)) return res.status(soft || 401).json({ ok: false, configured: conf, reason: 'Wrong or missing access key.' });

  if (req.method === 'GET') {
    const ix = await readIndex();
    const videos = Object.keys(ix).map(c => publicView(c, ix[c])).sort((a, b) => b.t - a.t);
    return res.status(200).json({ ok: true, configured: conf, videos });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (req.method === 'POST' && body.type === 'blob.generate-client-token') {
    const out = await blob.handleUpload({
      request: req, body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: TYPES,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true
      })
    });
    return res.status(200).json(out);
  }

  if (req.method === 'POST' && body.op === 'save') {
    const pathname = text(body.pathname, 300);
    if (!/^leo-video\//.test(pathname)) return res.status(400).json({ ok: false, reason: 'Unexpected file path.' });
    const ix = await readIndex();
    const code = newCode();
    ix[code] = {
      pathname, url: text(body.url, 600),
      title: text(body.title, 120) || 'A short video',
      note: text(body.note, 600),
      size: Number(body.size) || 0,
      t: Date.now()
    };
    await writeIndex(ix);
    return res.status(200).json({ ok: true, code, video: publicView(code, ix[code]) });
  }

  if (req.method === 'POST' && body.op === 'rotate') {
    const old = cleanCode(body.v);
    const ix = await readIndex();
    if (!ix[old]) return res.status(404).json({ ok: false, reason: 'No such link.' });
    const code = newCode();
    ix[code] = Object.assign({}, ix[old], { rotated: Date.now() });
    delete ix[old];
    await writeIndex(ix);
    return res.status(200).json({ ok: true, code, video: publicView(code, ix[code]) });
  }

  if (req.method === 'POST' && body.op === 'edit') {
    const code = cleanCode(body.v);
    const ix = await readIndex();
    if (!ix[code]) return res.status(404).json({ ok: false, reason: 'No such link.' });
    if (body.title != null) ix[code].title = text(body.title, 120) || ix[code].title;
    if (body.note != null) ix[code].note = text(body.note, 600);
    await writeIndex(ix);
    return res.status(200).json({ ok: true, code, video: publicView(code, ix[code]) });
  }

  if (req.method === 'DELETE') {
    const code = cleanCode(q.v);
    const ix = await readIndex();
    const v = ix[code];
    if (!v) return res.status(404).json({ ok: false, reason: 'No such link.' });
    delete ix[code];
    await writeIndex(ix);
    // Another code may still point at the same file (none do today, but check).
    const shared = Object.keys(ix).some(c => ix[c].pathname === v.pathname);
    if (!shared && v.url) { try { await blob.del(v.url); } catch (e) { /* the code is gone either way */ } }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ ok: false, reason: 'Method not allowed' });
}

module.exports = async (req, res) => {
  try { return await main(req, res); }
  catch (e) { return res.status(502).json({ ok: false, reason: 'Video service error: ' + e.message }); }
};
module.exports.blob = blob;
