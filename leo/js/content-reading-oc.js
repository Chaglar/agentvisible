/* content-reading-oc.js — the OC reading paper's harder shapes.
 *
 * Written after reading an actual OC reading sample, which was harder than the rest
 * of this bank had assumed. That paper ran a ~900-word Victorian folk tale beside a
 * Mark Twain extract and asked the child to compare how each treats luck; then a
 * Tennyson poem whose subject — death — is never once named; then four dense
 * policy-prose extracts to match statements against.
 *
 * Three things follow from that, and this file exists for them:
 *
 *   1. EXTRACT MATCHING. Several short texts, labelled, and a statement to place
 *      against one of them. The answer options are the labels themselves, so the
 *      generator must not shuffle them (see `fixed` below). The skill is scanning
 *      and discriminating, not reading start to finish — a different thing from
 *      comprehension and not otherwise exercised anywhere in the app.
 *
 *   2. PAIRED TEXTS. Two extracts on one idea, and a question that can only be
 *      answered by holding both in mind at once. The real paper's hardest question
 *      was of this kind.
 *
 *   3. A POEM THAT WITHHOLDS ITS SUBJECT. Tennyson's poem never says "death"; the
 *      whole task is to arrive at it from a metaphor sustained over sixteen lines.
 *      The poems earlier in this bank state their contrast outright, which is a
 *      gentler exercise. This one does not.
 *
 * Register is deliberately heavier here than elsewhere in the bank — longer
 * sentences, more abstract nouns, vocabulary supported by context rather than
 * avoided. That is what the real paper does, and meeting it for the first time on
 * test day is the thing to avoid.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var C = L.content;
  if (!C || !C.PASSAGES) return;

  /* Four short texts, laid out the way the paper lays them out. */
  function extracts(items) {
    return '<div class="extracts">' + items.map(function (t, i) {
      return '<div class="ex"><b class="lbl">' + 'ABCD'[i] + '</b>' + t + '</div>';
    }).join('') + '</div>';
  }
  function paired(a, b) {
    return '<div class="extracts paired"><div class="ex"><b class="lbl">A</b>' + a +
           '</div><div class="ex"><b class="lbl">B</b>' + b + '</div></div>';
  }
  var ABCD = ['A', 'B', 'C', 'D'];

  var MORE = [

    /* ------------------------------------------------ extract matching, level 4 */
    { lv: 4, kind: 'matching', theme: 'minerals', title: 'Four Ways a Rock Is Made',
      text: extracts([
        'Molten rock that cools while still underground has time to grow large, interlocking crystals. Granite is the familiar result: you can pick out separate grains of quartz, feldspar and mica with the naked eye. Cooling at the surface instead gives the same material almost no time, and the crystals stay microscopic or fail to form at all.',
        'Wind, ice and running water break existing rock into fragments and carry them away. Where the water slows, the load settles, layer upon layer, and the weight of what arrives later presses what came earlier into stone. Because the layers settle in order, the lower ones are almost always the older.',
        'Rock that is buried deep enough is altered without ever melting. Heat and pressure force its minerals to recrystallise into new arrangements, often in bands. Limestone treated this way becomes marble; shale becomes slate, which splits into the flat sheets that roof old houses.',
        'A small fraction of the rock on Earth did not begin here. Meteorites arrive already formed, and the iron ones are fragments of the core of a body that broke apart long ago. Some carry minerals that cannot form under the conditions found anywhere on this planet’s surface.'
      ]),
      qs: [
        { p: 'Which extract explains why deeper layers are usually older?', c: ABCD, a: 1, fixed: true, skill: 'text structure',
          e: 'B: “Because the layers settle in order, the lower ones are almost always the older.”' },
        { p: 'Which extract describes rock changing without melting?', c: ABCD, a: 2, fixed: true, skill: 'comprehension',
          e: 'C: “altered without ever melting… forced to recrystallise”.' },
        { p: 'Which extract explains why some rock has crystals too small to see?', c: ABCD, a: 0, fixed: true, skill: 'inference',
          e: 'A: cooling at the surface gives “almost no time”, so crystals stay microscopic.' },
        { p: 'Which extract refers to material that formed somewhere other than Earth?', c: ABCD, a: 3, fixed: true, skill: 'comprehension',
          e: 'D: “did not begin here… fragments of the core of a body that broke apart”.' }
      ] },

    /* ------------------------------------------------ extract matching, level 5 */
    { lv: 5, kind: 'matching', theme: 'fungi', title: 'What Fungi Do for a Living',
      text: extracts([
        'The decomposers make the rest of life possible. Without organisms able to break the tough polymer lignin back down, fallen wood would simply accumulate, and for a stretch of the Carboniferous period it appears to have done exactly that, laying down much of the coal we now burn. Decay is not the opposite of growth; it is its precondition.',
        'Some species have abandoned independence altogether. A lichen is not one organism but a partnership — a fungus providing structure and moisture, an alga or a bacterium providing food made from sunlight. The arrangement is so successful that lichens colonise bare rock where nothing else can establish, and their slow chemical work is one of the ways soil first appears.',
        'A minority are parasites, drawing nourishment from a living host rather than a dead one. The consequences can be economic as well as ecological: a single rust fungus can reduce a wheat harvest across an entire region, and plantation forestry has repeatedly been reshaped by outbreaks nobody anticipated.',
        'A great many are quietly indispensable to agriculture without being noticed at all. Threads wrapped around crop roots extend the volume of soil a plant can draw on, and in exchange take sugar the plant makes above ground. Ploughing disturbs these networks, which is one argument advanced for cultivating land less aggressively.'
      ]),
      qs: [
        { p: 'Which extract suggests a reason to change a farming practice?', c: ABCD, a: 3, fixed: true, skill: 'inference',
          e: 'D: ploughing disturbs the root networks, “which is one argument advanced for cultivating land less aggressively”.' },
        { p: 'Which extract connects fungi to a fuel we use today?', c: ABCD, a: 0, fixed: true, skill: 'comprehension',
          e: 'A: wood accumulating in the Carboniferous “laying down much of the coal we now burn”.' },
        { p: 'Which extract describes two different kinds of living thing functioning as one?', c: ABCD, a: 1, fixed: true, skill: 'comprehension',
          e: 'B: a lichen is “not one organism but a partnership”.' },
        { p: 'Which extract is most concerned with harm to human interests?', c: ABCD, a: 2, fixed: true, skill: 'evaluation',
          e: 'C is the only one framing fungi as a cost — a lost wheat harvest, reshaped forestry.' },
        { p: 'Which extract argues that something usually thought of as negative is necessary?', c: ABCD, a: 0, fixed: true, skill: 'evaluation',
          e: 'A: “Decay is not the opposite of growth; it is its precondition.”' }
      ] },

    /* ------------------------------------------------------ paired texts, level 5 */
    { lv: 5, kind: 'paired', theme: 'making', title: 'Two Views of a Mistake',
      text: paired(
        'The workshop rule was absolute, and the old man stated it on the first morning as though reading a law: a ruined piece is never thrown out on the day it is ruined. It goes on the high shelf. You may take it down in a month and look at it, and by then you will see the thing you could not see while your ears were still hot. He had a shelf of them himself, going back forty years, and he could tell you from across the room what each one had taught him and precisely how much it had cost.',
        'Modern manufacturing takes a colder view. A defect is not a lesson but a signal of a process out of tolerance, and the correct response is neither to preserve it nor to feel anything about it, but to identify the step at which variation entered and adjust it. Sentiment about failures is regarded as a hindrance: the factory that keeps a shelf of its mistakes is spending floor space on something a control chart records more accurately and far more cheaply.'
      ),
      qs: [
        { p: 'What is the essential difference between the two views?', c: [
            'One treats a mistake as something to learn from personally, the other as data to correct a process',
            'One thinks mistakes matter and the other thinks they do not',
            'One is about wood and the other is about metal',
            'One is old-fashioned and therefore wrong'
          ], a: 0, skill: 'evaluation',
          e: 'A keeps the object because of what it teaches the person; B discards it because the useful information is in the measurement, not the object.' },
        { p: 'Both extracts agree that', c: [
            'a mistake carries information worth acting on',
            'mistakes should be kept on a shelf',
            'workers should not be told about defects',
            'mistakes are mostly unavoidable'
          ], a: 0, skill: 'inference',
          e: 'They disagree entirely about what to do, but neither treats a mistake as meaningless — one extracts a lesson, the other a measurement.' },
        { p: '“While your ears were still hot” suggests that immediately after a mistake a person is', c: [
            'too embarrassed or angry to judge it clearly',
            'physically unwell',
            'unable to hear instructions',
            'working too fast'
          ], a: 0, skill: 'vocabulary',
          e: 'Hot ears stand for the flush of embarrassment; the point of the month’s wait is that judgement returns once it passes.' },
        { p: 'The phrase “as though reading a law” tells you the rule was delivered', c: [
            'as something not open to discussion',
            'from a written book of rules',
            'in a bored voice',
            'as a joke'
          ], a: 0, skill: 'tone',
          e: 'The comparison is about authority, not about actual reading — it sets up “absolute” in the same sentence.' }
      ] },

    /* --------------------------------------------- poem that withholds it, level 5 */
    { lv: 5, kind: 'poem', theme: 'minerals', title: 'In the Quarry Wall',
      text: '<div class="verse">It was not buried. It was only left<br>where it lay down, and the mud kept coming,<br>patient as a clerk, filing the years above it.<br><br>No one was here to be sorry.<br>There were no eyes yet anywhere on the earth<br>that could have made a witness of the day.<br><br>Now the drill finds the seam and the wall opens<br>and a shape resolves that nothing living has worn<br>for two hundred million turns around the sun —<br><br>and the first thing to look at it<br>is a boy in a yellow hat,<br>holding his breath, not quite believing<br>that the world kept anything at all.</div>',
      qs: [
        { p: 'What is the poem about?', c: [
            'A fossil being uncovered',
            'A mine collapsing',
            'A boy who is lost',
            'A river changing course'
          ], a: 0, skill: 'main idea',
          e: 'The poem never uses the word. You assemble it: something lay down, mud covered it for two hundred million years, and a drill exposes it in a quarry wall.' },
        { p: '“Patient as a clerk, filing the years above it” compares the build-up of mud to', c: [
            'steady, unhurried record-keeping',
            'a violent burial',
            'someone losing papers',
            'a clock striking'
          ], a: 0, skill: 'evaluation',
          e: 'A clerk files one thing at a time without hurry, which is how the layers arrive — and each layer is itself a record.' },
        { p: 'Why does the poem say “No one was here to be sorry”?', c: [
            'To stress that the death happened before any creature could witness it',
            'To say that nobody cared about the animal',
            'To suggest the boy should feel guilty',
            'To explain that the quarry was empty that day'
          ], a: 0, skill: 'inference',
          e: 'The next two lines spell it out: there were no eyes anywhere on earth yet.' },
        { p: 'The last line suggests the boy is surprised that', c: [
            'anything from so long ago survived at all',
            'the quarry is still being worked',
            'he was allowed into the quarry',
            'the fossil is smaller than expected'
          ], a: 0, skill: 'tone',
          e: '“Not quite believing that the world kept anything at all” — the surprise is that survival was possible, not what the thing is.' }
      ] }
  ];

  MORE.forEach(function (p) { C.PASSAGES.push(p); });
})(window);
