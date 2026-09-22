/* coach.js — the after-the-test teaching step.
 *
 * Written for how Leo actually learns, from his assessments:
 *   - visual-spatial reasoning is his strongest channel (98th percentile)
 *   - auditory working memory is his weakest (digit span 25th percentile)
 *   - processing speed is low (6th percentile), so he needs the method, not speed
 *
 * So every lesson follows the same shape: ONE short line at a time, each carried by
 * a picture, ending in a single sentence worth remembering. No long verbal chains, no
 * rules to memorise by ear, no paragraph a 7-year-old has to hold in his head.
 *
 * LEO.coach.lessonFor(topic, sub) -> { title, steps:[{say, visual}], remember }
 */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var V = L.vis;
  var C = V.C;
  // local copy so this file does not depend on bank.js having loaded first
  function fr(n, d) { return '<span class="fr"><i>' + n + '</i><b>' + d + '</b></span>'; }

  function arr(rows, cols, color) { return { type: 'array', rows: rows, cols: cols, cell: 26, color: color || C[0] }; }
  function chain(items) { return { type: 'seq', items: items.map(String), cell: 54 }; }
  function bar(parts, total) { return { type: 'barModel', parts: parts, total: total }; }

  var LESSONS = {

    /* ---------------- multiplication and division ---------------- */
    'multdiv:8 times table': {
      title: 'Eights are doubles, three times over',
      steps: [
        { say: 'You do not have to remember the eights. You can build them.', visual: arr(8, 6) },
        { say: 'Start with the number. Double it. Double again. Double again.', visual: chain([6, 12, 24, 48]) },
        { say: 'So 8 × 6 = 48. Three doubles, and you are there.', visual: arr(8, 6, C[2]) }
      ],
      remember: '8 × anything = double, double, double.'
    },
    'multdiv:7 times table': {
      title: 'Sevens split into fives and twos',
      steps: [
        { say: 'Sevens are hard to chant. So do not chant them — split them.', visual: arr(7, 6) },
        { say: '7 rows is 5 rows and 2 rows. You already know both of those.', visual: arr(5, 6, C[0]) },
        { say: '5 × 6 = 30. 2 × 6 = 12. Put them together: 42.', visual: bar([{ label: '30', size: 30, color: C[0] }, { label: '12', size: 12, color: C[1] }], '7 × 6 = 42') }
      ],
      remember: '7 × n = (5 × n) + (2 × n).'
    },
    'multdiv:6 times table': {
      title: 'Sixes are double the threes',
      steps: [
        { say: 'If you know the threes, you know the sixes.', visual: arr(3, 7) },
        { say: '3 × 7 = 21. Six is double three, so double the answer.', visual: chain([21, 42]) },
        { say: '6 × 7 = 42.', visual: arr(6, 7, C[2]) }
      ],
      remember: 'Sixes = threes, doubled.'
    },
    'multdiv:9 times table': {
      title: 'Nines are tens minus one lot',
      steps: [
        { say: 'Nine is one less than ten. Tens are easy.', visual: arr(10, 6) },
        { say: '10 × 6 = 60. Now take away one 6.', visual: bar([{ label: '54', size: 54, color: C[2] }, { label: '6', size: 6, color: C[1] }], '10 × 6 = 60') },
        { say: '60 − 6 = 54. So 9 × 6 = 54.', visual: arr(9, 6, C[2]) }
      ],
      remember: '9 × n = (10 × n) − n.'
    },
    'multdiv:Division': {
      title: 'Division is multiplication walking backwards',
      steps: [
        { say: 'Do not think “divide”. Think: how many rows fit?', visual: arr(8, 7) },
        { say: '56 ÷ 8 is asking — how many 8s make 56?', visual: { type: 'skip', step: 8, jumps: 7, hideLast: false } },
        { say: 'Count the jumps: seven of them. So 56 ÷ 8 = 7.' }
      ],
      remember: 'Divide = "how many of these fit inside that?"'
    },
    'multdiv:Division with remainder': {
      title: 'Leftovers are allowed',
      steps: [
        { say: 'Share them out fairly first. Give everyone the same.', visual: { type: 'groups', groups: 4, per: 3, sym: '🍬' } },
        { say: 'Whatever will not make another full group stays out.', visual: { type: 'emojiRow', items: ['🍬', '🍬'], cell: 34 } },
        { say: 'Those two are the remainder. The answer has two parts: how many each, and how many left.' }
      ],
      remember: 'Fill the groups. What cannot fill one more is the remainder.'
    },
    'multdiv:Missing factor': {
      title: 'A missing factor is a division in disguise',
      steps: [
        { say: '8 × ☐ = 56 looks scary. It is not.', visual: arr(8, 7) },
        { say: 'Turn it around: 56 ÷ 8. How many 8s in 56?', visual: { type: 'skip', step: 8, jumps: 7 } },
        { say: 'Seven. So the box is 7.' }
      ],
      remember: 'Box in a times sum → flip it into a divide.'
    },
    'multdiv:Doubling': {
      title: 'Doubling is just the number twice',
      steps: [
        { say: 'Double means two of the same, added up.', visual: { type: 'tenframe', frames: [7, 7] } },
        { say: '7 and 7 more. Fill the first ten, then carry on: 14.' }
      ],
      remember: 'Double = the number + itself.'
    },
    'multdiv:Halving': {
      title: 'Halving is sharing into two fair piles',
      steps: [
        { say: 'Split it into two piles that match exactly.', visual: { type: 'groups', groups: 2, per: 4, sym: '⭐' } },
        { say: 'If the piles are not equal, it is not half.' }
      ],
      remember: 'Half = two equal piles.'
    },
    'multdiv:Two-step': {
      title: 'Two steps means stop in the middle',
      steps: [
        { say: 'Do the times first. Always the times first.', visual: arr(7, 5) },
        { say: '7 × 5 = 35. Say that number out loud before you go on.', visual: chain([35]) },
        { say: 'Now add the rest. 35 + 12 = 47. Two steps, two answers.' }
      ],
      remember: 'Times first. Write the middle number down.'
    },
    'multdiv': {
      title: 'Groups and rows',
      steps: [
        { say: 'Times means equal groups. Nothing more.', visual: { type: 'groups', groups: 3, per: 4, sym: '🍎' } },
        { say: '3 groups of 4 is the same as 3 rows of 4.', visual: arr(3, 4) },
        { say: 'Count them: 12. Both ways give the same answer.' }
      ],
      remember: 'Rows × how many in a row.'
    },

    /* ---------------- fractions ---------------- */
    'fractions:Naming fractions': {
      title: 'The bottom number counts every piece',
      steps: [
        { say: 'Count ALL the pieces first. That is the bottom number.', visual: { type: 'fracShape', shape: 'bar', parts: 8, shaded: 0, w: 300 } },
        { say: 'Eight pieces. So the bottom is 8.' },
        { say: 'Now count only the coloured ones. That is the top.', visual: { type: 'fracShape', shape: 'bar', parts: 8, shaded: 3, w: 300 } },
        { say: 'Three coloured, eight altogether: ' + fr(3, 8) + '.' }
      ],
      remember: 'Bottom = all the pieces. Top = the coloured ones.'
    },
    'fractions:Halves': {
      title: 'Half means the two pieces match',
      steps: [
        { say: 'Two pieces only — and they must be the same size.', visual: { type: 'fracShape', shape: 'circle', parts: 2, shaded: 1 } },
        { say: 'If one piece is bigger, it is not half.' }
      ],
      remember: 'Half = 2 equal pieces, 1 of them.'
    },
    'fractions:Quarters': {
      title: 'Quarters come from halving twice',
      steps: [
        { say: 'Cut it in half.', visual: { type: 'fracShape', shape: 'bar', parts: 2, shaded: 1, w: 300 } },
        { say: 'Now cut each half in half again. Four pieces.', visual: { type: 'fracShape', shape: 'bar', parts: 4, shaded: 1, w: 300 } },
        { say: 'One of four is a quarter: ' + fr(1, 4) + '.' }
      ],
      remember: 'Halve it twice and you get quarters.'
    },
    'fractions:Folding in half': {
      title: 'Every fold doubles the pieces',
      steps: [
        { say: 'One fold makes 2 pieces.', visual: { type: 'fracShape', shape: 'bar', parts: 2, shaded: 0, w: 300 } },
        { say: 'Two folds make 4.', visual: { type: 'fracShape', shape: 'bar', parts: 4, shaded: 0, w: 300 } },
        { say: 'Three folds make 8. The pieces double each time.', visual: { type: 'fracShape', shape: 'bar', parts: 8, shaded: 0, w: 300 } }
      ],
      remember: '2, 4, 8 — one more fold, twice as many pieces.'
    },
    'fractions:Fraction of a group': {
      title: 'Share first, then take',
      steps: [
        { say: 'You want ' + fr(2, 3) + ' of 12. Do not guess. Share first.', visual: { type: 'emojiRow', items: ['🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬', '🍬'], cell: 28 } },
        { say: 'The bottom number says how many groups. Three groups.', visual: { type: 'groups', groups: 3, per: 4, sym: '🍬' } },
        { say: 'Four in each group. The top number says how many groups to take. Take two: 8.' }
      ],
      remember: 'Bottom = how many groups. Top = how many you take.'
    },
    'fractions:Fraction of a big group': {
      title: 'Same trick, bigger numbers',
      steps: [
        { say: 'Divide by the bottom number first. Always first.' },
        { say: '24 pencils, and you want ' + fr(3, 8) + '. So 24 ÷ 8 = 3 in each part.', visual: bar([{ label: '3', size: 1, color: C[0] }, { label: '3', size: 1, color: C[0] }, { label: '3', size: 1, color: C[0] }, { label: '', size: 1, color: 'var(--vfaint)' }, { label: '', size: 1, color: 'var(--vfaint)' }, { label: '', size: 1, color: 'var(--vfaint)' }, { label: '', size: 1, color: 'var(--vfaint)' }, { label: '', size: 1, color: 'var(--vfaint)' }], '24 pencils in 8 parts') },
        { say: 'Then take 3 of those parts: 3 × 3 = 9.' }
      ],
      remember: 'Divide by the bottom, multiply by the top.'
    },
    'fractions:Comparing fractions': {
      title: 'A bigger bottom means smaller pieces',
      steps: [
        { say: 'This is the one that catches everybody. Watch.', visual: { type: 'fracShape', shape: 'bar', parts: 2, shaded: 1, w: 300 } },
        { say: 'One half is a big piece.' },
        { say: 'Now one eighth. Same cake, but cut into more pieces.', visual: { type: 'fracShape', shape: 'bar', parts: 8, shaded: 1, w: 300 } },
        { say: 'More pieces means each one is smaller. So ' + fr(1, 2) + ' is bigger than ' + fr(1, 8) + ', even though 8 is a bigger number.' }
      ],
      remember: 'Big bottom number → small pieces.'
    },
    'fractions:Ordering fractions': {
      title: 'Picture the cake, not the numbers',
      steps: [
        { say: 'Do not compare the numbers. Compare the pieces.' },
        { say: 'Half is half. Quarter is less. Three quarters is more.', visual: { type: 'fracShape', shape: 'bar', parts: 4, shaded: 3, w: 300 } },
        { say: 'Line them up by how much cake you actually get.' }
      ],
      remember: 'Draw it, then order it.'
    },
    'fractions:Equivalent fractions': {
      title: 'Same amount, more cuts',
      steps: [
        { say: 'Here is one half.', visual: { type: 'fracShape', shape: 'bar', parts: 2, shaded: 1, w: 300 } },
        { say: 'Now cut every piece in two. Nothing was eaten. Nothing was added.', visual: { type: 'fracShape', shape: 'bar', parts: 4, shaded: 2, w: 300 } },
        { say: 'It is still the same amount of cake: ' + fr(1, 2) + ' = ' + fr(2, 4) + '. Top and bottom both doubled.' }
      ],
      remember: 'Do the same thing to top and bottom, and the amount stays the same.'
    },
    'fractions:Fractions on a number line': {
      title: 'Count the jumps, not the lines',
      steps: [
        { say: '0 to 1 is cut into equal jumps. Count the jumps.', visual: { type: 'fracLine', den: 5, mark: 0 } },
        { say: 'Five jumps, so the bottom number is 5.' },
        { say: 'Now count how many jumps to the arrow. Three. That is ' + fr(3, 5) + '.', visual: { type: 'fracLine', den: 5, mark: 3 } }
      ],
      remember: 'Count jumps between 0 and 1, not the tick marks.'
    },
    'fractions:Adding fractions': {
      title: 'Same bottom? Just add the tops',
      steps: [
        { say: 'The bottom number is the size of the piece. It does not change.', visual: { type: 'fracShape', shape: 'bar', parts: 5, shaded: 2, w: 300 } },
        { say: 'Two fifths plus two fifths. Add only how many pieces.', visual: { type: 'fracShape', shape: 'bar', parts: 5, shaded: 4, w: 300 } },
        { say: '2 + 2 = 4, so ' + fr(4, 5) + '. The 5 stays 5.' }
      ],
      remember: 'Add the tops. Leave the bottom alone.'
    },
    'fractions:Mixed numbers': {
      title: 'A whole one is all of its pieces',
      steps: [
        { say: 'One whole cut into quarters is 4 quarters.', visual: { type: 'fracShape', shape: 'circle', parts: 4, shaded: 4 } },
        { say: 'So 1 and ' + fr(3, 4) + ' is 4 quarters plus 3 more.' },
        { say: 'That is 7 quarters altogether.' }
      ],
      remember: 'Turn each whole into pieces first, then add the extras.'
    },
    'fractions': {
      title: 'What a fraction really says',
      steps: [
        { say: 'The bottom number tells you how many equal pieces.', visual: { type: 'fracShape', shape: 'circle', parts: 4, shaded: 0 } },
        { say: 'The top number tells you how many you have.', visual: { type: 'fracShape', shape: 'circle', parts: 4, shaded: 3 } },
        { say: 'Equal is the important word. Uneven pieces are not fractions.' }
      ],
      remember: 'Equal pieces below, how many you have above.'
    },

    /* ---------------- addition and subtraction ---------------- */
    'addsub:Regrouping': {
      title: 'Ten ones become one ten',
      steps: [
        { say: 'Add the ones first. 7 + 5 = 12.', visual: { type: 'tenframe', frames: [7, 5] } },
        { say: 'Twelve is too many ones. Trade ten of them for one ten.', visual: { type: 'mab', h: 0, t: 1, o: 2 } },
        { say: 'Keep the 2, carry the 1 across to the tens.' }
      ],
      remember: 'Ten ones swap for one ten. That is all carrying is.'
    },
    'addsub:Missing part': {
      title: 'Whole minus the part you have',
      steps: [
        { say: 'Draw the bar. The whole on top, the part you know underneath.', visual: bar([{ label: '51', size: 51, color: C[0] }, { label: '?', size: 36, color: C[1] }], '87 altogether') },
        { say: 'The gap is what is missing. 87 − 51 = 36.' }
      ],
      remember: 'Draw the bar and the answer shows itself.'
    },
    'addsub:Two-step problem': {
      title: 'One step at a time, out loud',
      steps: [
        { say: 'Two-step problems go wrong when you try to hold both steps at once.' },
        { say: 'Step 1: 350 + 130 = 480. Write 480 down.', visual: chain([350, '+130', 480]) },
        { say: 'Step 2: now use 480. 480 − 122 = 358.' }
      ],
      remember: 'Write the middle answer down. Do not keep it in your head.'
    },
    'addsub:Word problem': {
      title: 'Find the two numbers and the one word',
      steps: [
        { say: 'Circle the two numbers. Then find the word that says what to do.' },
        { say: '“Left”, “took away”, “gave” → take away. “Altogether”, “more”, “both” → add.' },
        { say: 'Then draw the bar and work it out.', visual: bar([{ label: '142', size: 142, color: C[0] }, { label: '?', size: 359, color: C[1] }], '501 books') }
      ],
      remember: 'Two numbers, one action word, then draw it.'
    },
    'addsub': {
      title: 'Tens first, then ones',
      steps: [
        { say: 'Break the number up. 38 is 30 and 8.', visual: { type: 'mab', h: 0, t: 3, o: 8 } },
        { say: 'Add the tens together, then the ones, then put them back.' }
      ],
      remember: 'Split into tens and ones. Add each. Join them back.'
    },

    /* ---------------- number ---------------- */
    'number:Digit value': {
      title: 'Where a digit sits decides what it is worth',
      steps: [
        { say: 'The same digit is worth different amounts depending on its seat.', visual: { type: 'mab', h: 3, t: 4, o: 2 } },
        { say: 'In 342, the 3 is not three. It is three hundreds.' },
        { say: 'Count the seats from the right: ones, tens, hundreds, thousands.' }
      ],
      remember: 'Check the seat before you say the value.'
    },
    'number:Rounding': {
      title: 'Which one is closer?',
      steps: [
        { say: 'Rounding is not a rule to remember. It is a question: which is nearer?', visual: { type: 'numline', min: 40, max: 50, step: 1, sparse: 5, marks: [{ v: 47, label: '47' }] } },
        { say: '47 sits between 40 and 50. It is closer to 50.' },
        { say: 'Halfway or more → go up. Less than halfway → go down.' }
      ],
      remember: 'Draw the line and look at which end is closer.'
    },
    'number:Comparing': {
      title: 'Compare from the left',
      steps: [
        { say: 'Start at the biggest seat, not the last digit.' },
        { say: '481 and 419. Hundreds match. Look at the tens: 8 beats 1.' },
        { say: 'So 481 is bigger. The open mouth of the sign always eats the bigger number.' }
      ],
      remember: 'Left first. Stop at the first digit that differs.'
    },
    'number:Expanded form': {
      title: 'Pull the number apart',
      steps: [
        { say: 'Every digit gets its own value.', visual: { type: 'mab', h: 3, t: 4, o: 2 } },
        { say: '342 = 300 + 40 + 2. Say what each digit is worth, not what it looks like.' }
      ],
      remember: 'Hundreds + tens + ones, written out.'
    },
    'number': {
      title: 'Blocks make numbers visible',
      steps: [
        { say: 'A flat is a hundred. A rod is ten. A cube is one.', visual: { type: 'mab', h: 1, t: 3, o: 4 } },
        { say: 'Count the big ones first, then the rods, then the cubes.' }
      ],
      remember: 'Biggest blocks first.'
    },

    /* ---------------- measurement ---------------- */
    'measurement:Telling time': {
      title: 'Two hands, two jobs',
      steps: [
        { say: 'The short fat hand only cares about the hour.', visual: { type: 'clock', h: 3, m: 15 } },
        { say: 'It is just past 3, so the hour is 3.' },
        { say: 'The long hand counts minutes. On the 3 means 15 minutes — quarter past.' }
      ],
      remember: 'Short hand = hour. Long hand × 5 = minutes.'
    },
    'measurement:Money': {
      title: 'Count the big coins first',
      steps: [
        { say: 'Sort them biggest to smallest before you add anything.', visual: { type: 'coins', vals: [100, 50, 20, 10] } },
        { say: '$1, then 50c, then 20c, then 10c: $1.80.' },
        { say: '100 cents make a dollar. That is the only swap you need.' }
      ],
      remember: 'Biggest coin first, and 100c = $1.'
    },
    'measurement:Change': {
      title: 'Change is counting up, not taking away',
      steps: [
        { say: 'Do not subtract. Count up from the price to the money you handed over.' },
        { say: 'Costs $1.80, you paid $2. Count up: 20c. That is the change.', visual: { type: 'coins', vals: [20] } }
      ],
      remember: 'Count up from the price.'
    },
    'measurement:Using a ruler': {
      title: 'Where it starts matters',
      steps: [
        { say: 'If the object starts at 0, just read the end.', visual: { type: 'ruler', cm: 10, obj: 6, start: 0 } },
        { say: 'If it starts somewhere else, you must subtract.', visual: { type: 'ruler', cm: 10, obj: 6, start: 2 } },
        { say: 'Starts at 2, ends at 8. 8 − 2 = 6 cm. Not 8.' }
      ],
      remember: 'End minus start, not just the end.'
    },
    'measurement:Informal units': {
      title: 'The units must all be the same',
      steps: [
        { say: 'Lay them end to end. No gaps, no overlaps.', visual: { type: 'emojiRow', items: ['📎', '📎', '📎', '📎', '📎', '📎'], cell: 32 } },
        { say: 'Six paperclips. But only if every paperclip is the same size.' }
      ],
      remember: 'Same size, touching, no gaps.'
    },
    'measurement:Calendar': {
      title: 'Seven days brings you back',
      steps: [
        { say: 'Every 7 days lands on the same day name again.' },
        { say: 'So for 9 days: that is one whole week, then 2 more.' },
        { say: 'Monday + 7 = Monday. Then 2 more = Wednesday.' }
      ],
      remember: 'Take out the sevens first, then count the leftovers.'
    },
    'measurement:Area': {
      title: 'Area is rows of squares',
      steps: [
        { say: 'Do not count every square one by one. Count a row.', visual: { type: 'areaGrid', rows: 3, cols: 5, cells: (function () { var a = []; for (var x = 0; x < 5; x++)for (var y = 0; y < 3; y++)a.push([x, y]); return a; })() } },
        { say: 'Five in a row, three rows. 5 × 3 = 15 squares.' }
      ],
      remember: 'Area = across × down.'
    },
    'measurement:Perimeter': {
      title: 'Perimeter is the walk around the edge',
      steps: [
        { say: 'Imagine an ant walking all the way round. Count its steps.', visual: { type: 'areaGrid', rows: 3, cols: 5, cells: (function () { var a = []; for (var x = 0; x < 5; x++)for (var y = 0; y < 3; y++)a.push([x, y]); return a; })() } },
        { say: '5 + 3 + 5 + 3 = 16. All four sides, not the inside.' }
      ],
      remember: 'Perimeter walks the edge. Area fills the middle.'
    },
    'measurement:Elapsed time': {
      title: 'Jump to the next hour first',
      steps: [
        { say: 'It is 2:40 and you add 35 minutes. Do not add 40 + 35 in your head.', visual: { type: 'clock', h: 2, m: 40 } },
        { say: 'Jump to 3:00 first. That used 20 minutes.' },
        { say: '35 − 20 = 15 left. So 3:15.', visual: { type: 'clock', h: 3, m: 15 } }
      ],
      remember: 'Hop to the o’clock, then add what is left.'
    },
    'measurement:Units': {
      title: 'A thousand, nearly every time',
      steps: [
        { say: '1 m = 100 cm. That one is a hundred.' },
        { say: '1 km = 1000 m. 1 kg = 1000 g. 1 L = 1000 mL. Those three are all a thousand.' }
      ],
      remember: 'Only metres-to-centimetres is 100. The rest are 1000.'
    },
    'measurement': {
      title: 'Read the scale, not the picture',
      steps: [
        { say: 'Find the numbers on the side and see how big one step is.', visual: { type: 'jug', cap: 1000, fill: 750, div: 4 } },
        { say: 'Here each step is 250 mL. The water is at the third step: 750 mL.' }
      ],
      remember: 'Work out one step first.'
    },

    /* ---------------- geometry ---------------- */
    'geometry:Symmetry': {
      title: 'Fold it and see if it matches',
      steps: [
        { say: 'A line of symmetry only counts if both halves match exactly.', visual: { type: 'shape', name: 'square', color: C[2], lines: ['v'] } },
        { say: 'A square folds four ways: up-down, side-to-side, and both diagonals.', visual: { type: 'shape', name: 'square', color: C[2], lines: ['v', 'h', 'd1', 'd2'] } },
        { say: 'A rectangle only folds two ways. The diagonals do not match.' }
      ],
      remember: 'If the halves do not land on top of each other, it is not a line of symmetry.'
    },
    'geometry:Faces, edges, vertices': {
      title: 'Faces, edges, corners',
      steps: [
        { say: 'A face is a flat side you could paint.', visual: { type: 'solid', name: 'cube' } },
        { say: 'An edge is where two faces meet. A vertex is a pointy corner.' },
        { say: 'A cube: 6 faces, 12 edges, 8 corners.' }
      ],
      remember: 'Faces you paint, edges you cut along, corners you poke.'
    },
    'geometry:Grid position': {
      title: 'Across first, then up',
      steps: [
        { say: 'Always the letter along the bottom first.', visual: { type: 'coordGrid', cols: 5, rows: 4, tokens: [{ x: 2, y: 1, sym: '🚗' }] } },
        { say: 'The car is above C, and two rows up. So C2.' }
      ],
      remember: 'Letter across, number up — in that order.'
    },
    'geometry:Turning shapes': {
      title: 'Turn the whole picture with it',
      steps: [
        { say: 'A quarter turn moves the point one step round the clock.', visual: { type: 'shape', name: 'arrow', color: C[1], size: 120 } },
        { say: 'Pointing right, turned a quarter clockwise, now points down.', visual: { type: 'shape', name: 'arrow', color: C[1], size: 120, rotate: 90 } },
        { say: 'Half a turn sends it to the opposite side.' }
      ],
      remember: 'Quarter = one step round. Half = opposite.'
    },
    'geometry': {
      title: 'Count the sides',
      steps: [
        { say: 'Shapes are named by how many straight sides they have.', visual: { type: 'shapeRow', items: [{ name: 'triangle', label: '3' }, { name: 'square', label: '4' }, { name: 'pentagon', label: '5' }, { name: 'hexagon', label: '6' }], cell: 80 } },
        { say: 'Turning a shape never changes its name.' }
      ],
      remember: 'Count sides. Ignore which way up it is.'
    },

    /* ---------------- data ---------------- */
    'data:Bar graph': {
      title: 'Find the scale before you read a bar',
      steps: [
        { say: 'Look at the numbers up the side. How much is one gap?', visual: { type: 'bars', bars: [{ label: 'Cats', value: 6, color: C[0] }, { label: 'Dogs', value: 4, color: C[1] }, { label: 'Fish', value: 2, color: C[2] }] } },
        { say: 'Then follow the top of the bar across to the scale.' },
        { say: 'For “how many more”, take the smaller from the bigger: 6 − 4 = 2.' }
      ],
      remember: 'Scale first, then read across.'
    },
    'data:Picture graph': {
      title: 'Check what one picture is worth',
      steps: [
        { say: 'Read the key at the bottom first. One picture is not always one thing.', visual: { type: 'picto', rows: [{ label: 'Dogs', count: 4, sym: '🐶' }, { label: 'Cats', count: 2, sym: '🐱' }], key: 'Key: 1 picture = 1 child' } },
        { say: 'Here one picture is one child. Count the pictures in the row.' }
      ],
      remember: 'Key first, then count.'
    },
    'data:Chance': {
      title: 'Count the winners out of the total',
      steps: [
        { say: 'Count how many of the thing you want.', visual: { type: 'bag', items: ['#d03b3b', '#d03b3b', C[0], C[0], C[0], C[2]] } },
        { say: 'Two red. Then count everything: six.' },
        { say: 'So the chance is 2 out of 6.' }
      ],
      remember: 'How many you want, out of how many there are altogether.'
    },
    'data': {
      title: 'Read the labels first',
      steps: [
        { say: 'Before looking at any bar or picture, read what the graph is about and what the numbers mean.' }
      ],
      remember: 'Labels, key, then data.'
    },

    /* ---------------- patterns ---------------- */
    'patterns:Growing pattern': {
      title: 'Find the step, then use it',
      steps: [
        { say: 'Look at the gap between two numbers you can see.', visual: chain([10, 18, 26, '?', 42]) },
        { say: '18 − 10 = 8. Check it again: 26 − 18 = 8. The step is 8.' },
        { say: 'So the missing one is 26 + 8 = 34.' }
      ],
      remember: 'Work out the step from two known numbers, then check it on a third.'
    },
    'patterns:Repeating pattern': {
      title: 'Find the part that repeats',
      steps: [
        { say: 'Look for where the pattern starts over.', visual: { type: 'seq', items: [{ name: 'square', color: C[0] }, { name: 'square', color: C[0] }, { name: 'rhombus', color: C[1] }, { name: 'square', color: C[0] }, { name: 'square', color: C[0] }, '?'], cell: 48 } },
        { say: 'Square, square, diamond. Three shapes, then again.' },
        { say: 'So the next one is the diamond.' }
      ],
      remember: 'Find the repeating chunk, then carry on.'
    },
    'patterns:Function machine': {
      title: 'Test your rule on every pair',
      steps: [
        { say: '2 → 7 could be “add 5” or “times 3 add 1”. One example is never enough.' },
        { say: 'Check the next pair. 3 → 9. Add 5 would give 8, so that rule is wrong.' },
        { say: 'Times 3 gives 9. That works for both, so that is the rule.' }
      ],
      remember: 'A rule must work for every pair, not just the first.'
    },
    'patterns': {
      title: 'Patterns have a rule',
      steps: [
        { say: 'Find what happens from one to the next, then do it again.' }
      ],
      remember: 'Same change every time.'
    },

    /* ---------------- language ---------------- */
    'language:Spelling': {
      title: 'Look at the shape of the word',
      steps: [
        { say: 'Do not sound it out. English lies when you sound it out.' },
        { say: 'Look at the tricky middle. “because” has a c-a-u-s-e hiding inside it.' },
        { say: 'Cover it, write it, then check. If it looks wrong, it usually is.' }
      ],
      remember: 'Look, cover, write, check.'
    },
    'language:Punctuation': {
      title: 'Capitals and stops have jobs',
      steps: [
        { say: 'A capital starts a sentence. Names, days, months and places always get one too.' },
        { say: 'An apostrophe does one of two jobs: it shows who owns something (Sam’s bike), or it stands in for a missing letter (didn’t).' },
        { say: 'To check “it’s”, read it the long way: “it is”. If that sounds wrong, use “its”.' }
      ],
      remember: 'Read it the long way to test an apostrophe.'
    },
    'language:Grammar': {
      title: 'Read the whole sentence back',
      steps: [
        { say: 'Put your answer in and read the whole sentence out loud in your head.' },
        { say: 'If it sounds wrong, it is wrong. Your ear knows more than you think.' },
        { say: 'For “me or I”, take the other person out. “Me walked to school” sounds wrong, so it is “I”.' }
      ],
      remember: 'Read it back with your answer in it.'
    },
    'language': {
      title: 'Check by reading it back',
      steps: [{ say: 'Put your answer in, read the sentence again, and listen for what sounds wrong.' }],
      remember: 'Read it back.'
    },

    /* ---------------- reading ---------------- */
    'reading': {
      title: 'The answer is in the text',
      steps: [
        { say: 'For a “what happened” question, go back and find the exact line. Do not answer from memory.' },
        { say: 'For a “why” or “how did they feel” question, the text will not say it directly. Find the clue that proves it.' },
        { say: 'If two answers look right, one of them will have a word that is too strong — “always”, “never”, “every”. That is usually the wrong one.' }
      ],
      remember: 'Point at the line that proves it.'
    },

    /* ---------------- thinking skills ---------------- */
    'thinking:Logic puzzle': {
      title: 'Line them up before you answer',
      steps: [
        { say: 'Do not try to hold the clues in your head. Put them in a line.' },
        { say: 'Taller goes on the left. Start with any clue: Jack is taller than Ruby → Jack, Ruby.' },
        { say: 'Add the next clue to the same line. Then read the answer off the line.', visual: chain(['Jack', 'Ruby', 'Ava']) }
      ],
      remember: 'Build the line, then read it.'
    },
    'thinking:What must be true?': {
      title: '“Must” means always, with no exceptions',
      steps: [
        { say: 'Most wrong answers here are things that are probably true — but not certain.' },
        { say: 'Test each one: can you imagine a way it could be false? Then it is out.' },
        { say: 'Only keep the one that cannot possibly be false.' }
      ],
      remember: 'If you can imagine it being false, it is not the answer.'
    },
    'thinking:Secret code': {
      title: 'Find the move, then do it to every letter',
      steps: [
        { say: 'Compare the first letters. CAT → DBU. C became D. That is one step forward.' },
        { say: 'Check a second letter to be sure. A → B. Yes, one step.' },
        { say: 'Now move every letter of the new word one step.' }
      ],
      remember: 'Work out the jump from one letter, check it on another.'
    },
    'thinking:Odd one out': {
      title: 'Find what three of them share',
      steps: [
        { say: 'Do not look for the odd one first. Look for what most of them have in common.' },
        { say: 'Apple, banana, grape are all fruit. Carrot is not. So the carrot is out.' }
      ],
      remember: 'Find the group rule, then the one that breaks it.'
    },
    'thinking:Matrix': {
      title: 'Read across, then read down',
      steps: [
        { say: 'Look along a row. What changes from left to right?' },
        { say: 'Now look down a column. What changes from top to bottom?' },
        { say: 'The missing one needs both: its row rule and its column rule.' }
      ],
      remember: 'Two rules — one across, one down.'
    },
    'thinking:Balance puzzle': {
      title: 'Swap equals for equals',
      steps: [
        { say: 'One blue balances three red. So a blue and three red are worth the same.', visual: { type: 'balance', left: ['🟦'], right: ['🔴', '🔴', '🔴'], tilt: 0 } },
        { say: 'Two blues, then, need two lots of three red.' },
        { say: '2 × 3 = 6 red.' }
      ],
      remember: 'Trade each shape for what it is worth.'
    },
    'thinking:Number detective': {
      title: 'Test every clue on every option',
      steps: [
        { say: 'One clue is never enough. Check all of them.' },
        { say: 'Take an option. Does it pass clue 1? Clue 2? Clue 3? Any fail and it is out.' },
        { say: 'Only one option survives all three.' }
      ],
      remember: 'A clue that fails knocks the whole option out.'
    },
    'thinking': {
      title: 'Slow down and write it down',
      steps: [
        { say: 'Thinking questions are not about being fast. They are about not losing track.' },
        { say: 'Put the information on paper — a line, a list, a table — then read the answer off it.' }
      ],
      remember: 'Get it out of your head and onto the page.'
    },

    /* ---------------- OC maths reasoning ---------------- */
    'reasoning:Work backwards': {
      title: 'Undo it, step by step',
      steps: [
        { say: 'Forwards it was: times 3, then add 5, answer 26.' },
        { say: 'Go backwards and undo each step. Undo “add 5” → 26 − 5 = 21.', visual: chain([26, '−5', 21]) },
        { say: 'Undo “times 3” → 21 ÷ 3 = 7. The start was 7.' }
      ],
      remember: 'Last step first, and do the opposite.'
    },
    'reasoning:Combinations': {
      title: 'Every shirt with every shorts',
      steps: [
        { say: 'Draw a grid. Shirts along the top, shorts down the side.', visual: arr(3, 4, C[2]) },
        { say: 'Each square is one outfit. Count the squares: 4 × 3 = 12.' }
      ],
      remember: 'Combinations multiply. Grid it.'
    },
    'reasoning:Two-step problem': {
      title: 'Two steps, written down',
      steps: [
        { say: 'Find step one. Do it. Write the answer.' },
        { say: '5 packs of 8 stickers: 5 × 8 = 40. Write 40.' },
        { say: 'Now step two, using 40. Gave away 12: 40 − 12 = 28.' }
      ],
      remember: 'Never carry the middle number in your head.'
    },
    'reasoning:Reading a table': {
      title: 'Work out the one first',
      steps: [
        { say: '2 boxes hold 16 pencils. So one box holds 16 ÷ 2 = 8.' },
        { say: 'Now you can answer about any number of boxes. 5 boxes = 5 × 8 = 40.' }
      ],
      remember: 'Find the value of one, then scale it.'
    },
    'reasoning:Rate problem': {
      title: 'Per minute means times the minutes',
      steps: [
        { say: '8 toys every minute. Count on in 8s.', visual: { type: 'skip', step: 8, jumps: 4 } },
        { say: 'Four minutes: 8, 16, 24, 32.' }
      ],
      remember: 'Per-something × how many = total.'
    },
    'reasoning:Compare and decide': {
      title: 'Ignore the numbers you do not need',
      steps: [
        { say: 'Some numbers in a question are there to distract you.' },
        { say: 'If it asks how much MORE one person needs than the other, the price does not matter at all.' },
        { say: 'Just take the smaller saving from the bigger one.' }
      ],
      remember: 'Ask what the question wants, then throw away the rest.'
    },
    'reasoning': {
      title: 'Turn the words into a picture',
      steps: [
        { say: 'Draw it before you calculate. A bar, a grid, or a line.' },
        { say: 'Once it is drawn, the sum you need is usually obvious.' }
      ],
      remember: 'Draw first, calculate second.'
    }
  };

  /* A lesson that quotes different numbers from the question he just got wrong is
     confusing at seven. Where we can read the numbers out of the prompt, rebuild the
     lesson around HIS numbers. */
  var BUILD = {
    'multdiv:8 times table': function (a, b) {
      var n = (a === 8 ? b : a);
      return { title: 'Eights are doubles, three times over',
        steps: [
          { say: 'You do not have to remember the eights. You can build them.', visual: arr(8, Math.min(n, 10)) },
          { say: 'Start with ' + n + '. Double it. Double again. Double again.',
            visual: chain([n, n * 2, n * 4, n * 8]) },
          { say: 'So 8 × ' + n + ' = ' + (n * 8) + '. Three doubles, and you are there.', visual: arr(8, Math.min(n, 10), C[2]) }
        ],
        remember: '8 × anything = double, double, double.' };
    },
    'multdiv:7 times table': function (a, b) {
      var n = (a === 7 ? b : a);
      return { title: 'Sevens split into fives and twos',
        steps: [
          { say: 'Sevens are hard to chant. So do not chant them — split them.', visual: arr(7, Math.min(n, 10)) },
          { say: '7 rows is 5 rows and 2 rows. You already know both of those.', visual: arr(5, Math.min(n, 10), C[0]) },
          { say: '5 × ' + n + ' = ' + (5 * n) + '. 2 × ' + n + ' = ' + (2 * n) + '. Put them together: ' + (7 * n) + '.',
            visual: bar([{ label: String(5 * n), size: 5 * n, color: C[0] }, { label: String(2 * n), size: 2 * n, color: C[1] }], '7 × ' + n + ' = ' + (7 * n)) }
        ],
        remember: '7 × n = (5 × n) + (2 × n).' };
    },
    'multdiv:6 times table': function (a, b) {
      var n = (a === 6 ? b : a);
      return { title: 'Sixes are double the threes',
        steps: [
          { say: 'If you know the threes, you know the sixes.', visual: arr(3, Math.min(n, 10)) },
          { say: '3 × ' + n + ' = ' + (3 * n) + '. Six is double three, so double the answer.', visual: chain([3 * n, 6 * n]) },
          { say: '6 × ' + n + ' = ' + (6 * n) + '.', visual: arr(6, Math.min(n, 10), C[2]) }
        ],
        remember: 'Sixes = threes, doubled.' };
    },
    'multdiv:9 times table': function (a, b) {
      var n = (a === 9 ? b : a);
      return { title: 'Nines are tens minus one lot',
        steps: [
          { say: 'Nine is one less than ten. Tens are easy.', visual: arr(10, Math.min(n, 10)) },
          { say: '10 × ' + n + ' = ' + (10 * n) + '. Now take away one ' + n + '.',
            visual: bar([{ label: String(9 * n), size: 9 * n, color: C[2] }, { label: String(n), size: n, color: C[1] }], '10 × ' + n + ' = ' + (10 * n)) },
          { say: (10 * n) + ' − ' + n + ' = ' + (9 * n) + '. So 9 × ' + n + ' = ' + (9 * n) + '.', visual: arr(9, Math.min(n, 10), C[2]) }
        ],
        remember: '9 × n = (10 × n) − n.' };
    },
    'multdiv:4 times table': function (a, b) {
      var n = (a === 4 ? b : a);
      return { title: 'Fours are double doubles',
        steps: [
          { say: 'Double ' + n + ' is ' + (2 * n) + '.', visual: chain([n, 2 * n]) },
          { say: 'Double it again: ' + (4 * n) + '. That is 4 × ' + n + '.', visual: chain([n, 2 * n, 4 * n]) }
        ],
        remember: 'Fours = double, then double again.' };
    },
    'multdiv:Division': function (a, b) {
      if (!a || !b || a % b !== 0) return null;
      return { title: 'Division is multiplication walking backwards',
        steps: [
          { say: 'Do not think “divide”. Think: how many ' + b + 's fit inside ' + a + '?', visual: arr(b, a / b) },
          { say: 'Count them in ' + b + 's.', visual: { type: 'skip', step: b, jumps: a / b, hideLast: false } },
          { say: 'That is ' + (a / b) + ' jumps. So ' + a + ' ÷ ' + b + ' = ' + (a / b) + '.' }
        ],
        remember: 'Divide = "how many of these fit inside that?"' };
    },
    'multdiv:Missing factor': function (a, b) {
      if (!a || !b || b % a !== 0) return null;
      return { title: 'A missing factor is a division in disguise',
        steps: [
          { say: a + ' × ☐ = ' + b + ' looks scary. It is not.', visual: arr(a, b / a) },
          { say: 'Turn it around: ' + b + ' ÷ ' + a + '. How many ' + a + 's in ' + b + '?',
            visual: { type: 'skip', step: a, jumps: b / a } },
          { say: (b / a) + '. So the box is ' + (b / a) + '.' }
        ],
        remember: 'Box in a times sum → flip it into a divide.' };
    },
    'multdiv:Doubling': function (a) {
      if (!a) return null;
      return { title: 'Doubling is just the number twice',
        steps: [
          { say: 'Double means two of the same, added up.', visual: { type: 'tenframe', frames: a > 10 ? [10, a - 10] : [a] } },
          { say: a + ' and ' + a + ' more is ' + (2 * a) + '.', visual: chain([a, '+' + a, 2 * a]) }
        ],
        remember: 'Double = the number + itself.' };
    }
  };

  // pull the two numbers out of a prompt like "8 × 6 = ?" or "56 ÷ 8 = ?"
  function numsFrom(prompt) {
    if (!prompt) return null;
    var plain = String(prompt).replace(/<[^>]+>/g, ' ');
    var m = plain.match(/(\d+)\s*[×x*÷/]\s*(\d+)/) || plain.match(/(\d+)\s*×\s*☐\s*=\s*(\d+)/);
    if (m) return [+m[1], +m[2]];
    var one = plain.match(/(?:double|half of)\s+(\d+)/i);
    return one ? [+one[1], null] : null;
  }

  function lessonFor(topic, sub, prompt) {
    var key = topic + ':' + sub;
    var b = BUILD[key], nums = b ? numsFrom(prompt) : null;
    if (b && nums) {
      try {
        var built = b(nums[0], nums[1]);
        if (built) return built;
      } catch (e) { /* fall through to the stock lesson */ }
    }
    return LESSONS[key] || LESSONS[topic] || null;
  }

  L.coach = { LESSONS: LESSONS, BUILD: BUILD, lessonFor: lessonFor, numsFrom: numsFrom };
})(window);
