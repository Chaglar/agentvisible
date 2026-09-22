/* charts.js — small hand-rolled SVG charts for the dashboard.
   One measure per axis, recessive grid, thin marks, hover tooltip on every plot,
   and a table alongside every chart in the page itself. */
(function (root) {
  var C = {};
  var S1 = 'var(--s1)', S2 = 'var(--s2)', LINE = 'var(--line)', MUT = 'var(--mut)', INK = 'var(--ink)', FAINT = 'var(--faint)';

  var tip = null;
  function tipEl() {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    return tip;
  }
  function showTip(html, x, y) {
    var t = tipEl(); t.innerHTML = html; t.style.opacity = '1';
    var w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px';
    t.style.top = Math.max(8, y - h - 12) + 'px';
  }
  function hideTip() { if (tip) tip.style.opacity = '0'; }
  C.hideTip = hideTip;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.size || 11.5) +
      '" font-weight="' + (o.w || 600) + '" fill="' + (o.fill || MUT) + '">' + esc(s) + '</text>';
  }

  /* ---------- line chart with an uncertainty band ---------- */
  C.line = function (el, cfg) {
    var pts = cfg.points;
    if (!pts.length) { el.innerHTML = '<div class="empty">No data yet.</div>'; return; }
    var W = 720, H = 240, pad = { l: 44, r: 16, t: 16, b: 34 };
    var ymin = cfg.yMin, ymax = cfg.yMax;
    var X = function (i) { return pad.l + (W - pad.l - pad.r) * (pts.length === 1 ? .5 : i / (pts.length - 1)); };
    var Y = function (v) { return pad.t + (H - pad.t - pad.b) * (1 - (v - ymin) / (ymax - ymin)); };
    var out = '';
    (cfg.ticks || []).forEach(function (tk) {
      out += '<line x1="' + pad.l + '" y1="' + Y(tk.v) + '" x2="' + (W - pad.r) + '" y2="' + Y(tk.v) +
        '" stroke="' + (tk.strong ? MUT : LINE) + '" stroke-width="1"' + (tk.strong ? ' stroke-dasharray="5 4"' : '') + '/>';
      out += txt(pad.l - 8, Y(tk.v) + 4, tk.label, { a: 'end', size: 11 });
    });
    if (pts[0].lo != null) {                               // ±1 SE ribbon
      var up = pts.map(function (p, i) { return X(i) + ',' + Y(Math.min(ymax, p.hi)); });
      var dn = pts.map(function (p, i) { return X(i) + ',' + Y(Math.max(ymin, p.lo)); }).reverse();
      out += '<polygon points="' + up.concat(dn).join(' ') + '" fill="' + S1 + '" opacity=".13"/>';
    }
    out += '<polyline points="' + pts.map(function (p, i) { return X(i) + ',' + Y(p.y); }).join(' ') +
      '" fill="none" stroke="' + S1 + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach(function (p, i) {
      out += '<circle cx="' + X(i) + '" cy="' + Y(p.y) + '" r="4.5" fill="' + S1 + '" stroke="var(--card)" stroke-width="2"/>';
    });
    // x labels: first, last and a few between
    var every = Math.max(1, Math.ceil(pts.length / 7));
    pts.forEach(function (p, i) {
      if (i % every === 0 || i === pts.length - 1) out += txt(X(i), H - 10, p.label, { size: 11 });
    });
    // direct label on the last point
    var last = pts[pts.length - 1];
    out += txt(X(pts.length - 1), Y(last.y) - 12, cfg.format ? cfg.format(last.y) : last.y, { size: 12, w: 700, fill: INK });
    out += '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + (W - pad.l - pad.r) + '" height="' + (H - pad.t - pad.b) +
      '" fill="transparent" class="hit"/>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' + out + '</svg>';

    var svg = el.querySelector('svg'), cross = null;
    svg.addEventListener('mousemove', function (e) {
      var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
      var i = Math.round((px - pad.l) / (W - pad.l - pad.r) * (pts.length - 1));
      i = Math.max(0, Math.min(pts.length - 1, i));
      var p = pts[i];
      if (cross) cross.remove();
      cross = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i));
      cross.setAttribute('y1', pad.t); cross.setAttribute('y2', H - pad.b);
      cross.setAttribute('stroke', MUT); cross.setAttribute('stroke-width', '1'); cross.setAttribute('stroke-dasharray', '4 4');
      svg.insertBefore(cross, svg.firstChild);
      showTip('<b>' + esc(p.full || p.label) + '</b>' + (p.tip || (cfg.format ? cfg.format(p.y) : p.y)),
        r.left + X(i) / W * r.width, r.top + Y(p.y) / H * r.height);
    });
    svg.addEventListener('mouseleave', function () { hideTip(); if (cross) { cross.remove(); cross = null; } });
  };

  /* ---------- several series on one shared axis ---------- */
  C.lines = function (el, cfg) {
    var series = cfg.series.filter(function (s) { return s.points.length; });
    if (!series.length) { el.innerHTML = '<div class="empty">No data yet.</div>'; return; }
    var n = Math.max.apply(null, series.map(function (s) { return s.points.length; }));
    var W = 720, H = 240, pad = { l: 34, r: 74, t: 16, b: 34 };
    var X = function (i) { return pad.l + (W - pad.l - pad.r) * (n === 1 ? .5 : i / (n - 1)); };
    var Y = function (v) { return pad.t + (H - pad.t - pad.b) * (1 - (v - cfg.yMin) / (cfg.yMax - cfg.yMin)); };
    var out = '';
    (cfg.ticks || []).forEach(function (t2) {
      out += '<line x1="' + pad.l + '" y1="' + Y(t2) + '" x2="' + (W - pad.r) + '" y2="' + Y(t2) +
        '" stroke="' + LINE + '" stroke-width="1"/>' + txt(pad.l - 8, Y(t2) + 4, String(t2), { a: 'end', size: 11 });
    });
    series.forEach(function (s2, si) {
      out += '<polyline points="' + s2.points.map(function (p, i) { return X(i) + ',' + Y(p.y); }).join(' ') +
        '" fill="none" stroke="' + s2.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      s2.points.forEach(function (p, i) {
        out += '<circle cx="' + X(i) + '" cy="' + Y(p.y) + '" r="4" fill="' + s2.color +
          '" stroke="var(--card)" stroke-width="2"><title>' + esc(s2.label + ': ' + p.y + (p.label ? ' · ' + p.label : '')) + '</title></circle>';
      });
      var last = s2.points[s2.points.length - 1];
      out += txt(X(s2.points.length - 1) + 9, Y(last.y) + 4, s2.label, { a: 'start', size: 11.5, w: 700, fill: s2.color });
    });
    var every = Math.max(1, Math.ceil(n / 6));
    (series[0].points || []).forEach(function (p, i) {
      if (i % every === 0 || i === n - 1) out += txt(X(i), H - 10, p.label || '', { size: 11 });
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' + out + '</svg>';
  };

  /* ---------- horizontal bars (topic percentiles) ---------- */
  C.hbar = function (el, cfg) {
    var rows = cfg.rows;
    if (!rows.length) { el.innerHTML = '<div class="empty">No data yet.</div>'; return; }
    var rowH = 30, labelW = 176, W = 720, H = rows.length * rowH + 30, max = cfg.max || 100;
    var X = function (v) { return labelW + (W - labelW - 46) * v / max; };
    var out = '';
    (cfg.gridAt || [25, 50, 75, 100]).forEach(function (g) {
      out += '<line x1="' + X(g) + '" y1="4" x2="' + X(g) + '" y2="' + (rows.length * rowH + 6) + '" stroke="' + LINE + '" stroke-width="1"/>';
      out += txt(X(g), rows.length * rowH + 22, String(g), { size: 10.5 });
    });
    if (cfg.ref != null) {
      out += '<line x1="' + X(cfg.ref) + '" y1="0" x2="' + X(cfg.ref) + '" y2="' + (rows.length * rowH + 6) +
        '" stroke="' + MUT + '" stroke-width="1.5" stroke-dasharray="5 4"/>';
      out += txt(X(cfg.ref), -4, cfg.refLabel || '', { size: 10.5, w: 700 });
    }
    rows.forEach(function (r, i) {
      var y = i * rowH + 10, w = Math.max(3, X(r.value) - labelW);
      out += txt(labelW - 10, y + 12, r.label, { a: 'end', size: 12, fill: INK, w: 600 });
      out += '<rect x="' + labelW + '" y="' + y + '" width="' + (W - labelW - 46) + '" height="16" rx="4" fill="' + FAINT + '"/>';
      out += '<rect x="' + labelW + '" y="' + y + '" width="' + w + '" height="16" rx="4" fill="' + (r.color || S1) + '" class="hb" data-i="' + i + '"/>';
      out += txt(X(r.value) + 8, y + 12.5, r.valueLabel != null ? r.valueLabel : r.value, { a: 'start', size: 11.5, w: 700, fill: INK });
    });
    el.innerHTML = '<svg viewBox="0 -10 ' + W + ' ' + (H + 10) + '">' + out + '</svg>';
    Array.prototype.forEach.call(el.querySelectorAll('.hb'), function (b) {
      b.addEventListener('mousemove', function (e) { showTip(rows[+b.dataset.i].tip || rows[+b.dataset.i].label, e.clientX, e.clientY); });
      b.addEventListener('mouseleave', hideTip);
    });
  };

  /* ---------- vertical bars + an expectation line (same % axis) ---------- */
  C.barLine = function (el, cfg) {
    var bars = cfg.bars;
    if (!bars.some(function (b) { return b.n; })) { el.innerHTML = '<div class="empty">No data yet.</div>'; return; }
    var W = 720, H = 250, pad = { l: 42, r: 14, t: 18, b: 44 }, n = bars.length;
    var slot = (W - pad.l - pad.r) / n, bw = Math.min(64, slot - 16);
    var Y = function (v) { return pad.t + (H - pad.t - pad.b) * (1 - v / 100); };
    var out = '';
    [0, 25, 50, 75, 100].forEach(function (g) {
      out += '<line x1="' + pad.l + '" y1="' + Y(g) + '" x2="' + (W - pad.r) + '" y2="' + Y(g) + '" stroke="' + LINE + '" stroke-width="1"/>';
      out += txt(pad.l - 8, Y(g) + 4, g + '%', { a: 'end', size: 11 });
    });
    bars.forEach(function (b, i) {
      var cx = pad.l + slot * i + slot / 2;
      if (b.n) {
        out += '<rect x="' + (cx - bw / 2) + '" y="' + Y(b.value) + '" width="' + bw + '" height="' + (Y(0) - Y(b.value)) +
          '" rx="4" fill="' + S1 + '" class="vb" data-i="' + i + '"/>';
        out += txt(cx, Y(b.value) - 7, Math.round(b.value) + '%', { size: 11.5, w: 700, fill: 'var(--ink)' });
      }
      out += txt(cx, H - 24, b.label, { size: 11.5, fill: 'var(--ink)', w: 600 });
      out += txt(cx, H - 9, b.n ? b.n + ' questions' : '—', { size: 10.5 });
    });
    var lp = bars.map(function (b, i) { return (pad.l + slot * i + slot / 2) + ',' + Y(b.expected); });
    out += '<polyline points="' + lp.join(' ') + '" fill="none" stroke="' + S2 + '" stroke-width="2" stroke-dasharray="6 4"/>';
    bars.forEach(function (b, i) {
      out += '<circle cx="' + (pad.l + slot * i + slot / 2) + '" cy="' + Y(b.expected) + '" r="4" fill="' + S2 + '" stroke="var(--card)" stroke-width="1.5"/>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' + out + '</svg>';
    Array.prototype.forEach.call(el.querySelectorAll('.vb'), function (b) {
      var d = bars[+b.dataset.i];
      b.addEventListener('mousemove', function (e) {
        showTip('<b>' + esc(d.label) + '</b>Actual: ' + Math.round(d.value) + '% · Model expects: ' + Math.round(d.expected) + '%<br>' + d.n + ' questions', e.clientX, e.clientY);
      });
      b.addEventListener('mouseleave', hideTip);
    });
  };

  /* ---------- daily activity strip ---------- */
  C.days = function (el, cfg) {
    var d = cfg.days, max = Math.max(1, Math.max.apply(null, d.map(function (x) { return x.n; })));
    var W = 720, H = 110, slot = W / d.length, bw = Math.min(26, slot - 5);
    var out = '';
    d.forEach(function (x, i) {
      var h = x.n ? Math.max(3, (H - 40) * x.n / max) : 0, cx = slot * i + slot / 2;
      out += '<rect x="' + (cx - bw / 2) + '" y="' + (H - 28 - h) + '" width="' + bw + '" height="' + h + '" rx="4" fill="' +
        (x.n ? S1 : LINE) + '" class="db" data-i="' + i + '"/>';
      if (i % Math.ceil(d.length / 7) === 0) out += txt(cx, H - 10, x.label, { size: 10.5 });
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' + out + '</svg>';
    Array.prototype.forEach.call(el.querySelectorAll('.db'), function (b) {
      var x = d[+b.dataset.i];
      b.addEventListener('mousemove', function (e) { showTip('<b>' + esc(x.full) + '</b>' + x.n + ' questions', e.clientX, e.clientY); });
      b.addEventListener('mouseleave', hideTip);
    });
  };

  root.LEO = root.LEO || {}; root.LEO.charts = C;
})(window);
