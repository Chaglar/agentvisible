/* reader.js — reading the books inside the app.
 *
 * Five complete books, not extracts. All five are public domain (Gutenberg
 * #11, #289, #2781, #7439, #25609), so the full text is here legitimately rather
 * than by anyone's indulgence. Each is a JSON file under /leo/books/, fetched only
 * when opened, so the app does not carry a megabyte it may never use.
 *
 * Three things here exist for this reader in particular:
 *
 *   - TAP A WORD TO HEAR IT. Decoding is the bottleneck and he reads better
 *     silently than aloud, which means the usual repair — "sound it out" — is the
 *     one thing that does not help. Tapping a word speaks it. He keeps reading
 *     instead of stopping at the wall, and nobody has to be sitting next to him.
 *     Built on the browser's own speech synthesis: no key, no cost, no upload.
 *
 *   - TYPE SIZE AND SPACING ARE HIS TO SET. Larger type with generous leading and
 *     a short line is the adjustment that helps most readers who find text
 *     crowded, and the setting is remembered.
 *
 *   - IT REMEMBERS WHERE HE WAS. Position is saved per chapter as he scrolls, so
 *     picking a book back up is one tap rather than a hunt.
 *
 * Finishing a chapter offers the sticker straight away — the shelf and the reader
 * are the same thing, so reading in the app records itself.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var PREFS = 'leo.reader.prefs';
  var SIZES = [17, 19, 21, 24, 28];

  function prefs() {
    try { return Object.assign({ size: 1, serif: false }, JSON.parse(localStorage.getItem(PREFS) || '{}')); }
    catch (e) { return { size: 1, serif: false }; }
  }
  function savePrefs(p) { try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {} }

  var cache = {};
  function load(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch('books/' + id + '.json').then(function (r) {
      if (!r.ok) throw new Error('could not load that book');
      return r.json();
    }).then(function (b) { cache[id] = b; return b; });
  }
  function index() {
    if (cache.__index) return Promise.resolve(cache.__index);
    return fetch('books/index.json').then(function (r) { return r.json(); })
      .then(function (ix) { cache.__index = ix; return ix; });
  }

  /* Wrap every word so a tap can identify it. Punctuation stays outside the span so
     the spoken word is the word, not "Alice," with the comma read as a pause. */
  function speakable(text) {
    return text.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; })
      .replace(/([A-Za-z’'\-]{2,})/g, '<w>$1</w>');
  }

  function say(word) {
    try {
      if (!root.speechSynthesis) return false;
      root.speechSynthesis.cancel();
      var u = new root.SpeechSynthesisUtterance(word.replace(/[’']s$/, "'s"));
      u.rate = 0.75;                       // slow enough to hear the parts of the word
      u.lang = 'en-AU';
      root.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  var canSpeak = !!(root.speechSynthesis && root.SpeechSynthesisUtterance);

  /* Where he had got to, per chapter. Kept on the device: it is a scroll offset, not
     progress worth syncing, and it would only fight between two screen sizes. */
  function mark(id, ch, ratio) {
    try {
      var m = JSON.parse(localStorage.getItem('leo.reader.at') || '{}');
      m[id] = { ch: ch, at: ratio, t: Date.now() };
      localStorage.setItem('leo.reader.at', JSON.stringify(m));
    } catch (e) {}
  }
  function lastAt(id) {
    try { return (JSON.parse(localStorage.getItem('leo.reader.at') || '{}'))[id] || null; }
    catch (e) { return null; }
  }

  function chapterHTML(book, i) {
    var c = book.chapters[i];
    return '<h2 class="rdTitle">' + c.t + '</h2>' +
      c.p.map(function (p) {
        return book.verse
          ? '<p class="verse">' + speakable(p).replace(/\n/g, '<br>') + '</p>'
          : '<p>' + speakable(p) + '</p>';
      }).join('');
  }

  L.reader = {
    SIZES: SIZES, prefs: prefs, savePrefs: savePrefs,
    load: load, index: index, chapterHTML: chapterHTML,
    say: say, canSpeak: canSpeak, mark: mark, lastAt: lastAt
  };
})(window);
