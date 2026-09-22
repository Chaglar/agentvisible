/* dev-server.js — local development only. Serves the static site and runs the real
 * api/progress.js against an in-memory stand-in for the key-value store, so the
 * server-sync path can be exercised without provisioning anything.
 *
 *   node dev-server.js          then open http://localhost:8788/leo/
 *   WITH_KEY=1 node dev-server.js   to also require the access key ("secret123")
 *
 * Vercel only executes files under api/, so this file is never deployed as a function.
 */
const http = require('http'), fs = require('fs'), path = require('path');
const KV = new Map();

const kv = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c);
  req.on('end', () => {
    const cmd = JSON.parse(b); let result = null;
    if (cmd[0] === 'GET') result = KV.has(cmd[1]) ? KV.get(cmd[1]) : null;
    if (cmd[0] === 'SET') { KV.set(cmd[1], cmd[2]); result = 'OK'; }
    if (cmd[0] === 'DEL') { KV.delete(cmd[1]); result = 1; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
  });
});

kv.listen(0, () => {
  process.env.KV_REST_API_URL = 'http://127.0.0.1:' + kv.address().port;
  process.env.KV_REST_API_TOKEN = 'dev';
  if (process.env.WITH_KEY) process.env.LEO_ACCESS_KEY = 'secret123';
  const api = require('./api/progress.js');

  const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname.replace(/\/+$/, '').endsWith('/api/progress')) {
      let body = ''; req.on('data', c => body += c);
      req.on('end', () => {
        let parsed = {};
        try { parsed = body ? JSON.parse(body) : {}; } catch (e) {}
        api({ method: req.method, query: Object.fromEntries(u.searchParams), body: parsed, headers: req.headers }, {
          _s: 200,
          setHeader() {}, status(c) { this._s = c; return this; },
          json(o) { res.writeHead(this._s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }
        });
      });
      return;
    }
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(process.cwd(), p), (e, d) => {
      if (e) { res.writeHead(404); return res.end('not found ' + p); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      res.end(d);
    });
  }).listen(8788, () => console.log('dev server on http://localhost:8788/leo/  (api live, in-memory store)'));
});
