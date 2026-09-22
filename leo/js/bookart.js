/* bookart.js — a drawing at the head of every chapter.
 *
 * A wall of unbroken text is what a reluctant reader closes. A picture at the top
 * of a chapter does two things: it breaks the page, and it gives the eye somewhere
 * to arrive before the reading starts.
 *
 * Line art rather than pictures, for three reasons. It is a few hundred bytes
 * instead of a few hundred kilobytes, so nothing waits on a download. It takes its
 * colours from the CSS custom properties, so it is correct in dark mode without a
 * second set of files. And it stays sharp at whatever size the page is set to,
 * which matters when the reader can change the type size.
 *
 * Every drawing is a banner at 200x104 with a single accent colour, kept deliberately
 * plain — this is a mark on the page, not an illustration competing with the text.
 */
(function (root) {
  var A = {};
  var INK = 'var(--vstroke)', ACC = 'var(--v1)', WARM = 'var(--v2)', LEAF = 'var(--v3)',
      GOLD = 'var(--v4)', FAINT = 'var(--vfaint)';

  function svg(inner, title) {
    return '<svg viewBox="0 0 200 104" class="bkart" role="img" aria-label="' + (title || '') +
      '" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" ' +
      'stroke-linejoin="round">' + inner + '</g></svg>';
  }

  /* ---------------------------------------------- The Cave That Breathes */

  A.hillcrack = function () {
    return svg(
      '<path d="M8 88 C40 86 46 44 80 36 C112 28 126 62 158 64 C176 65 186 78 192 88 Z" fill="' + FAINT + '"/>' +
      /* An opening at the foot of the hill. Drawn first as a tapering wedge, which
         read as a black spike pointing at the sky rather than a way in. */
      '<path d="M88 88 C88 70 92 58 100 56 C109 58 113 70 113 88 Z" fill="' + INK + '" stroke="none"/>' +
      '<path d="M88 88 C88 70 92 58 100 56 C109 58 113 70 113 88" stroke="' + INK + '" fill="none"/>' +
      '<g stroke="' + ACC + '" stroke-width="2.4">' +
      '<path d="M116 58 q11 -5 22 0 t22 0"/>' +
      '<path d="M118 70 q11 -5 22 0 t22 0"/>' +
      '<path d="M120 82 q11 -5 22 0 t22 0"/></g>' +
      '<g stroke="' + LEAF + '" stroke-width="2">' +
      '<path d="M76 88 C76 76 82 70 88 68"/><path d="M84 88 C84 78 88 74 93 72"/>' +
      '<circle cx="79" cy="70" r="3.4" fill="' + LEAF + '" stroke="none"/>' +
      '<circle cx="88" cy="64" r="2.8" fill="' + LEAF + '" stroke="none"/>' +
      '<circle cx="72" cy="78" r="2.8" fill="' + LEAF + '" stroke="none"/></g>' +
      '<path d="M8 88 H192"/>', 'A fissure in a hillside with air flowing out of it');
  };

  A.handfeather = function () {
    return svg(
      '<path d="M150 14 V96" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M150 14 H192 V96 H150 Z" fill="' + INK + '" stroke="none" opacity=".88"/>' +
      '<g stroke="' + ACC + '"><path d="M96 34 q18 -6 34 2"/><path d="M92 52 q20 -6 38 2"/>' +
      '<path d="M96 70 q18 -6 34 2"/></g>' +
      '<g transform="rotate(-18 62 52)">' +
      '<path d="M62 26 C74 38 74 62 62 78 C50 62 50 38 62 26 Z" fill="' + GOLD + '" stroke="' + INK + '"/>' +
      '<path d="M62 26 V82" stroke="' + INK + '"/></g>' +
      '<path d="M20 60 q8 -10 18 -8" stroke="' + INK + '" opacity=".5"/>',
      'A feather drifting into a dark opening');
  };

  A.barometer = function () {
    return svg(
      '<path d="M100 8 l30 16 v52 l-30 20 l-30 -20 v-52 Z" fill="' + FAINT + '"/>' +
      '<circle cx="100" cy="50" r="26" fill="none" stroke="' + INK + '" stroke-width="2.6"/>' +
      '<circle cx="100" cy="50" r="3" fill="' + INK + '" stroke="none"/>' +
      '<path d="M100 50 L114 34" stroke="' + WARM + '" stroke-width="3"/>' +
      '<g stroke="' + INK + '" stroke-width="1.8" opacity=".75">' +
      '<path d="M100 26 v5"/><path d="M124 50 h-5"/><path d="M100 74 v-5"/><path d="M76 50 h5"/>' +
      '<path d="M83 33 l4 4"/><path d="M117 33 l-4 4"/></g>' +
      '<path d="M86 92 h28" stroke="' + INK + '"/>',
      'A barometer dial with its needle');
  };

  A.lamp = function () {
    return svg(
      '<g stroke="' + GOLD + '" stroke-width="2" opacity=".85">' +
      '<path d="M78 50 L26 24"/><path d="M78 56 L20 56"/><path d="M78 62 L26 88"/>' +
      '<path d="M122 50 L174 24"/><path d="M122 56 L180 56"/><path d="M122 62 L174 88"/></g>' +
      '<path d="M100 12 v8"/><path d="M88 20 h24"/>' +
      '<path d="M86 24 h28 l6 44 h-40 Z" fill="' + FAINT + '"/>' +
      '<path d="M100 38 c7 8 7 14 0 20 c-7 -6 -7 -12 0 -20 Z" fill="' + GOLD + '" stroke="' + INK + '"/>' +
      '<path d="M78 68 h44 l-4 10 h-36 Z" fill="' + INK + '" stroke="none" opacity=".85"/>',
      'A lantern throwing light into the dark');
  };

  A.fossil = function () {
    /* A logarithmic spiral, r = a*e^(k*t), sampled as a polyline. Built from arcs
       the first time, which came out looking like an eye rather than a shell. */
    var cx = 96, cy = 50, TURNS = Math.PI * 3.5, A0 = 3.6, K = 0.20;    // max radius ~32 in a frame 74 tall
    var pts = [], ribs = '', i, t, r;
    for (i = 0; i <= 140; i++) {
      t = i / 140 * TURNS;
      r = A0 * Math.exp(K * t);
      pts.push((cx + r * Math.cos(t - Math.PI)).toFixed(1) + ' ' + (cy + r * Math.sin(t - Math.PI)).toFixed(1));
    }
    for (i = 4; i <= 14; i++) {
      t = i / 14 * TURNS;
      r = A0 * Math.exp(K * t);
      var x1 = cx + r * Math.cos(t - Math.PI), y1 = cy + r * Math.sin(t - Math.PI);
      var x2 = cx + r * 0.72 * Math.cos(t - Math.PI), y2 = cy + r * 0.72 * Math.sin(t - Math.PI);
      ribs += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' +
        y2.toFixed(1) + '" stroke="' + WARM + '" stroke-width="1.5" opacity=".55"/>';
    }
    return svg(
      '<path d="M12 16 h176 v74 h-176 Z" fill="' + FAINT + '" stroke="none"/>' +
      '<g stroke="' + INK + '" stroke-width="1.3" opacity=".3">' +
      '<path d="M12 34 h176"/><path d="M12 56 h176"/><path d="M12 76 h176"/></g>' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + WARM + '" stroke-width="2.8"/>' +
      ribs + '<path d="M12 16 h176 v74 h-176 Z"/>',
      'A spiral shell set in the layers of a rock face');
  };

  A.seam = function () {
    return svg(
      '<path d="M18 14 h164 v76 h-164 Z" fill="' + FAINT + '" stroke="none"/>' +
      '<path d="M96 14 c8 20 -8 30 0 42 c8 14 -6 26 2 34" stroke="' + INK + '" stroke-width="7" opacity=".9"/>' +
      '<g stroke="' + ACC + '" stroke-width="2.4">' +
      '<path d="M40 40 h36"/><path d="M68 34 l8 6 l-8 6"/>' +
      '<path d="M40 64 h36"/><path d="M68 58 l8 6 l-8 6"/></g>' +
      '<path d="M18 14 h164 v76 h-164 Z"/>',
      'Air moving sideways into a narrow seam');
  };

  A.twomouths = function () {
    return svg(
      '<path d="M6 88 C36 86 44 40 82 32 C124 23 140 58 172 60 C184 61 192 74 196 88" fill="' + FAINT + '"/>' +
      '<path d="M28 84 C52 70 74 78 104 72 C136 66 150 74 172 68" stroke="' + INK + '" ' +
      'stroke-width="9" opacity=".22" fill="none"/>' +
      '<path d="M28 84 C52 70 74 78 104 72 C136 66 150 74 172 68" stroke="' + ACC + '" ' +
      'stroke-width="2.6" stroke-dasharray="7 6" fill="none"/>' +
      '<path d="M166 71 l8 -3 l-5 7" stroke="' + ACC + '" stroke-width="2.6"/>' +
      '<circle cx="28" cy="84" r="5" fill="' + INK + '" stroke="none"/>' +
      '<circle cx="172" cy="68" r="4" fill="' + INK + '" stroke="none"/>' +
      '<g stroke="' + LEAF + '"><path d="M24 88 q3 -8 8 -9"/><path d="M168 74 q3 -7 8 -8"/></g>' +
      '<path d="M6 88 H196"/>',
      'A hill with two openings and air passing between them');
  };

  /* ------------------------------------------------------ one per classic */

  A.rabbit = function () {
    return svg(
      '<path d="M62 92 c-14 0 -22 -12 -22 -24 c0 -14 10 -22 22 -22 c12 0 22 8 22 22 c0 12 -8 24 -22 24 Z" fill="' + FAINT + '"/>' +
      '<path d="M52 48 C46 26 48 12 54 10 C60 8 62 24 60 46"/>' +
      '<path d="M72 48 C78 26 76 12 70 10 C64 8 62 24 64 46"/>' +
      '<circle cx="54" cy="62" r="2.6" fill="' + INK + '" stroke="none"/>' +
      '<circle cx="70" cy="62" r="2.6" fill="' + INK + '" stroke="none"/>' +
      '<path d="M62 70 l-4 4 M62 70 l4 4"/>' +
      '<circle cx="140" cy="56" r="24" fill="none" stroke="' + INK + '" stroke-width="2.6"/>' +
      '<circle cx="140" cy="56" r="2.6" fill="' + INK + '" stroke="none"/>' +
      '<path d="M140 56 V40" stroke="' + WARM + '" stroke-width="2.8"/>' +
      '<path d="M140 56 l12 6" stroke="' + WARM + '" stroke-width="2.8"/>' +
      '<path d="M140 32 v-6 h-6 v-4 h12 v4 h-6"/>' +
      '<path d="M108 66 q-8 6 -10 14" opacity=".5"/>',
      'A rabbit and a pocket watch');
  };

  A.boat = function () {
    return svg(
      '<g stroke="' + LEAF + '" stroke-width="2.4">' +
      '<path d="M18 84 V46"/><path d="M28 84 V54"/><path d="M38 84 V42"/>' +
      '<path d="M174 84 V48"/><path d="M184 84 V56"/>' +
      '<path d="M18 46 q-5 -8 0 -12"/><path d="M38 42 q5 -9 0 -13"/><path d="M174 48 q-5 -8 0 -12"/></g>' +
      '<path d="M62 62 h78 l-12 20 h-54 Z" fill="' + FAINT + '"/>' +
      '<path d="M78 62 v-8 h12 v8"/>' +
      '<path d="M120 66 l26 -16" stroke="' + WARM + '" stroke-width="2.6"/>' +
      '<path d="M82 66 l-26 -16" stroke="' + WARM + '" stroke-width="2.6"/>' +
      '<g stroke="' + ACC + '" stroke-width="2.2" opacity=".8">' +
      '<path d="M50 90 q12 -6 24 0 t24 0 t24 0 t24 0"/></g>' +
      '<path d="M8 96 H192" opacity=".25"/>',
      'A little rowing boat among the reeds');
  };

  A.camel = function () {
    /* Fourth attempt, and the one that worked: a silhouette rather than an outline.
       Drawn in outline the body's curves showed every lump and it read as a sheep;
       filled solid, the parts merge and the shape carries — hump, long neck, small
       head, long legs is all a camel needs to be a camel. */
    var ink = '<g fill="' + INK + '" stroke="' + INK + '" stroke-width="2" stroke-linecap="round">';
    return svg(
      '<circle cx="26" cy="22" r="10" fill="' + GOLD + '" stroke="' + INK + '"/>' +
      ink +
      // legs
      '<path d="M72 70 V88" stroke-width="6"/><path d="M86 72 V88" stroke-width="6"/>' +
      '<path d="M104 72 V88" stroke-width="6"/><path d="M116 70 V88" stroke-width="6"/>' +
      // barrel of the body, and the hump sitting on it
      '<ellipse cx="94" cy="66" rx="29" ry="13"/>' +
      // the hump has to stand clearly proud of the back or the whole thing reads
      // as a brontosaurus, which is what the flatter version did
      '<path d="M78 62 C80 30 108 30 110 62 Z"/>' +
      // a short neck, not a long one — length here is the other half of the dinosaur
      '<path d="M114 58 C122 50 126 44 130 38" stroke-width="11" fill="none"/>' +
      '<ellipse cx="137" cy="33" rx="11" ry="7" transform="rotate(-28 137 33)"/>' +
      // tail
      '<path d="M66 62 C58 62 54 68 55 76" stroke-width="2.6" fill="none"/>' +
      '</g>' +
      '<circle cx="139" cy="30" r="1.7" fill="var(--vpaper)" stroke="none"/>' +
      '<g stroke="' + GOLD + '" stroke-width="2.4" opacity=".9">' +
      '<path d="M12 94 q12 -6 24 0"/><path d="M84 96 q12 -6 24 0"/><path d="M156 94 q12 -6 24 0"/></g>',
      'A camel with one hump under a hot sun');
  };

  A.pot = function () {
    return svg(
      '<path d="M66 40 h68 l-8 46 c-1 6 -6 8 -26 8 s-25 -2 -26 -8 Z" fill="' + INK + '" opacity=".9"/>' +
      '<path d="M60 36 h80 v6 h-80 Z" fill="' + INK + '" stroke="none"/>' +
      '<path d="M96 36 v-8 h8 v8"/>' +
      '<g stroke="' + GOLD + '" stroke-width="2.4">' +
      '<circle cx="86" cy="58" r="5" fill="' + GOLD + '"/>' +
      '<circle cx="104" cy="52" r="5" fill="' + GOLD + '"/>' +
      '<circle cx="116" cy="62" r="5" fill="' + GOLD + '"/></g>' +
      '<g stroke="' + INK + '" opacity=".45">' +
      '<path d="M26 94 q14 -4 28 0"/><path d="M148 94 q14 -4 28 0"/></g>' +
      '<path d="M30 40 q6 -10 14 -6" opacity=".4"/>',
      'A black pot with gold in it');
  };

  A.bed = function () {
    return svg(
      '<path d="M26 16 h62 v44 h-62 Z" fill="' + FAINT + '"/>' +
      '<path d="M26 16 h62 v44 h-62 Z"/><path d="M57 16 v44"/><path d="M26 38 h62"/>' +
      '<circle cx="72" cy="30" r="7.5" fill="' + GOLD + '" stroke="' + INK + '"/>' +
      '<g fill="' + GOLD + '" stroke="none">' +
      '<circle cx="40" cy="26" r="1.8"/><circle cx="44" cy="50" r="1.6"/><circle cx="72" cy="50" r="1.6"/></g>' +
      // headboard, mattress, blanket turned down, pillow, feet
      '<path d="M108 82 V44 h10 v38" fill="' + FAINT + '"/>' +
      '<path d="M178 82 V56 h8 v26" fill="' + FAINT + '"/>' +
      '<path d="M108 64 h78 v10 h-78 Z" fill="var(--vpaper)" stroke="' + INK + '"/>' +
      '<path d="M132 64 h54 v10 h-54 Z" fill="' + ACC + '" stroke="' + INK + '"/>' +
      '<path d="M114 58 h18 v8 h-18 Z" fill="var(--vpaper)" stroke="' + INK + '"/>' +
      '<path d="M100 92 H196" opacity=".3"/>',
      'A bed beside a window with the moon outside');
  };

  /* ------------------------------------------------------- Three Loud Things */

  A.hands = function () {
    return svg(
      // a desk edge, two sticks, and the beat coming off it
      '<path d="M18 68 H136 V78 H18 Z" fill="' + FAINT + '"/>' +
      '<path d="M18 68 H136 V78 H18 Z"/><path d="M28 78 V94"/><path d="M126 78 V94"/>' +
      '<g stroke="' + WARM + '" stroke-width="5" stroke-linecap="round">' +
      '<path d="M54 30 L70 62"/><path d="M104 26 L92 60"/></g>' +
      '<g stroke="' + ACC + '" stroke-width="2.6">' +
      '<path d="M148 42 q9 -7 18 0"/><path d="M148 56 q9 -7 18 0"/><path d="M148 70 q9 -7 18 0"/>' +
      '<path d="M170 34 q11 -9 22 0"/><path d="M170 52 q11 -9 22 0"/></g>' +
      '<circle cx="70" cy="64" r="4" fill="' + WARM + '" stroke="none"/>' +
      '<circle cx="92" cy="62" r="4" fill="' + WARM + '" stroke="none"/>',
      'Two drumsticks on the edge of a desk, with the beat coming off it');
  };

  A.listbook = function () {
    return svg(
      '<path d="M34 24 h132 v62 h-132 Z" fill="' + FAINT + '"/>' +
      '<path d="M34 24 h132 v62 h-132 Z"/><path d="M100 24 v62"/>' +
      '<g stroke="' + INK + '" stroke-width="1.8" opacity=".45">' +
      '<path d="M44 40 h46"/><path d="M44 52 h46"/><path d="M44 64 h30"/>' +
      '<path d="M110 40 h46"/><path d="M110 52 h30"/></g>' +
      // four marks, and a great deal of room left over
      '<g stroke="' + WARM + '" stroke-width="2.6">' +
      '<path d="M112 64 l4 4 l7 -9"/><path d="M126 64 l4 4 l7 -9"/>' +
      '<path d="M140 64 l4 4 l7 -9"/><path d="M112 76 l4 4 l7 -9"/></g>' +
      '<path d="M170 88 l14 -14" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M183 75 l6 -6 l5 5 l-6 6 Z" fill="' + GOLD + '" stroke="' + INK + '"/>',
      'An open book with only four small marks on the page');
  };

  A.weather = function () {
    return svg(
      // rain a long way off, and a window with nobody's fault in it
      '<g stroke="' + INK + '" opacity=".28">' +
      '<path d="M116 26 c-8 -10 -24 -8 -28 4 c-12 -1 -18 9 -14 17 h56 c6 -8 0 -20 -14 -21 Z" fill="' + FAINT + '"/></g>' +
      '<g stroke="' + ACC + '" stroke-width="2.4" opacity=".8">' +
      '<path d="M92 54 l-5 12"/><path d="M106 54 l-5 12"/><path d="M120 54 l-5 12"/>' +
      '<path d="M99 70 l-4 9"/><path d="M113 70 l-4 9"/></g>' +
      '<path d="M18 22 h48 v60 h-48 Z" fill="var(--vpaper)"/>' +
      '<path d="M18 22 h48 v60 h-48 Z"/><path d="M42 22 v60"/><path d="M18 52 h48"/>' +
      '<path d="M14 84 h56" stroke="' + INK + '" stroke-width="3"/>' +
      '<g stroke="' + GOLD + '" stroke-width="2.2"><path d="M150 84 q12 -7 24 0"/></g>' +
      '<path d="M8 94 H192" opacity=".22"/>',
      'A window with rain falling a long way off');
  };

  A.render = function (name) { return A[name] ? A[name]() : ''; };
  root.LEO = root.LEO || {};
  root.LEO.bookart = A;
})(window);
