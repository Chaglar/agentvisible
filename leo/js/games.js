/* games.js — the nine numeracy games on the sheet the teacher sent home.
 *
 * These are the teacher's games, not mine. Each one keeps her wording verbatim
 * (`sheet`) so what happens on screen can be checked against the paper, and so the
 * report that goes back to her uses the names she already uses.
 *
 * They are partner games with a deck of cards and dice. The app does not replace
 * the partner — it does the two jobs a parent at the kitchen table does badly:
 *
 *   - IT DEALS AND IT REMEMBERS. Shuffling, rolling, keeping the running total from
 *     100 down to 0, noticing that a hand of Brainy Cards actually has a solution in
 *     it. That last one matters: a randomly dealt hand often has no way to make 20
 *     at all, and a child who cannot find one concludes he is the problem. Every
 *     hand here is built around a solution before the rest of the cards go in.
 *
 *   - IT WRITES DOWN WHAT HAPPENED. The teacher asked for these to be played at
 *     home; she has no way of seeing any of it. The log here turns a fortnight of
 *     kitchen-table games into one page she can read in a minute — which games, how
 *     often, what went quickly, what is still being counted out on fingers.
 *
 * Time is measured to the FIRST keypress, as in facts.js, for the same reason:
 * total time would mostly measure how fast he can find digits on a keypad.
 *
 * The log is append-only, like every other record in this app: one entry per
 * sitting, merged by id, nothing edited in place.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var SUITS = ['♠', '♥', '♦', '♣'];
  function rnd(rng) { return (rng || Math.random)(); }
  function pickInt(rng, lo, hi) { return lo + Math.floor(rnd(rng) * (hi - lo + 1)); }
  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd(rng) * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function card(v, rng) {
    var s = SUITS[Math.floor(rnd(rng) * 4)];
    return { v: v, s: s, red: s === '♥' || s === '♦' };
  }
  function deal(n, rng, lo, hi) {
    var out = [], i;
    for (i = 0; i < n; i++) out.push(card(pickInt(rng, lo == null ? 1 : lo, hi == null ? 10 : hi), rng));
    return out;
  }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  /* k values in [lo..hi] that add to exactly `target`, or null if that is impossible.
     Each draw is bounded by what the remaining draws can still reach, so the last
     value always lands exactly rather than the hand being quietly unsolvable. */
  function partition(target, k, lo, hi, rng) {
    var out = [], i, left, min, max, v;
    for (i = 0; i < k; i++) {
      left = k - i - 1;
      min = Math.max(lo, target - left * hi);
      max = Math.min(hi, target - left * lo);
      if (max < min) return null;
      v = pickInt(rng, min, max);
      out.push(v); target -= v;
    }
    return target === 0 ? out : null;
  }

  /* A hand that is guaranteed to contain at least one winning selection. */
  function solvableHand(target, k, handSize, rng, lo, hi) {
    var sol = null, tries = 0;
    while (!sol && tries++ < 40) sol = partition(target, k, lo, hi, rng);
    if (!sol) return null;
    var vals = sol.slice();
    while (vals.length < handSize) vals.push(pickInt(rng, lo, hi));
    return shuffle(vals.map(function (v) { return card(v, rng); }), rng);
  }

  /* ---------- Target Number: what can five dice actually reach? ---------- */
  /* The sheet gives 50 as the example target. A target that happens to be
     unreachable from the dice on the table is a game the child cannot win however
     well he thinks, so the target is chosen FROM the reachable set rather than
     picked first and hoped for. Only whole, non-negative results count — the point
     is arithmetic he can do, not fractions. */
  function reachable(vals) {
    var n = vals.length, by = {}, mask, sub, i;
    for (i = 0; i < n; i++) by[1 << i] = [vals[i]];
    var masks = [];
    for (mask = 1; mask < (1 << n); mask++) masks.push(mask);
    masks.sort(function (a, b) { return bits(a) - bits(b); });
    masks.forEach(function (m) {
      if (by[m]) return;
      var seen = {}, out = [];
      for (sub = (m - 1) & m; sub > 0; sub = (sub - 1) & m) {
        var other = m ^ sub;
        if (sub > other) continue;                       // each split once
        var A = by[sub] || [], B = by[other] || [];
        for (var x = 0; x < A.length; x++) {
          for (var y = 0; y < B.length; y++) {
            var a = A[x], b = B[y];
            var cands = [a + b, a * b, a - b, b - a];
            if (b && a % b === 0) cands.push(a / b);
            if (a && b % a === 0) cands.push(b / a);
            for (var c = 0; c < cands.length; c++) {
              var v = cands[c];
              if (v < 0 || v > 400 || seen[v]) continue;
              seen[v] = 1; out.push(v);
            }
          }
        }
      }
      by[m] = out;
    });
    var best = {};
    masks.forEach(function (m) {
      var used = bits(m);
      (by[m] || []).forEach(function (v) {
        if (best[v] == null || used < best[v]) best[v] = used;
      });
    });
    return best;
  }
  function bits(m) { var n = 0; while (m) { n += m & 1; m >>= 1; } return n; }

  /* A target worth aiming at: reachable, needs at least three of the five dice, and
     round if a round one is on offer — 50 reads like a target, 47 reads like a sum. */
  function targetFor(dice, rng) {
    var reach = reachable(dice.slice());
    var good = Object.keys(reach).map(Number).filter(function (v) {
      return v >= 18 && v <= 70 && reach[v] >= 3;
    });
    if (!good.length) {
      good = Object.keys(reach).map(Number).filter(function (v) { return v >= 12 && reach[v] >= 2; });
    }
    if (!good.length) return null;
    var round = good.filter(function (v) { return v % 10 === 0; });
    var fives = good.filter(function (v) { return v % 5 === 0; });
    var pool = round.length ? round : (fives.length ? fives : good);
    return pool[Math.floor(rnd(rng) * pool.length)];
  }

  /* ---------- evaluating what he built ---------- */
  var PREC = { '+': 1, '-': 1, '×': 2, '÷': 2 };
  function evalTokens(tokens) {
    var out = [], ops = [], i, t;
    function apply() {
      var op = ops.pop(), b = out.pop(), a = out.pop();
      if (a == null || b == null) throw new Error('bad');
      out.push(op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b);
    }
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i];
      if (typeof t === 'number') out.push(t);
      else if (t === '(') ops.push(t);
      else if (t === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') apply();
        if (!ops.length) throw new Error('bracket');
        ops.pop();
      } else if (PREC[t]) {
        while (ops.length && PREC[ops[ops.length - 1]] >= PREC[t]) apply();
        ops.push(t);
      } else throw new Error('token');
    }
    while (ops.length) {
      if (ops[ops.length - 1] === '(') throw new Error('bracket');
      apply();
    }
    if (out.length !== 1) throw new Error('shape');
    return out[0];
  }
  function evalExpr(tokens) {
    try {
      var v = evalTokens(tokens);
      return isFinite(v) ? v : null;
    } catch (e) { return null; }
  }
  /* He may use each die once and only once — five 3s on the table is not licence to
     write 3×3×3×3×3×3. */
  function usesOnlyDice(tokens, dice) {
    var pool = dice.slice(), i, j;
    for (i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] !== 'number') continue;
      j = pool.indexOf(tokens[i]);
      if (j < 0) return false;
      pool.splice(j, 1);
    }
    return true;
  }
  function exprText(tokens) {
    return tokens.map(function (t) { return String(t); }).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  }

  /* ---------- what he says he did ---------- */
  /* Four of the nine games ask for the strategy out loud ("describe strategy to
     partner", "discuss quickest way"). That talk is the part the teacher cannot see
     from a score, so it is the one thing worth one extra tap. */
  var STRATEGIES = [
    { id: 'split',   label: 'Split into tens and ones', teacher: 'partitioning' },
    { id: 'doubles', label: 'Used a double',            teacher: 'doubles' },
    { id: 'ten',     label: 'Made a ten first',         teacher: 'bridging to ten' },
    { id: 'count',   label: 'Counted on',               teacher: 'counting on' },
    { id: 'knew',    label: 'Just knew it',             teacher: 'recall' }
  ];

  /* Plain single-codepoint emoji: the family and handshake sequences fall back to
     an empty box on some browsers, which is a poor first impression on a button. */
  var WHO = {
    alone:  { label: 'On my own', emoji: '🙋', teacher: 'alone' },
    parent: { label: 'With a grown-up', emoji: '👥', teacher: 'with a parent' },
    friend: { label: 'With a friend', emoji: '🧒', teacher: 'with a sibling or friend' }
  };

  /* ---------- the nine games ---------- */
  /* `sheet` is the teacher's own wording, copied exactly. Everything else is how we
     play it here. `skills` is what the round is evidence of, and is what the report
     groups by, so it has to be honest rather than flattering. */
  var GAMES = [
    {
      id: 'cards2digit', title: 'Cards & Numbers', emoji: '🃏', needs: 'cards', rounds: 5,
      sheet: 'Each student takes 4 cards and makes 2, 2digit numbers. Add together and describe strategy to partner. Winner is child with the highest total',
      kid: 'Four cards. Make two 2-digit numbers and add them. Go for the biggest total you can.',
      skills: ['2-digit addition', 'place value', 'explaining a strategy'],
      round: function (i, run, rng) {
        return { mode: 'build', kind: 'card', items: deal(4, rng, 1, 9), strategy: true,
                 prompt: 'Make two 2-digit numbers, then add them.' };
      }
    },
    {
      id: 'highlow', title: 'Highest/Lowest Number Wins', emoji: '🎴', needs: 'cards', rounds: 6,
      sheet: 'Turn 4 or 5 cards. Use strategies such as doubles, friends of 10 etc.',
      kid: 'Add up all the cards. Look for doubles and pairs that make ten — they are quicker.',
      skills: ['adding several numbers', 'friends of ten', 'doubles'],
      round: function (i, run, rng) {
        var n = i % 2 ? 5 : 4;
        /* Hands are seeded with a pair that makes ten or a double, so the strategy
           the sheet names is actually available to find rather than a slogan. */
        var items = deal(n - 2, rng, 1, 10);
        if (i % 2) { var a = pickInt(rng, 1, 9); items.push(card(a, rng), card(10 - a, rng)); }
        else { var d = pickInt(rng, 2, 9); items.push(card(d, rng), card(d, rng)); }
        items = shuffle(items, rng);
        return { mode: 'num', kind: 'card', items: items, strategy: i < 2,
                 prompt: 'Add all ' + n + ' cards.',
                 sentence: items.map(function (c) { return c.v; }).join(' + '),
                 answer: sum(items.map(function (c) { return c.v; })) };
      }
    },
    {
      id: 'cardcount', title: 'Card Count', emoji: '➕', needs: 'cards', rounds: 6,
      sheet: 'Turn over two cards – double and add them. Write the number sentence and total. Come up with different ways of getting the same total.',
      kid: 'Two cards. Double each one, add them up — then find another way to make that same total.',
      skills: ['doubles', 'number sentences', 'flexible ways to make a number'],
      round: function (i, run, rng) {
        var c = deal(2, rng, 2, 9), tot = 2 * (c[0].v + c[1].v);
        if (i % 2 === 0) {
          return { mode: 'num', kind: 'card', items: c,
                   prompt: 'Double each card, then add them.',
                   sentence: c[0].v + ' + ' + c[0].v + ' + ' + c[1].v + ' + ' + c[1].v,
                   answer: tot };
        }
        /* The teacher's second half: the same total, built another way. Tiles rather
           than cards, because the point here is the number, not the deck. */
        var t = run.lastTotal || tot;
        var a = pickInt(rng, Math.max(1, t - 20), Math.min(20, t - 1));
        var tiles = shuffle([a, t - a, pickInt(rng, 1, 20), pickInt(rng, 1, 20), pickInt(rng, 1, 20), pickInt(rng, 1, 20)]
          .map(function (v) { return { v: v }; }), rng);
        return { mode: 'pick', kind: 'tile', items: tiles,
                 prompt: 'Pick two numbers that also make ' + t + '.',
                 rule: { target: t, min: 2, max: 2 } };
      }
    },
    {
      id: 'gofish20', title: 'Go Fish — Friends of 20', emoji: '🐟', needs: 'cards', rounds: 6,
      sheet: 'Friends of 20 Go Fish (and higher)',
      kid: 'Find the cards that add up to the number at the top. Two or three of them.',
      skills: ['friends of 20', 'friends of 50', 'adding to a target'],
      /* How many cards a target needs is arithmetic, not taste: three cards from a
         1-10 deck cannot make 40, and a hand that cannot be solved is a hand that
         teaches a child he is stuck. The count comes from the target. */
      round: function (i, run, rng) {
        var target = [20, 20, 25, 30, 20, 30][i % 6];
        var k = Math.max(2, Math.ceil(target / 10));
        var hand = solvableHand(target, k, 8, rng, 1, 10);
        return { mode: 'pick', kind: 'card', items: hand,
                 prompt: 'Find ' + k + ' cards that make ' + target + '.',
                 rule: { target: target, min: k, max: k } };
      }
    },
    {
      id: 'brainy20', title: 'Brainy Cards Friends to 20', emoji: '🧠', needs: 'cards', rounds: 6,
      sheet: 'Using 3 or multiple cards. If you make over 20, all cards are placed back down.',
      kid: 'Three or more cards, exactly 20. Go over and you lose them all.',
      skills: ['friends of 20', 'adding three or more numbers', 'checking before committing'],
      round: function (i, run, rng) {
        var k = 3 + (i % 3 === 2 ? 1 : 0);
        var hand = solvableHand(20, k, 7, rng, 1, 9) || deal(7, rng, 1, 9);
        return { mode: 'pick', kind: 'card', items: hand,
                 prompt: 'Pick 3 or more cards that make exactly 20.',
                 rule: { target: 20, min: 3, max: 7, bust: true } };
      }
    },
    {
      id: 'cardfriends', title: 'Card Friends', emoji: '💯', needs: 'cards', rounds: 8,
      sheet: 'Add/subtract game. Add 2 numbers then subtract from 100. Continue until 0.',
      kid: 'Start at 100. Add the two cards, take them off the total, keep going until you hit zero.',
      skills: ['subtraction from 100', 'two-step calculation', 'counting back in tens and ones'],
      start: function () { return { left: 100 }; },
      /* The deal is steered so the last round lands exactly on nought. Two cards can
         only take away 2 to 20, so a random deal from 100 either overshoots or leaves
         him stranded at 7 with no rounds left — and "continue until 0" is the whole
         point of the game. */
      round: function (i, run, rng) {
        var left = run.left == null ? 100 : run.left;
        var leftRounds = Math.max(1, (run.total || 8) - i);
        var take;
        if (leftRounds === 1) take = Math.max(2, Math.min(20, left));
        else {
          var lo = Math.max(2, left - 20 * (leftRounds - 1));
          var hi = Math.min(20, left - 2 * (leftRounds - 1));
          if (hi < lo) hi = lo;
          var ideal = Math.round(left / leftRounds);
          take = Math.min(hi, Math.max(lo, ideal + pickInt(rng, -3, 3)));
        }
        var a = pickInt(rng, Math.max(1, take - 10), Math.min(10, take - 1));
        var items = [card(a, rng), card(take - a, rng)];
        return { mode: 'num', kind: 'card', items: items, left: left,
                 prompt: 'Add the cards, then take them off ' + left + '.',
                 sentence: left + ' − (' + a + ' + ' + (take - a) + ')',
                 answer: left - take, takes: take, last: left - take <= 0 };
      }
    },
    {
      id: 'times', title: 'Times Table', emoji: '✖️', needs: 'cards', rounds: 10,
      sheet: "Pick a times table to practise (2,5,10 or 3s) Pick up a card and try to multiply the card by the times table you're practising",
      kid: 'Pick a table. A card comes up — multiply it.',
      skills: ['times tables', 'multiplication recall'],
      options: { key: 'table', label: 'Which table?',
                 choices: [{ v: 2, label: '2s' }, { v: 5, label: '5s' }, { v: 10, label: '10s' }, { v: 3, label: '3s' },
                           { v: 4, label: '4s' }, { v: 6, label: '6s' }, { v: 7, label: '7s' }, { v: 8, label: '8s' }, { v: 9, label: '9s' }],
                 note: 'The first four are the ones on the sheet. The rest are the harder tables.' },
      round: function (i, run, rng) {
        var tbl = run.opt || 2, c = card(pickInt(rng, 1, 10), rng);
        return { mode: 'num', kind: 'card', items: [c],
                 prompt: c.v + ' × ' + tbl + ' = ?',
                 sentence: c.v + ' × ' + tbl,
                 answer: c.v * tbl };
      }
    },
    {
      id: 'dots', title: 'Dots and Numerals', emoji: '🎲', needs: 'dice', rounds: 6,
      sheet: 'Roll 4 dice and add. Discuss quickest way and strategies',
      kid: 'Four dice. Add them up — and say what you did first.',
      skills: ['adding several numbers', 'subitising', 'explaining a strategy'],
      round: function (i, run, rng) {
        var d = [pickInt(rng, 1, 6), pickInt(rng, 1, 6), pickInt(rng, 1, 6), pickInt(rng, 1, 6)];
        return { mode: 'num', kind: 'die', items: d.map(function (v) { return { v: v }; }), strategy: true,
                 prompt: 'Add the four dice.', sentence: d.join(' + '), answer: sum(d) };
      }
    },
    {
      id: 'target', title: 'Target Number', emoji: '🎯', needs: 'dice', rounds: 4,
      sheet: 'Roll an assortment of 5 dice. Give students a target number e.g. 50. Students can use the numbers on any of the dice and any 4 operations to make the target number. Explain method to partners and record',
      kid: 'Five dice, one target. Use the dice and +, −, × and ÷ to hit it exactly.',
      skills: ['all four operations', 'order of operations', 'planning and explaining'],
      round: function (i, run, rng) {
        var dice, target = null, tries = 0;
        while (target == null && tries++ < 30) {
          dice = [pickInt(rng, 1, 6), pickInt(rng, 1, 6), pickInt(rng, 1, 6), pickInt(rng, 1, 6), pickInt(rng, 1, 6)];
          target = targetFor(dice, rng);
        }
        return { mode: 'expr', kind: 'die', items: dice.map(function (v) { return { v: v }; }),
                 prompt: 'Make ' + target + '.', target: target, answer: target };
      }
    }
  ];

  function byId(id) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
    return null;
  }

  /* ---------- checking ---------- */
  function checkPick(sel, rule) {
    var tot = sum(sel.map(function (x) { return x.v; }));
    if (sel.length < rule.min) return { ok: false, why: 'That is only ' + sel.length + '. Pick at least ' + rule.min + '.' };
    if (rule.max && sel.length > rule.max) return { ok: false, why: 'That is too many — pick ' + rule.max + '.' };
    if (tot === rule.target) return { ok: true, why: sel.map(function (x) { return x.v; }).join(' + ') + ' = ' + rule.target };
    if (rule.bust && tot > rule.target) return { ok: false, why: 'Bust — ' + tot + '. Over 20 and they all go back down.' };
    return { ok: false, why: 'That makes ' + tot + ', not ' + rule.target + '.' };
  }

  function checkExpr(tokens, round) {
    if (!tokens.length) return { ok: false, why: 'Nothing to work out yet.' };
    if (!usesOnlyDice(tokens, round.items.map(function (d) { return d.v; })))
      return { ok: false, why: 'Each die can only be used once.' };
    var v = evalExpr(tokens);
    if (v == null) return { ok: false, why: 'That does not work out — check the brackets and signs.' };
    var shown = Math.round(v * 100) / 100;
    if (Math.abs(v - round.target) < 1e-9) return { ok: true, why: exprText(tokens) + ' = ' + round.target };
    return { ok: false, why: exprText(tokens) + ' = ' + shown + ', not ' + round.target + '.' };
  }

  /* ---------- the log ---------- */
  function plays(log, id) {
    return (log || []).filter(function (p) { return p && p.kind === 'play' && (!id || p.game === id); });
  }
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[(s.length - 1) >> 1];
  }

  function statsFor(log, id) {
    var ps = plays(log, id);
    var rounds = ps.reduce(function (n, p) { return n + (p.rounds || 0); }, 0);
    var ok = ps.reduce(function (n, p) { return n + (p.ok || 0); }, 0);
    var times = [];
    ps.forEach(function (p) { (p.detail || []).forEach(function (d) { if (d.ok && d.ms) times.push(d.ms); }); });
    var strat = {};
    ps.forEach(function (p) {
      (p.detail || []).forEach(function (d) { if (d.strategy) strat[d.strategy] = (strat[d.strategy] || 0) + 1; });
    });
    return {
      id: id, plays: ps.length, rounds: rounds, ok: ok,
      pct: rounds ? Math.round(100 * ok / rounds) : null,
      med: times.length ? median(times) : null,
      mins: ps.reduce(function (n, p) { return n + (p.mins || 0); }, 0),
      last: ps.length ? ps[ps.length - 1].t : 0,
      strategies: strat, who: ps.length ? ps[ps.length - 1].who : ''
    };
  }

  function summary(log) {
    var all = GAMES.map(function (g) {
      var s = statsFor(log, g.id); s.game = g; return s;
    });
    var ps = plays(log);
    return {
      games: all,
      played: all.filter(function (s) { return s.plays; }),
      untouched: all.filter(function (s) { return !s.plays; }),
      sittings: ps.length,
      rounds: all.reduce(function (n, s) { return n + s.rounds; }, 0),
      ok: all.reduce(function (n, s) { return n + s.ok; }, 0),
      mins: all.reduce(function (n, s) { return n + s.mins; }, 0),
      first: ps.length ? ps[0].t : 0,
      last: ps.length ? ps[ps.length - 1].t : 0
    };
  }

  /* ---------- the note that goes back to school ---------- */
  /* Written to be read in a minute by someone with thirty of these to read. Facts
     first, no adjectives about the child, and it says plainly what has not been
     played rather than quietly leaving it out. */
  var SLOW_MS = 12000;

  function dmy(ts) {
    var d = new Date(ts);
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + M[d.getMonth()];
  }

  function report(log, opts) {
    opts = opts || {};
    var name = opts.name || 'Leo';
    var s = summary(log);
    var lines = [];
    var title = name + ' — numeracy games at home';

    if (!s.sittings) {
      lines.push('No games played yet.');
      return { title: title, text: title + '\n\n' + lines.join('\n'), lines: lines, summary: s, empty: true };
    }

    lines.push(dmy(s.first) + ' to ' + dmy(s.last) + ' · ' + s.sittings +
      (s.sittings === 1 ? ' sitting' : ' sittings') + ' · ' + s.rounds + ' rounds · about ' + s.mins + ' minutes');
    lines.push(s.ok + ' of ' + s.rounds + ' right (' + Math.round(100 * s.ok / Math.max(1, s.rounds)) + '%).');
    lines.push('');
    lines.push('GAMES FROM THE SHEET');

    s.played.slice().sort(function (a, b) { return b.plays - a.plays; }).forEach(function (g) {
      var bits = [g.plays + (g.plays === 1 ? ' sitting' : ' sittings'),
                  g.rounds + ' rounds', g.ok + ' right (' + g.pct + '%)'];
      if (g.med) bits.push('typically ' + (g.med / 1000).toFixed(1) + 's to start answering');
      lines.push('· ' + g.game.title + ' — ' + bits.join(', '));
      var st = Object.keys(g.strategies).sort(function (a, b) { return g.strategies[b] - g.strategies[a]; });
      if (st.length) {
        lines.push('    said he used: ' + st.map(function (k) {
          var S2 = STRATEGIES.filter(function (x) { return x.id === k; })[0];
          return (S2 ? S2.teacher : k) + ' ×' + g.strategies[k];
        }).join(', '));
      }
    });

    if (s.untouched.length) {
      lines.push('');
      lines.push('Not played yet: ' + s.untouched.map(function (g) { return g.game.title; }).join(', ') + '.');
    }

    var strong = s.played.filter(function (g) { return g.rounds >= 4 && g.pct >= 85 && (!g.med || g.med < SLOW_MS); });
    var work = s.played.filter(function (g) { return g.rounds >= 4 && (g.pct < 70 || (g.med && g.med >= SLOW_MS)); });

    if (strong.length) {
      lines.push('');
      lines.push('COMING QUICKLY');
      strong.forEach(function (g) {
        lines.push('· ' + g.game.skills.slice(0, 2).join(' and ') + ' (' + g.game.title + ', ' + g.pct + '%)');
      });
    }
    if (work.length) {
      lines.push('');
      lines.push('STILL BEING WORKED OUT');
      work.forEach(function (g) {
        var why = g.pct < 70 ? g.pct + '% right'
          : 'right, but ' + (g.med / 1000).toFixed(0) + 's of thinking before each answer';
        lines.push('· ' + g.game.skills.slice(0, 2).join(' and ') + ' (' + g.game.title + ': ' + why + ')');
      });
    }

    lines.push('');
    lines.push('Played ' + (function () {
      var w = {};
      plays(log).forEach(function (p) { w[p.who || 'alone'] = (w[p.who || 'alone'] || 0) + 1; });
      return Object.keys(w).map(function (k) { return (WHO[k] ? WHO[k].teacher : k) + ' ×' + w[k]; }).join(', ');
    })() + '.');
    lines.push('Cards and dice are dealt in the app, so the numbers change every round; ' +
      'timings are from the question appearing to the first key pressed.');

    return { title: title, text: title + '\n\n' + lines.join('\n'), lines: lines, summary: s, empty: false };
  }

  L.games = {
    GAMES: GAMES, STRATEGIES: STRATEGIES, WHO: WHO, SLOW_MS: SLOW_MS,
    byId: byId, deal: deal, shuffle: shuffle, partition: partition, solvableHand: solvableHand,
    reachable: reachable, targetFor: targetFor, evalExpr: evalExpr, usesOnlyDice: usesOnlyDice,
    exprText: exprText, checkPick: checkPick, checkExpr: checkExpr,
    plays: plays, statsFor: statsFor, summary: summary, report: report
  };
})(window);
