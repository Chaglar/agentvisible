/* report.js — the one page that goes back to school, drawn rather than typed.
 *
 * The first version was a block of monospace text. It was accurate and nobody
 * would have read it: a teacher with thirty of these has about twenty seconds per
 * child, and twenty seconds buys a glance, not a paragraph. So the same numbers are
 * laid out to be *scanned* — a headline, nine game tiles, two columns, a month of
 * days — and it prints onto one page.
 *
 * Chart decisions, and why each one is what it is:
 *
 *   - ONE MEASURE PER MARK. Accuracy is a bar; thinking time is a number beside it.
 *     Putting both on one axis would make a chart that looks richer and says less.
 *   - SINGLE HUE, NOT A PALETTE. Nothing here is a category — it is all "how much",
 *     so it is one blue, light to dark, and the ramp is the validated ordinal one
 *     (steps 250/350/450 on light, 600/500/400 on dark).
 *   - STATUS NEVER CARRIES MEANING ALONE. The two columns have an icon and a word
 *     as well as a colour, because a third of men read those two colours alike, and
 *     because this will be printed in black and white.
 *   - EVERY BAR IS LABELLED. There is no axis to read off, so the number sits at the
 *     end of its own bar. A teacher should never have to measure anything.
 *
 * It is deliberately only the games. No percentiles, no reading, no writing, no
 * assessment of the child by an app — those belong to the family, not the file.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function dmy(ts) { var d = new Date(ts); return d.getDate() + ' ' + MONTH[d.getMonth()]; }
  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* A ring rather than a number on its own: the headline is a proportion, and a
     proportion drawn as a ring is read without doing any arithmetic. */
  function ring(pct, label, sub) {
    var R = 46, C = 2 * Math.PI * R, on = C * Math.max(0, Math.min(100, pct)) / 100;
    return '<div class="rgWrap">' +
      '<svg viewBox="0 0 120 120" class="rg" role="img" aria-label="' + esc(pct + '% ' + label) + '">' +
      '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="var(--rgTrack)" stroke-width="11"/>' +
      '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="var(--rgInk)" stroke-width="11"' +
      ' stroke-linecap="round" stroke-dasharray="' + on.toFixed(1) + ' ' + (C - on).toFixed(1) + '"' +
      ' transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="60" text-anchor="middle" dominant-baseline="central" class="rgN">' + pct + '%</text>' +
      '</svg>' +
      '<div class="rgL"><b>' + esc(label) + '</b><span>' + esc(sub) + '</span></div></div>';
  }

  function bar(pct, cls) {
    return '<div class="rbar ' + (cls || '') + '"><i style="width:' + Math.max(2, pct) + '%"></i></div>';
  }

  /* Days, four weeks of them. Squares rather than a line: the question a teacher
     has is "is this happening at all", which is a pattern, not a trend. */
  function days(log, weeks) {
    var by = {}, i;
    (log || []).forEach(function (p) {
      if (!p || p.kind !== 'play') return;
      var k = dayKey(p.t);
      by[k] = (by[k] || 0) + (p.mins || 0);
    });
    var out = '', n = (weeks || 4) * 7, today = new Date();
    today.setHours(12, 0, 0, 0);
    var labels = [];
    for (i = n - 1; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 864e5);
      var mins = by[dayKey(d.getTime())] || 0;
      var step = mins === 0 ? 0 : mins <= 5 ? 1 : mins <= 15 ? 2 : 3;
      out += '<i class="d' + step + '" title="' + esc(d.getDate() + ' ' + MONTH[d.getMonth()] +
        (mins ? ' · ' + mins + ' min' : ' · nothing')) + '"></i>';
      if (d.getDate() === 1 || i === n - 1) labels.push(MONTH[d.getMonth()]);
    }
    return { cells: out, months: labels };
  }

  function strategyRows(sum) {
    var G = L.games, counts = {};
    sum.played.forEach(function (g) {
      Object.keys(g.strategies).forEach(function (k) { counts[k] = (counts[k] || 0) + g.strategies[k]; });
    });
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!keys.length) return '';
    var max = counts[keys[0]];
    return '<div class="rsec"><h3>What he says he did</h3><div class="rstrat">' +
      keys.map(function (k) {
        var S = G.STRATEGIES.filter(function (x) { return x.id === k; })[0];
        return '<div class="rrow2"><span class="k">' + esc(S ? S.label : k) + '</span>' +
          bar(100 * counts[k] / max) + '<b>' + counts[k] + '</b></div>';
      }).join('') + '</div>' +
      '<p class="rfine">His words, tapped after the round — the part a score cannot show.</p></div>';
  }

  /* The nine tiles. A game not played is drawn as an outline rather than left out:
     "we have not got to this one" is information the teacher asked for. */
  function tiles(sum) {
    return '<div class="rgrid">' + sum.games.map(function (g) {
      if (!g.plays) {
        return '<div class="rtile off"><div class="hd"><span class="e">' + g.game.emoji + '</span>' +
          '<span class="t">' + esc(g.game.title) + '</span></div>' +
          '<div class="n">not played yet</div></div>';
      }
      var slow = g.med && g.med >= L.games.SLOW_MS;
      /* Title and score on one line, then the bar, then one line of detail. The
         first layout stacked all four and the sheet ran to two pages. */
      return '<div class="rtile"><div class="hd"><span class="e">' + g.game.emoji + '</span>' +
        '<span class="t">' + esc(g.game.title) + '</span><b>' + g.pct + '%</b></div>' +
        bar(g.pct) +
        '<div class="n">' + g.ok + '/' + g.rounds + ' rounds · ' + g.plays + (g.plays === 1 ? ' sitting' : ' sittings') +
        (g.med ? ' · ' + (slow ? '<em>' : '') + (g.med / 1000).toFixed(1) + 's to start' + (slow ? '</em>' : '') : '') +
        '</div></div>';
    }).join('') + '</div>';
  }

  function columns(sum) {
    var SLOW = L.games.SLOW_MS;
    var strong = sum.played.filter(function (g) { return g.rounds >= 4 && g.pct >= 85 && (!g.med || g.med < SLOW); });
    var work = sum.played.filter(function (g) { return g.rounds >= 4 && (g.pct < 70 || (g.med && g.med >= SLOW)); });
    function col(cls, icon, head, list, none) {
      return '<div class="rcol ' + cls + '"><h3><span class="ic" aria-hidden="true">' + icon + '</span>' + head + '</h3>' +
        (list.length
          ? '<ul>' + list.map(function (g) {
              var why = g.pct < 70 ? g.pct + '% right'
                : (g.med && g.med >= SLOW) ? (g.med / 1000).toFixed(0) + 's of thinking each time'
                : g.pct + '% right';
              return '<li><b>' + esc(g.game.skills.slice(0, 2).join(' and ')) + '</b>' +
                '<span>' + esc(g.game.title) + ' · ' + why + '</span></li>';
            }).join('') + '</ul>'
          : '<p class="rfine">' + none + '</p>') + '</div>';
    }
    return '<div class="rcols">' +
      col('good', '✓', 'Coming quickly', strong, 'Nothing here yet — it takes four rounds of a game before this is worth saying.') +
      col('work', '◑', 'Still being worked out', work, 'Nothing is dragging at the moment.') +
      '</div>';
  }

  /* The whole page. Returns HTML; the caller decides where it goes. */
  function render(log, opts) {
    opts = opts || {};
    var G = L.games, sum = G.summary(log || []);
    var name = opts.name || 'Leo';
    var head = '<header class="rhead">' +
      '<div class="who"><span class="av">' + (opts.avatar || '🦁') + '</span>' +
      '<div><h2>' + esc(name) + ' — maths games at home</h2>' +
      '<p>The nine games from the sheet, played at the kitchen table</p></div></div>' +
      '<div class="for">' + (opts.teacher ? '<b>For ' + esc(opts.teacher) + '</b>' : '') +
      '<span>' + (sum.sittings ? dmy(sum.first) + ' – ' + dmy(sum.last) : dmy(Date.now())) + '</span></div>' +
      '</header>';

    if (!sum.sittings) {
      return '<section class="slide empty">' + head +
        '<div class="rempty"><div class="e">🎲</div><p>No games played yet. Once a game is played the sheet fills itself in.</p></div>' +
        '</section>';
    }

    var pct = Math.round(100 * sum.ok / Math.max(1, sum.rounds));
    var d = days(log, 4);
    var stats = '<div class="rstats">' +
      ring(pct, 'of rounds right', sum.ok + ' of ' + sum.rounds) +
      '<div class="rkpis">' +
        '<div class="rkpi"><b>' + sum.played.length + '<em>/' + sum.games.length + '</em></b><span>games tried</span></div>' +
        '<div class="rkpi"><b>' + sum.sittings + '</b><span>' + (sum.sittings === 1 ? 'sitting' : 'sittings') + '</span></div>' +
        '<div class="rkpi"><b>' + sum.mins + '<em> min</em></b><span>at the table</span></div>' +
      '</div>' +
      '<div class="rdays"><h3>Last four weeks</h3><div class="strip">' + d.cells + '</div>' +
        '<div class="rlegend"><span><i class="d0"></i>none</span><span><i class="d1"></i>5 min</span>' +
        '<span><i class="d2"></i>15</span><span><i class="d3"></i>more</span></div></div>' +
      '</div>';

    return '<section class="slide">' + head + stats +
      '<div class="rsec"><h3>The nine games</h3>' + tiles(sum) + '</div>' +
      columns(sum) +
      strategyRows(sum) +
      '<footer class="rfoot">Cards and dice are dealt by the app, so the numbers change every round. ' +
      'Times are from the question appearing to the first key pressed — thinking, not typing. ' +
      'Nothing is ever marked wrong for being slow.</footer>' +
      '</section>';
  }

  L.report = { render: render, ring: ring, days: days };
})(window);
