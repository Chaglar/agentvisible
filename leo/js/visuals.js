/* visuals.js — every question picture is an inline SVG built here.
   Colours come from CSS custom properties so light/dark both work.
   LEO.vis.render(spec) -> svg string.  spec.type selects the renderer. */
(function (root) {
  var V = {};
  var STROKE = 'var(--vstroke)', LINE = 'var(--line)', FAINT = 'var(--vfaint)',
      PAPER = 'var(--vpaper)', MUT = 'var(--mut)';
  var C = ['var(--v1)', 'var(--v2)', 'var(--v3)', 'var(--v4)', 'var(--v5)', 'var(--v6)'];
  V.C = C;

  function S(w, h, inner) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h +
      '" role="img" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' + inner + '</svg>';
  }
  function t(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') +
      '" font-size="' + (o.size || 15) + '" font-weight="' + (o.w || 600) +
      '" fill="' + (o.fill || STROKE) + '" font-family="ui-rounded,system-ui,sans-serif"' +
      (o.dy ? ' dy="' + o.dy + '"' : '') + '>' + s + '</text>';
  }
  function emoji(x, y, s, size) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-size="' +
      (size || 26) + '">' + s + '</text>';
  }
  function poly(n, cx, cy, r, rot) {
    var p = [], i, a;
    for (i = 0; i < n; i++) { a = (Math.PI * 2 * i / n) - Math.PI / 2 + (rot || 0); p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  function arcSlice(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0),
        x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1),
        big = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M' + cx + ' ' + cy + ' L' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
      ' A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z';
  }

  /* ---------------- fractions ---------------- */
  // {shape:'circle'|'bar'|'grid', parts, shaded (n or array of idx), color}
  V.fracShape = function (s) {
    var parts = s.parts, col = s.color || C[1], sh = s.shaded, on = [];
    if (Array.isArray(sh)) on = sh; else for (var i = 0; i < sh; i++) on.push(i);
    var isOn = function (i) { return on.indexOf(i) >= 0; };
    if (s.shape === 'circle') {
      var r = 62, cx = 72, cy = 72, out = '', a;
      for (var k = 0; k < parts; k++) {
        a = -Math.PI / 2 + Math.PI * 2 * k / parts;
        out += '<path d="' + arcSlice(cx, cy, r, a, a + Math.PI * 2 / parts) + '" fill="' +
          (isOn(k) ? col : PAPER) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      }
      return S(144, 144, out);
    }
    if (s.shape === 'grid') {
      var cols = s.cols || Math.ceil(Math.sqrt(parts)), rows = Math.ceil(parts / cols),
          cw = 38, o2 = '';
      for (var g = 0; g < parts; g++) {
        var gx = (g % cols) * cw, gy = Math.floor(g / cols) * cw;
        o2 += '<rect x="' + (gx + 1) + '" y="' + (gy + 1) + '" width="' + (cw - 2) + '" height="' + (cw - 2) +
          '" rx="3" fill="' + (isOn(g) ? col : PAPER) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      }
      return S(cols * cw, rows * cw, o2);
    }
    // bar
    var W = s.w || 300, H = 58, pw = W / parts, o3 = '';
    for (var b = 0; b < parts; b++) {
      o3 += '<rect x="' + (b * pw) + '" y="1" width="' + pw + '" height="' + (H - 2) +
        '" fill="' + (isOn(b) ? col : PAPER) + '" stroke="' + STROKE + '" stroke-width="2"/>';
    }
    return S(W, H, o3);
  };

  // fraction on a number line {den, mark, whole}
  V.fracLine = function (s) {
    var W = 320, y = 48, den = s.den, x0 = 22, x1 = W - 22, out = '';
    out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + STROKE + '" stroke-width="3"/>';
    for (var i = 0; i <= den; i++) {
      var x = x0 + (x1 - x0) * i / den, big = (i === 0 || i === den);
      out += '<line x1="' + x + '" y1="' + (y - (big ? 14 : 8)) + '" x2="' + x + '" y2="' + (y + (big ? 14 : 8)) +
        '" stroke="' + STROKE + '" stroke-width="' + (big ? 3 : 2) + '"/>';
      if (big) out += t(x, y + 32, i === 0 ? '0' : '1');
    }
    if (s.mark != null) {
      var mx = x0 + (x1 - x0) * s.mark / den;
      out += '<path d="M' + mx + ' ' + (y - 20) + ' l-7 -12 l14 0 z" fill="' + C[1] + '"/>';
      out += t(mx, y - 36, s.label || '?', { fill: C[1], size: 17, w: 800 });
    }
    return S(W, 88, out);
  };

  /* ---------------- multiplication ---------------- */
  V.array = function (s) {                     // rows x cols of dots/emoji
    var r = s.rows, c = s.cols, cell = s.cell || 30, out = '', pad = 14;
    for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) {
      var x = pad + j * cell + cell / 2, y = pad + i * cell + cell / 2;
      out += s.sym ? emoji(x, y, s.sym, cell * 0.78)
        : '<circle cx="' + x + '" cy="' + y + '" r="' + (cell * 0.32) + '" fill="' + (s.color || C[0]) + '"/>';
    }
    return S(pad * 2 + c * cell, pad * 2 + r * cell, out);
  };

  V.groups = function (s) {                    // g groups of n things, each in a ring
    var g = s.groups, n = s.per, per = Math.min(n, 4), cols = Math.min(g, 4),
        bw = 96, bh = 86, rows = Math.ceil(g / cols), out = '';
    for (var k = 0; k < g; k++) {
      var gx = (k % cols) * bw + 6, gy = Math.floor(k / cols) * bh + 6;
      out += '<rect x="' + gx + '" y="' + gy + '" width="' + (bw - 12) + '" height="' + (bh - 12) +
        '" rx="16" fill="' + FAINT + '" stroke="' + LINE + '" stroke-width="2"/>';
      for (var i = 0; i < n; i++) {
        var cx = gx + 16 + (i % per) * ((bw - 34) / Math.max(per - 1, 1)) * (per > 1 ? 1 : 0) + (per === 1 ? (bw - 12) / 2 - 16 : 0),
            cy = gy + 24 + Math.floor(i / per) * 24;
        out += emoji(cx, cy, s.sym || '🍎', 20);
      }
    }
    return S(cols * bw, rows * bh, out);
  };

  V.skip = function (s) {                      // skip-counting arcs: 0,7,14,21...
    var step = s.step, jumps = s.jumps, W = 340, y = 78, x0 = 24, x1 = W - 20, out = '';
    out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + STROKE + '" stroke-width="3"/>';
    for (var i = 0; i <= jumps; i++) {
      var x = x0 + (x1 - x0) * i / jumps;
      out += '<line x1="' + x + '" y1="' + (y - 7) + '" x2="' + x + '" y2="' + (y + 7) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      var lab = (i === jumps && s.hideLast) ? '?' : String(step * i);
      out += t(x, y + 26, lab, { size: 14, fill: (lab === '?' ? C[1] : STROKE), w: lab === '?' ? 800 : 600 });
      if (i < jumps) {
        var xn = x0 + (x1 - x0) * (i + 1) / jumps, mid = (x + xn) / 2;
        out += '<path d="M' + x + ' ' + (y - 4) + ' Q' + mid + ' ' + (y - 42) + ' ' + xn + ' ' + (y - 4) +
          '" fill="none" stroke="' + C[0] + '" stroke-width="2.5"/>';
        out += t(mid, y - 30, '+' + step, { size: 12, fill: C[0], w: 700 });
      }
    }
    return S(W, 112, out);
  };

  /* ---------------- number / place value ---------------- */
  V.mab = function (s) {                       // base-10 blocks
    var out = '', x = 6, u = 9;
    for (var h = 0; h < (s.h || 0); h++) {
      var bx = x, by = 10, i, j;
      for (i = 0; i < 10; i++) for (j = 0; j < 10; j++)
        out += '<rect x="' + (bx + j * u) + '" y="' + (by + i * u) + '" width="' + (u - 1) + '" height="' + (u - 1) + '" fill="' + C[0] + '" opacity=".9"/>';
      out += '<rect x="' + bx + '" y="' + by + '" width="' + (u * 10) + '" height="' + (u * 10) + '" fill="none" stroke="' + STROKE + '" stroke-width="2"/>';
      x += u * 10 + 12;
    }
    for (var tn = 0; tn < (s.t || 0); tn++) {
      var tx = x, ty = 10;
      for (var q = 0; q < 10; q++) out += '<rect x="' + tx + '" y="' + (ty + q * u) + '" width="' + (u - 1) + '" height="' + (u - 1) + '" fill="' + C[2] + '"/>';
      out += '<rect x="' + tx + '" y="' + ty + '" width="' + (u - 1) + '" height="' + (u * 10) + '" fill="none" stroke="' + STROKE + '" stroke-width="2"/>';
      x += u + 7;
    }
    x += 8;
    for (var o = 0; o < (s.o || 0); o++) {
      out += '<rect x="' + (x + (o % 5) * (u + 4)) + '" y="' + (10 + Math.floor(o / 5) * (u + 4)) + '" width="' + u + '" height="' + u +
        '" fill="' + C[1] + '" stroke="' + STROKE + '" stroke-width="1.5"/>';
    }
    x += Math.min(s.o || 0, 5) * (u + 4);
    return S(Math.max(x + 10, 120), 112, out);
  };

  V.numline = function (s) {                   // {min,max,step,marks:[{v,label}]}
    var W = 340, y = 46, x0 = 26, x1 = W - 26, out = '', n = (s.max - s.min) / s.step;
    out += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + STROKE + '" stroke-width="3"/>';
    for (var i = 0; i <= n; i++) {
      var v = s.min + i * s.step, x = x0 + (x1 - x0) * i / n;
      out += '<line x1="' + x + '" y1="' + (y - 9) + '" x2="' + x + '" y2="' + (y + 9) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      if (!s.sparse || i % s.sparse === 0) out += t(x, y + 28, String(v), { size: 13 });
    }
    (s.marks || []).forEach(function (m) {
      var x = x0 + (x1 - x0) * (m.v - s.min) / (s.max - s.min);
      out += '<path d="M' + x + ' ' + (y - 16) + ' l-7 -12 l14 0 z" fill="' + C[1] + '"/>';
      out += t(x, y - 34, m.label || '?', { fill: C[1], size: 16, w: 800 });
    });
    return S(W, 88, out);
  };

  V.tenframe = function (s) {                  // one or two ten-frames
    var frames = s.frames || [s.n], out = '', cw = 28, ox = 6;
    frames.forEach(function (n, f) {
      var bx = ox + f * (cw * 5 + 22);
      for (var i = 0; i < 10; i++) {
        var x = bx + (i % 5) * cw, y = 8 + Math.floor(i / 5) * cw;
        out += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + cw + '" fill="' + PAPER + '" stroke="' + STROKE + '" stroke-width="2"/>';
        if (i < n) out += '<circle cx="' + (x + cw / 2) + '" cy="' + (y + cw / 2) + '" r="' + (cw * 0.32) + '" fill="' + C[(f % 2) ? 1 : 0] + '"/>';
      }
    });
    return S(ox * 2 + frames.length * (cw * 5 + 22) - 22, 8 + cw * 2 + 8, out);
  };

  /* ---------------- measurement ---------------- */
  V.clock = function (s) {
    var cx = 84, cy = 84, r = 74, out = '', i;
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + PAPER + '" stroke="' + STROKE + '" stroke-width="3"/>';
    for (i = 0; i < 60; i++) {
      var a = Math.PI * 2 * i / 60 - Math.PI / 2, big = i % 5 === 0,
          r1 = r - (big ? 11 : 5);
      out += '<line x1="' + (cx + r1 * Math.cos(a)).toFixed(1) + '" y1="' + (cy + r1 * Math.sin(a)).toFixed(1) +
        '" x2="' + (cx + (r - 2) * Math.cos(a)).toFixed(1) + '" y2="' + (cy + (r - 2) * Math.sin(a)).toFixed(1) +
        '" stroke="' + (big ? STROKE : MUT) + '" stroke-width="' + (big ? 3 : 1.5) + '"/>';
    }
    for (i = 1; i <= 12; i++) {
      var an = Math.PI * 2 * i / 12 - Math.PI / 2;
      out += t(cx + (r - 24) * Math.cos(an), cy + (r - 24) * Math.sin(an) + 5, String(i), { size: 14, w: 700 });
    }
    var ma = Math.PI * 2 * (s.m / 60) - Math.PI / 2,
        ha = Math.PI * 2 * ((s.h % 12) / 12 + s.m / 720) - Math.PI / 2;
    out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + r * 0.48 * Math.cos(ha)).toFixed(1) + '" y2="' + (cy + r * 0.48 * Math.sin(ha)).toFixed(1) + '" stroke="' + STROKE + '" stroke-width="7" stroke-linecap="round"/>';
    out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + r * 0.72 * Math.cos(ma)).toFixed(1) + '" y2="' + (cy + r * 0.72 * Math.sin(ma)).toFixed(1) + '" stroke="' + C[1] + '" stroke-width="4.5" stroke-linecap="round"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + STROKE + '"/>';
    return S(168, 168, out);
  };

  V.ruler = function (s) {                     // object measured against a cm ruler
    var cm = s.cm || 10, px = 28, W = cm * px + 40, y = 74, out = '';
    out += '<rect x="20" y="' + y + '" width="' + (cm * px) + '" height="34" fill="' + FAINT + '" stroke="' + STROKE + '" stroke-width="2"/>';
    for (var i = 0; i <= cm; i++) {
      var x = 20 + i * px;
      out += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 13) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      out += t(x, y + 28, String(i), { size: 12 });
      if (i < cm) out += '<line x1="' + (x + px / 2) + '" y1="' + y + '" x2="' + (x + px / 2) + '" y2="' + (y + 7) + '" stroke="' + MUT + '" stroke-width="1.5"/>';
    }
    var ow = (s.obj) * px;
    out += '<rect x="' + (20 + (s.start || 0) * px) + '" y="' + (y - 34) + '" width="' + ow + '" height="24" rx="5" fill="' + C[0] + '"/>';
    if (s.sym) out += emoji(20 + (s.start || 0) * px + ow / 2, y - 22, s.sym, 18);
    return S(W, 112, out);
  };

  V.jug = function (s) {                       // measuring jug {cap, fill, div}
    var W = 178, H = 178, out = '', x = 22, top = 20, bot = 150, w = 72, div = s.div || 4;
    var fy = bot - (bot - top) * (s.fill / s.cap);
    out += '<rect x="' + x + '" y="' + fy + '" width="' + w + '" height="' + (bot - fy) + '" fill="' + C[0] + '" opacity=".7"/>';
    out += '<path d="M' + x + ' ' + top + ' L' + x + ' ' + bot + ' L' + (x + w) + ' ' + bot + ' L' + (x + w) + ' ' + top +
      '" fill="none" stroke="' + STROKE + '" stroke-width="3"/>';
    for (var i = 0; i <= div; i++) {
      var yy = bot - (bot - top) * i / div;
      out += '<line x1="' + (x + w - 15) + '" y1="' + yy + '" x2="' + (x + w + 7) + '" y2="' + yy + '" stroke="' + STROKE + '" stroke-width="2"/>';
      out += t(x + w + 12, yy + 4, String(Math.round(s.cap * i / div)) + (s.unit || ' mL'), { a: 'start', size: 12, fill: MUT });
    }
    return S(W, H, out);
  };

  V.balance = function (s) {                   // pan balance for logic/mass
    var W = 300, out = '', cx = 150, tilt = s.tilt || 0, arm = 100, y = 52;
    var ly = y + tilt * 16, ry = y - tilt * 16;
    out += '<line x1="' + (cx - arm) + '" y1="' + ly + '" x2="' + (cx + arm) + '" y2="' + ry + '" stroke="' + STROKE + '" stroke-width="5" stroke-linecap="round"/>';
    out += '<path d="M' + cx + ' ' + y + ' L' + (cx - 26) + ' ' + 132 + ' L' + (cx + 26) + ' ' + 132 + ' Z" fill="' + FAINT + '" stroke="' + STROKE + '" stroke-width="2.5"/>';
    [[cx - arm, ly, s.left], [cx + arm, ry, s.right]].forEach(function (p) {
      out += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] + 26) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      out += '<path d="M' + (p[0] - 34) + ' ' + (p[1] + 26) + ' q34 26 68 0" fill="none" stroke="' + STROKE + '" stroke-width="3"/>';
      (p[2] || []).forEach(function (sym, i, a) {
        out += emoji(p[0] - (a.length - 1) * 11 + i * 22, p[1] + 12, sym, 21);
      });
    });
    return S(W, 148, out);
  };

  V.coins = function (s) {                     // Australian coins / notes
    var map = { 5: ['5c', '#9aa3ab'], 10: ['10c', '#9aa3ab'], 20: ['20c', '#9aa3ab'], 50: ['50c', '#9aa3ab'], 100: ['$1', '#c8a24a'], 200: ['$2', '#c8a24a'] };
    var out = '', x = 10, cw = 60;
    s.vals.forEach(function (v, i) {
      var m = map[v] || ['?', MUT], cx = x + i * cw + 26;
      out += '<circle cx="' + cx + '" cy="32" r="25" fill="' + m[1] + '" stroke="' + STROKE + '" stroke-width="2"/>';
      out += t(cx, 38, m[0], { size: 15, w: 800, fill: '#20252b' });
    });
    return S(s.vals.length * cw + 12, 66, out);
  };

  /* ---------------- geometry ---------------- */
  var SHAPES = {
    square: function (c, r) { return '<rect x="' + (c - r) + '" y="' + (c - r) + '" width="' + (r * 2) + '" height="' + (r * 2) + '"'; },
    rectangle: function (c, r) { return '<rect x="' + (c - r) + '" y="' + (c - r * 0.6) + '" width="' + (r * 2) + '" height="' + (r * 1.2) + '"'; },
    circle: function (c, r) { return '<circle cx="' + c + '" cy="' + c + '" r="' + r + '"'; },
    oval: function (c, r) { return '<ellipse cx="' + c + '" cy="' + c + '" rx="' + r + '" ry="' + (r * 0.65) + '"'; },
    triangle: function (c, r) { return '<polygon points="' + poly(3, c, c, r) + '"'; },
    pentagon: function (c, r) { return '<polygon points="' + poly(5, c, c, r) + '"'; },
    hexagon: function (c, r) { return '<polygon points="' + poly(6, c, c, r) + '"'; },
    octagon: function (c, r) { return '<polygon points="' + poly(8, c, c, r, Math.PI / 8) + '"'; },
    rhombus: function (c, r) { return '<polygon points="' + [c + ',' + (c - r), (c + r * 0.72) + ',' + c, c + ',' + (c + r), (c - r * 0.72) + ',' + c].join(' ') + '"'; },
    trapezium: function (c, r) { return '<polygon points="' + [(c - r * 0.5) + ',' + (c - r * 0.6), (c + r * 0.5) + ',' + (c - r * 0.6), (c + r) + ',' + (c + r * 0.6), (c - r) + ',' + (c + r * 0.6)].join(' ') + '"'; },
    star: function (c, r) { var p = [], i, a, rr; for (i = 0; i < 10; i++) { a = Math.PI * i / 5 - Math.PI / 2; rr = i % 2 ? r * 0.45 : r; p.push((c + rr * Math.cos(a)).toFixed(1) + ',' + (c + rr * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(' ') + '"'; },
    semicircle: function (c, r) { return '<path d="M' + (c - r) + ' ' + (c + r * 0.4) + ' a' + r + ' ' + r + ' 0 0 1 ' + (r * 2) + ' 0 Z"'; },
    heart: function (c, r) { return '<path d="M' + c + ' ' + (c + r * 0.8) + ' C' + (c - r * 1.6) + ' ' + (c - r * 0.2) + ' ' + (c - r * 0.5) + ' ' + (c - r * 1.1) + ' ' + c + ' ' + (c - r * 0.35) + ' C' + (c + r * 0.5) + ' ' + (c - r * 1.1) + ' ' + (c + r * 1.6) + ' ' + (c - r * 0.2) + ' ' + c + ' ' + (c + r * 0.8) + ' Z"'; },
    arrow: function (c, r) { return '<polygon points="' + [(c - r) + ',' + (c - r * 0.3), c + ',' + (c - r * 0.3), c + ',' + (c - r * 0.7), (c + r) + ',' + c, c + ',' + (c + r * 0.7), c + ',' + (c + r * 0.3), (c - r) + ',' + (c + r * 0.3)].join(' ') + '"'; }
  };
  V.SHAPE_NAMES = Object.keys(SHAPES);

  V.shape = function (s) {
    var size = s.size || 150, c = size / 2, r = size / 2 - 14, f = SHAPES[s.name] || SHAPES.square;
    var out = f(c, r) + ' fill="' + (s.color || C[0]) + '" stroke="' + STROKE + '" stroke-width="2.5"' +
      (s.rotate ? ' transform="rotate(' + s.rotate + ' ' + c + ' ' + c + ')"' : '') + '/>';
    (s.lines || []).forEach(function (L) {           // symmetry / fold lines
      var pts = { v: [c, 8, c, size - 8], h: [8, c, size - 8, c], d1: [12, 12, size - 12, size - 12], d2: [size - 12, 12, 12, size - 12] }[L];
      out += '<line x1="' + pts[0] + '" y1="' + pts[1] + '" x2="' + pts[2] + '" y2="' + pts[3] +
        '" stroke="' + C[1] + '" stroke-width="3" stroke-dasharray="7 5"/>';
    });
    return S(size, size, out);
  };

  V.shapeRow = function (s) {                  // row of shapes, optional labels
    var n = s.items.length, cell = s.cell || 88, out = '';
    s.items.forEach(function (it, i) {
      var c = i * cell + cell / 2, r = cell / 2 - 12, f = SHAPES[it.name] || SHAPES.square;
      var g = f(cell / 2, r).replace('<rect', '<rect').replace('<circle', '<circle');
      out += '<g transform="translate(' + (i * cell) + ',6)">' + f(cell / 2, r) +
        ' fill="' + (it.color || C[i % 6]) + '" stroke="' + STROKE + '" stroke-width="2.5"' +
        (it.rotate ? ' transform="rotate(' + it.rotate + ' ' + (cell / 2) + ' ' + (cell / 2) + ')"' : '') + '/></g>';
      if (it.label) out += t(c, cell + 22, it.label, { size: 14 });
    });
    return S(n * cell, cell + (s.items[0].label ? 32 : 12), out);
  };

  V.solid = function (s) {                     // simple 3D solids
    var out = '', c = C[0];
    if (s.name === 'cube') out += '<polygon points="30,50 90,50 90,110 30,110" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/><polygon points="30,50 52,28 112,28 90,50" fill="' + c + '" opacity=".75" stroke="' + STROKE + '" stroke-width="2.5"/><polygon points="90,50 112,28 112,88 90,110" fill="' + c + '" opacity=".55" stroke="' + STROKE + '" stroke-width="2.5"/>';
    else if (s.name === 'sphere') out += '<circle cx="70" cy="70" r="46" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/><ellipse cx="70" cy="70" rx="46" ry="15" fill="none" stroke="' + PAPER + '" stroke-width="2" opacity=".6"/>';
    else if (s.name === 'cone') out += '<path d="M70 22 L112 106 A42 15 0 0 1 28 106 Z" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/>';
    else if (s.name === 'cylinder') out += '<path d="M28 40 L28 100 A42 15 0 0 0 112 100 L112 40 Z" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/><ellipse cx="70" cy="40" rx="42" ry="15" fill="' + c + '" opacity=".75" stroke="' + STROKE + '" stroke-width="2.5"/>';
    else if (s.name === 'pyramid') out += '<polygon points="70,22 118,104 22,104" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/><polygon points="70,22 118,104 92,116 70,22" fill="' + c + '" opacity=".6" stroke="' + STROKE + '" stroke-width="2.5"/>';
    else out += '<polygon points="24,44 96,44 116,26 44,26" fill="' + c + '" opacity=".75" stroke="' + STROKE + '" stroke-width="2.5"/><rect x="24" y="44" width="72" height="54" fill="' + c + '" stroke="' + STROKE + '" stroke-width="2.5"/><polygon points="96,44 116,26 116,80 96,98" fill="' + c + '" opacity=".55" stroke="' + STROKE + '" stroke-width="2.5"/>';
    return S(140, 140, out);
  };

  V.areaGrid = function (s) {                  // grid with some cells shaded (area / perimeter)
    var cw = 26, out = '';
    for (var y = 0; y < s.rows; y++) for (var x = 0; x < s.cols; x++) {
      var on = s.cells ? s.cells.some(function (p) { return p[0] === x && p[1] === y; }) : true;
      out += '<rect x="' + (x * cw + 2) + '" y="' + (y * cw + 2) + '" width="' + cw + '" height="' + cw +
        '" fill="' + (on ? C[0] : PAPER) + '" stroke="' + (on ? STROKE : LINE) + '" stroke-width="' + (on ? 2 : 1.5) + '"/>';
    }
    return S(s.cols * cw + 6, s.rows * cw + 6, out);
  };

  V.coordGrid = function (s) {                 // grid with letters/numbers + tokens
    var cw = 40, W = (s.cols + 1) * cw, H = (s.rows + 1) * cw, out = '', i, j;
    for (i = 0; i < s.rows; i++) for (j = 0; j < s.cols; j++)
      out += '<rect x="' + ((j + 1) * cw) + '" y="' + (i * cw) + '" width="' + cw + '" height="' + cw + '" fill="' + PAPER + '" stroke="' + LINE + '" stroke-width="1.5"/>';
    for (j = 0; j < s.cols; j++) out += t((j + 1) * cw + cw / 2, s.rows * cw + 22, String.fromCharCode(65 + j), { size: 14, fill: MUT });
    for (i = 0; i < s.rows; i++) out += t(cw / 2 + 8, i * cw + cw / 2 + 5, String(s.rows - i), { size: 14, fill: MUT });
    (s.tokens || []).forEach(function (tk) {
      out += emoji((tk.x + 1) * cw + cw / 2, (s.rows - tk.y) * cw - cw / 2, tk.sym, 24);
    });
    return S(W, H, out);
  };

  /* ---------------- data & chance ---------------- */
  V.picto = function (s) {
    var rowH = 40, W = 340, out = '', maxLab = 76;
    s.rows.forEach(function (r, i) {
      var y = i * rowH + 26;
      out += t(6, y + 5, r.label, { a: 'start', size: 14 });
      for (var k = 0; k < r.count; k++) out += emoji(maxLab + 18 + k * 29, y, r.sym || s.sym || '⭐', 22);
    });
    out += t(6, s.rows.length * rowH + 36, s.key || ('Key: 1 ' + (s.sym || '⭐') + ' = 1'), { a: 'start', size: 12.5, fill: MUT, w: 600 });
    return S(W, s.rows.length * rowH + 48, out);
  };

  V.bars = function (s) {
    var W = 320, H = 190, bw = Math.min(46, (W - 52) / s.bars.length - 12), x0 = 44, base = H - 34,
        max = s.max || Math.max.apply(null, s.bars.map(function (b) { return b.value; })), out = '';
    var top = 16, sc = (base - top) / max, stepv = max <= 5 ? 1 : (max <= 10 ? 2 : Math.ceil(max / 5));
    for (var g = 0; g <= max; g += stepv) {
      var gy = base - g * sc;
      out += '<line x1="' + x0 + '" y1="' + gy + '" x2="' + (W - 8) + '" y2="' + gy + '" stroke="' + LINE + '" stroke-width="1"/>';
      out += t(x0 - 8, gy + 4, String(g), { a: 'end', size: 12, fill: MUT });
    }
    s.bars.forEach(function (b, i) {
      var x = x0 + 14 + i * ((W - x0 - 20) / s.bars.length), h = b.value * sc;
      out += '<rect x="' + x + '" y="' + (base - h) + '" width="' + bw + '" height="' + h + '" rx="4" fill="' + (b.color || C[0]) + '"/>';
      out += t(x + bw / 2, base + 19, b.label, { size: 12.5, fill: MUT });
    });
    out += '<line x1="' + x0 + '" y1="' + base + '" x2="' + (W - 8) + '" y2="' + base + '" stroke="' + STROKE + '" stroke-width="2"/>';
    return S(W, H, out);
  };

  V.spinner = function (s) {                   // chance spinner: array of colour names/counts
    var cx = 84, cy = 84, r = 70, n = s.parts.length, out = '';
    s.parts.forEach(function (p, i) {
      var a0 = -Math.PI / 2 + Math.PI * 2 * i / n, a1 = a0 + Math.PI * 2 / n;
      out += '<path d="' + arcSlice(cx, cy, r, a0, a1) + '" fill="' + p.color + '" stroke="' + STROKE + '" stroke-width="2"/>';
      if (p.label) {
        var am = (a0 + a1) / 2;
        out += t(cx + r * 0.62 * Math.cos(am), cy + r * 0.62 * Math.sin(am) + 5, p.label, { size: 14, w: 800, fill: '#fff' });
      }
    });
    out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - r + 8) + '" stroke="' + STROKE + '" stroke-width="4" stroke-linecap="round"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + STROKE + '"/>';
    return S(168, 168, out);
  };

  V.bag = function (s) {                       // marbles in a bag
    var out = '<path d="M26 52 q58 -34 116 0 l14 92 q-72 20 -144 0 Z" fill="' + FAINT + '" stroke="' + STROKE + '" stroke-width="2.5"/>';
    s.items.forEach(function (it, i) {
      out += '<circle cx="' + (52 + (i % 4) * 24) + '" cy="' + (84 + Math.floor(i / 4) * 24) + '" r="10" fill="' + it + '" stroke="' + STROKE + '" stroke-width="1.5"/>';
    });
    return S(180, 160, out);
  };

  /* ---------------- patterns & thinking skills ---------------- */
  V.seq = function (s) {                       // sequence of cells, one may be '?'
    var cell = s.cell || 72, out = '', n = s.items.length;
    s.items.forEach(function (it, i) {
      var x = i * (cell + 8);
      out += '<rect x="' + x + '" y="4" width="' + cell + '" height="' + cell + '" rx="12" fill="' +
        (it === '?' ? FAINT : PAPER) + '" stroke="' + (it === '?' ? C[1] : LINE) + '" stroke-width="' + (it === '?' ? 3 : 2) +
        (it === '?' ? '" stroke-dasharray="6 5' : '') + '"/>';
      if (it === '?') out += t(x + cell / 2, 4 + cell / 2 + 10, '?', { size: 30, w: 800, fill: C[1] });
      else if (typeof it === 'string') out += (/^[\d\w+\-À-ɏ]+$/.test(it) && it.length <= 3)
        ? t(x + cell / 2, 4 + cell / 2 + 9, it, { size: 26, w: 800 })
        : emoji(x + cell / 2, 4 + cell / 2, it, 34);
      else out += '<g transform="translate(' + x + ',4)">' + (SHAPES[it.name] || SHAPES.square)(cell / 2, cell / 2 - 14) +
        ' fill="' + (it.color || C[0]) + '" stroke="' + STROKE + '" stroke-width="2"' +
        (it.rotate ? ' transform="rotate(' + it.rotate + ' ' + (cell / 2) + ' ' + (cell / 2) + ')"' : '') + '/></g>';
    });
    return S(n * (cell + 8) - 8, cell + 12, out);
  };

  V.matrix = function (s) {                    // n x n analogy grid, last cell '?'
    var n = s.n || 3, cell = 74, out = '';
    for (var i = 0; i < n * n; i++) {
      var x = (i % n) * (cell + 6), y = Math.floor(i / n) * (cell + 6), it = s.cells[i];
      var q = it === '?' || it == null;
      out += '<rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="10" fill="' +
        (q ? FAINT : PAPER) + '" stroke="' + (q ? C[1] : LINE) + '" stroke-width="' + (q ? 3 : 2) + '"/>';
      if (q) out += t(x + cell / 2, y + cell / 2 + 10, '?', { size: 28, w: 800, fill: C[1] });
      else if (typeof it === 'string') out += emoji(x + cell / 2, y + cell / 2, it, 32);
      else out += '<g transform="translate(' + x + ',' + y + ')">' + (SHAPES[it.name] || SHAPES.square)(cell / 2, cell / 2 - 16) +
        ' fill="' + (it.color || C[0]) + '" stroke="' + STROKE + '" stroke-width="2"' +
        (it.rotate ? ' transform="rotate(' + it.rotate + ' ' + (cell / 2) + ' ' + (cell / 2) + ')"' : '') + '/></g>';
    }
    return S(n * (cell + 6) - 6, n * (cell + 6) - 6, out);
  };

  V.emojiRow = function (s) {
    var out = '', n = s.items.length, cell = s.cell || 36;
    s.items.forEach(function (e, i) { out += emoji(i * cell + cell / 2, cell / 2 + 2, e, cell * 0.8); });
    return S(n * cell, cell + 6, out);
  };

  V.barModel = function (s) {                  // part-part-whole bar for word problems
    var W = 320, out = '', total = s.parts.reduce(function (a, b) { return a + b.size; }, 0), x = 0;
    s.parts.forEach(function (p, i) {
      var w = W * p.size / total;
      out += '<rect x="' + x + '" y="30" width="' + w + '" height="46" fill="' + (p.color || C[i % 6]) + '" stroke="' + STROKE + '" stroke-width="2"/>';
      out += t(x + w / 2, 60, p.label, { size: 15, w: 800, fill: '#fff' });
      x += w;
    });
    if (s.total) {
      out += '<line x1="0" y1="18" x2="' + W + '" y2="18" stroke="' + STROKE + '" stroke-width="2"/>';
      out += '<line x1="1" y1="12" x2="1" y2="24" stroke="' + STROKE + '" stroke-width="2"/>';
      out += '<line x1="' + (W - 1) + '" y1="12" x2="' + (W - 1) + '" y2="24" stroke="' + STROKE + '" stroke-width="2"/>';
      out += t(W / 2, 11, s.total, { size: 14, fill: MUT });
    }
    return S(W, 88, out);
  };

  V.render = function (spec) {
    if (!spec) return '';
    var fn = V[spec.type];
    return fn ? fn(spec) : '';
  };
  V.S = S; V.t = t; V.emoji = emoji;
  root.LEO = root.LEO || {}; root.LEO.vis = V;
})(window);
