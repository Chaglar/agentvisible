/* books.js — the reading shelf.
 *
 * The one thing that will decide how Leo reads in two years is not this app's
 * question bank. It is whether he reads most days. He did in Kindergarten, the
 * teacher changed, and the habit went. This is an attempt at getting it back, and
 * it is deliberately the least test-like part of the app.
 *
 * Four decisions, each following from his profile rather than from what is easy:
 *
 *   - LISTENING COUNTS THE SAME. He reads better silently than aloud and decoding
 *     is the bottleneck. Listening removes the bottleneck entirely while still
 *     building vocabulary, sentence rhythm and stamina — which is exactly what
 *     Victorian prose demands. A log that only credited reading alone would quietly
 *     tell him the thing he finds hardest is the only thing that counts.
 *
 *   - ADDING A BOOK MUST NOT NEED TYPING. Writing is his weakest skill; making him
 *     spell "Kenneth Grahame" to record that he read is a tax on the wrong thing.
 *     Almost everything is one tap from a list.
 *
 *   - NO TARGETS, NO STREAK TO BREAK. A streak punishes the day you miss, and the
 *     day you miss is usually the day it was already hard. Stickers only accumulate.
 *
 *   - THE STICKER GOES ON THE BOOK, not into a points total. It was asked for that
 *     way and it is right: the reward should be attached to the thing being
 *     rewarded, and a cover slowly filling up is a record of effort he can see.
 *
 * Storage is one append-only log, like the fact attempts: a 'book' entry adds a
 * title, a 'read' entry records a sitting. Everything else — which books exist,
 * how many stickers each has, what has been finished — is derived. Two devices
 * merge by id with no conflict resolution.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  /* Picked for this reader specifically. `why` is for the parent; `kid` is the one
     line shown on the card. Classics here are public domain, so free editions and
     free recorded readings exist for all of them. */
  var SUGGESTED = [
    { id: 'jacobs', title: 'English Fairy Tales', author: 'Joseph Jacobs', tag: 'classic',
      kid: 'Giants, bogeys and a very lucky old woman.',
      why: 'The OC reading paper drew a passage straight from this book. Same language, same shape, no surprise on the day.' },
    { id: 'wind', title: 'The Wind in the Willows', author: 'Kenneth Grahame', tag: 'classic',
      kid: 'A mole, a rat, a boat, and a toad who will not behave.',
      why: 'Exactly the register the OC paper uses, in a story an eight-year-old will sit through.' },
    { id: 'justso', title: 'Just So Stories', author: 'Rudyard Kipling', tag: 'classic',
      kid: 'How the camel got his hump, and other things nobody can prove.',
      why: 'Short, funny, and deliberately old-fashioned. Good for reading aloud together.' },
    { id: 'alice', title: 'Alice’s Adventures in Wonderland', author: 'Lewis Carroll', tag: 'classic',
      kid: 'Nothing makes sense and that is the point.',
      why: 'Wordplay and logic puzzles in the same book — it feeds Thinking Skills as well as reading.' },
    { id: 'banjo', title: 'Mulga Bill’s Bicycle & other poems', author: 'Banjo Paterson', tag: 'poetry',
      kid: 'A man who thought he could ride anything. He could not.',
      why: '1890s language, Australian, and a story in every poem. Poetry is the OC paper’s hardest text type and this is the least painful way in.' },
    { id: 'stevenson', title: 'A Child’s Garden of Verses', author: 'Robert Louis Stevenson', tag: 'poetry',
      kid: 'Short poems about being small.',
      why: 'Gentle poetry with real imagery — the skill the OC paper tests, at a manageable size.' },
    { id: 'helix', title: 'Double Helix', author: 'CSIRO', tag: 'magazine',
      kid: 'Science, experiments and things that explode (safely).',
      why: 'Australian, informational, magazine format — which is precisely the shape of the NAPLAN Year 3 reading test.' },
    { id: 'rocks', title: 'A rocks and minerals guide', author: 'any field guide', tag: 'interest',
      kid: 'Every stone has a name. You already know most of them.',
      why: 'Background knowledge is the strongest predictor of comprehension, and this is where his is deepest.' },
    { id: 'fungi', title: 'A mushroom and fungi guide', author: 'any field guide', tag: 'interest',
      kid: 'Hundreds of them, and you can name them on sight.',
      why: 'Same reason. Reading in a subject he knows lets him read well above his decoding level.' },
    { id: 'minecraft', title: 'A Minecraft handbook or story', author: '—', tag: 'interest',
      kid: 'Redstone, builds, and how other people do it.',
      why: 'Counts fully. Pages read willingly beat pages read under protest.' },
    { id: 'graphic', title: 'A graphic novel', author: 'anything he picks', tag: 'interest',
      kid: 'Pictures and words together. Still reading.',
      why: 'For a child who has gone off books, this is often what brings them back. Comprehension and vocabulary still grow.' }
  ];

  var HOW = {
    self:     { label: 'I read it myself', emoji: '👀', note: 'On your own, in your head or out loud.' },
    together: { label: 'We read it together', emoji: '👥', note: 'Taking turns, or following along.' },
    listen:   { label: 'I listened to it', emoji: '🎧', note: 'An audiobook or someone reading to you.' }
  };

  /* Stickers come from what he collects. Deterministic per entry id, so a sticker
     never jumps position when the page repaints. */
  var STICKERS = ['🍄', '💎', '🔷', '🪨', '⛏️', '🦴', '🌋', '🧭', '🔶', '🦖', '🐚', '🌿', '⭐️', '🪐'];

  function hash(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  /* Position on the cover, kept inside a margin so nothing hangs off the edge.
     The shifts must be UNSIGNED: `>>` is a signed shift in JavaScript, so any hash
     at or above 2^31 came back negative and put the sticker off the cover, where it
     read as one of them silently going missing. */
  function placeSticker(id) {
    var h = hash(id);
    return {
      emoji: STICKERS[h % STICKERS.length],
      x: 12 + (h >>> 5) % 64,          // percent across the cover
      y: 34 + (h >>> 11) % 46,         // below the title block, which can run to three lines
      rot: ((h >>> 17) % 40) - 20
    };
  }

  function coverHue(id) { return hash('c' + id) % 360; }

  /* Fold the log into books. Entries are never edited, so this is the only place
     that decides what the shelf looks like. */
  function shelf(log) {
    var books = {}, order = [];
    (log || []).forEach(function (e) {
      if (!e || e.kind !== 'book' || !e.id) return;
      if (books[e.id]) return;
      books[e.id] = { id: e.id, title: e.title, author: e.author || '', t: e.t || 0,
                      sessions: [], mins: 0, finished: false, finishedT: 0 };
      order.push(e.id);
    });
    (log || []).forEach(function (e) {
      if (!e || !books[e.book]) return;
      if (e.kind === 'read') {
        books[e.book].sessions.push(e);
        books[e.book].mins += (e.mins || 0);
      } else if (e.kind === 'finished') {
        books[e.book].finished = true;
        books[e.book].finishedT = Math.max(books[e.book].finishedT, e.t || 0);
      }
    });
    return order.map(function (id) {
      var b = books[id];
      b.sessions.sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
      b.stickers = b.sessions.map(function (s, i) { return placeSticker(s.id || (id + ':' + i), i); });
      b.hue = coverHue(id);
      return b;
    }).sort(function (a, b) {
      // unfinished first, most recently read at the front of each group
      if (a.finished !== b.finished) return a.finished ? 1 : -1;
      var la = a.sessions.length ? a.sessions[a.sessions.length - 1].t : a.t;
      var lb = b.sessions.length ? b.sessions[b.sessions.length - 1].t : b.t;
      return lb - la;
    });
  }

  function totals(log) {
    var s = shelf(log);
    return {
      books: s.length,
      finished: s.filter(function (b) { return b.finished; }).length,
      sittings: s.reduce(function (n, b) { return n + b.sessions.length; }, 0),
      minutes: s.reduce(function (n, b) { return n + b.mins; }, 0),
      stickers: s.reduce(function (n, b) { return n + b.stickers.length; }, 0),
      // how the reading is actually happening, which matters more than the total
      how: s.reduce(function (o, b) {
        b.sessions.forEach(function (x) { o[x.how || 'self'] = (o[x.how || 'self'] || 0) + 1; });
        return o;
      }, {})
    };
  }

  /* Days with at least one sitting, most recent first — for the dashboard. */
  function days(log, n) {
    var by = {};
    (log || []).forEach(function (e) {
      if (!e || e.kind !== 'read') return;
      var d = new Date(e.t);
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      by[k] = (by[k] || 0) + (e.mins || 0);
    });
    return Object.keys(by).sort().slice(-(n || 30)).map(function (k) { return { day: k, mins: by[k] }; });
  }

  /* Said once, when a sticker lands. Never a target he could miss. */
  function praise(book, total) {
    var n = book.sessions.length;
    if (n === 1) return 'First sticker on this one.';
    if (n === 5) return 'Five sittings. This cover is filling up.';
    if (n === 10) return 'Ten. That is a properly read book.';
    if (total.stickers === 25) return '25 stickers across the whole shelf.';
    if (total.stickers === 50) return '50 stickers. Look at the shelf.';
    return null;
  }

  L.books = {
    SUGGESTED: SUGGESTED, HOW: HOW, STICKERS: STICKERS,
    shelf: shelf, totals: totals, days: days, praise: praise,
    placeSticker: placeSticker, coverHue: coverHue
  };
})(window);
