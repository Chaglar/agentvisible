/* video.js — the dashboard's "video + QR code" panel.
 *
 * The file goes straight from this browser to a PRIVATE Blob store (api/video.js
 * only hands out a one-off upload permit, so a phone-sized video never passes
 * through a serverless function). What the QR code carries is a random code, not
 * the file's address; the viewer page swaps it for a two-hour signed URL each time.
 * "New link" and "Delete" are therefore real off-switches for paper already handed in.
 */
(function () {
  var L = window.LEO, S = L.store;
  var $ = function (id) { return document.getElementById(id); };
  var API = '/api/video';
  var busy = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function mb(n) { return n ? (n / 1048576).toFixed(n > 104857600 ? 0 : 1) + ' MB' : ''; }
  function when(ts) { var d = new Date(ts); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  function linkFor(code) { return location.origin + '/v/#' + code; }
  function headers() {
    var h = { 'Content-Type': 'application/json' }, k = S.getKey();
    if (k) h['x-leo-key'] = k;
    return h;
  }
  function call(method, body, qs) {
    return fetch(API + (qs || ''), { method: method, headers: headers(), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, reason: 'Server replied ' + r.status }; }); });
  }

  /* An SVG rather than an image: it stays sharp at any print size, and a QR code
     that prints blurry is one a phone will not read. Level M survives a crease. */
  function qrSvg(text) {
    var q = VideoKit.qrcode(0, 'M');
    q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  }

  function say(msg, cls) { var el = $('vidStatus'); el.className = 'vstatus ' + (cls || ''); el.innerHTML = msg; }

  function paintList(videos) {
    if (!videos.length) { $('vidList').innerHTML = '<div class="sub">No video yet.</div>'; return; }
    $('vidList').innerHTML = videos.map(function (v) {
      var url = linkFor(v.code);
      return '<div class="vitem" data-code="' + esc(v.code) + '">' +
        '<div class="vqr">' + qrSvg(url) + '</div>' +
        '<div class="vbody">' +
          '<input class="vtitle" value="' + esc(v.title) + '" aria-label="Title" maxlength="120">' +
          '<textarea class="vnote" rows="2" maxlength="600" aria-label="Note under the video" placeholder="A line under the video (optional)">' + esc(v.note) + '</textarea>' +
          '<div class="sub">' + when(v.t) + (v.size ? ' · ' + mb(v.size) : '') +
            (v.rotated ? ' · link renewed ' + when(v.rotated) : '') + '</div>' +
          '<a class="vlink" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a>' +
          '<div class="vbtns">' +
            '<button class="btn pri" data-act="print">🖨 Print QR card</button>' +
            '<button class="btn" data-act="copy">Copy link</button>' +
            '<button class="btn" data-act="rotate" title="Old QR codes stop working">New link</button>' +
            '<button class="btn danger" data-act="del">Delete</button>' +
          '</div>' +
        '</div></div>';
    }).join('');
  }

  function load() {
    if (!$('vidPanel')) return;
    call('GET').then(function (j) {
      var c = j.configured || {};
      if (!j.ok) {
        $('vidForm').classList.add('hide');
        say('⚠ ' + esc(j.reason || 'Not available.'), 'warn');
        $('vidList').innerHTML = '';
        return;
      }
      $('vidForm').classList.remove('hide');
      say('✓ Ready. Videos are stored privately; only the QR link opens them.', 'ok');
      paintList(j.videos || []);
    }).catch(function () { say('⚠ The video service did not answer.', 'warn'); });
  }

  function upload() {
    if (busy) return;
    var f = $('vidFile').files[0];
    if (!f) { say('⚠ Choose a video file first.', 'warn'); return; }
    busy = true;
    $('vidGo').disabled = true;
    $('vidBar').classList.remove('hide');
    var safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'video.mp4';
    VideoKit.upload('leo-video/' + safe, f, {
      access: 'private',
      handleUploadUrl: API,
      headers: S.getKey() ? { 'x-leo-key': S.getKey() } : {},
      contentType: f.type || undefined,
      multipart: f.size > 50 * 1048576,
      onUploadProgress: function (p) {
        $('vidBar').firstChild.style.width = p.percentage + '%';
        say('Uploading… ' + Math.round(p.percentage) + '% of ' + mb(f.size));
      }
    }).then(function (b) {
      return call('POST', { op: 'save', pathname: b.pathname, url: b.url, size: f.size,
        title: $('vidTitle').value, note: $('vidNote').value });
    }).then(function (j) {
      if (!j.ok) throw new Error(j.reason);
      $('vidFile').value = ''; $('vidNote').value = '';
      load();
    }).catch(function (e) {
      say('⚠ Upload failed: ' + esc(e.message || e), 'warn');
    }).then(function () {
      busy = false; $('vidGo').disabled = false;
      $('vidBar').classList.add('hide'); $('vidBar').firstChild.style.width = '0';
    });
  }

  /* The card: big code, the title, one instruction. Printed on its own — the
     body class takes everything else off the page for the length of the print. */
  function printCard(item) {
    var code = item.dataset.code, url = linkFor(code);
    $('qrPrint').innerHTML = '<div class="qcard">' +
      '<div class="qq">' + qrSvg(url) + '</div>' +
      '<div class="qt">' + esc(item.querySelector('.vtitle').value) + '</div>' +
      '<div class="qs">Scan with a phone camera to watch</div>' +
      '<div class="qu">' + esc(url) + '</div></div>';
    document.body.classList.add('pq');
    window.print();
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('pq'); });

  document.addEventListener('click', function (e) {
    if (e.target.closest('#vidGo')) return upload();
    var b = e.target.closest('#vidList [data-act]'); if (!b) return;
    var item = b.closest('.vitem'), code = item.dataset.code, act = b.dataset.act;
    if (act === 'print') return printCard(item);
    if (act === 'copy') {
      if (navigator.clipboard) navigator.clipboard.writeText(linkFor(code)).catch(function () {});
      b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1500);
      return;
    }
    if (act === 'rotate') {
      if (!confirm('Make a new link? Every QR code already printed or sent will stop working within two hours.')) return;
      call('POST', { op: 'rotate', v: code }).then(load);
      return;
    }
    if (act === 'del') {
      if (!confirm('Delete this video? The file is removed and every QR code for it stops working.')) return;
      call('DELETE', null, '?v=' + encodeURIComponent(code)).then(load);
    }
  });
  document.addEventListener('change', function (e) {
    var item = e.target.closest && e.target.closest('#vidList .vitem');
    if (!item || !e.target.matches('.vtitle,.vnote')) return;
    call('POST', { op: 'edit', v: item.dataset.code,
      title: item.querySelector('.vtitle').value, note: item.querySelector('.vnote').value });
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'vidFile' || !e.target.files[0]) return;
    var f = e.target.files[0];
    say('Selected ' + esc(f.name) + ' · ' + mb(f.size) +
      (f.size > 1024 * 1048576 ? ' — <b>over the 1 GB limit</b>; record at 1080p or trim it.' : ''),
      f.size > 1024 * 1048576 ? 'warn' : '');
  });

  function init() {
    if (!$('vidPanel')) return;
    var name = (S.load().profile || {}).name || 'Leo';
    if (!$('vidTitle').value) $('vidTitle').value = name + ' — a short introduction';
    load();
  }
  L.video = { load: load, qrSvg: qrSvg, linkFor: linkFor };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
