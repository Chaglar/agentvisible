/* bank-verbal.js — reading, language conventions, OC thinking skills, OC maths reasoning */
(function (root) {
  var L = root.LEO, V = L.vis, B = L.bank, topic = B.topic, mc = B._mc, near = B._near, NAMES = B._NAMES;

  /* ========================= READING ========================= */
  var PASSAGES = [
    { lv: 2, title: 'The Lost Sock', text: 'Every morning Mia looked for her blue sock. It was never in the drawer. It was never under the bed. One day she heard a small noise in the laundry. Her puppy, Biscuit, was lying in his basket. He was using the blue sock as a pillow.',
      qs: [
        { p: 'Where did Mia finally find her sock?', c: ['In the laundry, in the puppy’s basket', 'Under the bed', 'In the drawer', 'At school'], a: 0, e: 'The last two sentences say Biscuit was in the laundry using the sock as a pillow.' },
        { p: 'Who is Biscuit?', c: ['Mia’s puppy', 'Mia’s brother', 'A toy', 'A neighbour'], a: 0, e: '“Her puppy, Biscuit” tells us directly.' },
        { p: 'How do you think Mia felt when she found the sock?', c: ['Relieved', 'Frightened', 'Bored', 'Angry at the drawer'], a: 0, e: 'She had looked every morning, so finding it would be a relief. The story does not say this word — you work it out.' }
      ] },
    { lv: 2, title: 'Bin Night', text: 'On Tuesday nights the whole street looks the same. Red bins stand at the edge of every driveway, like soldiers waiting. In the morning a big truck comes. Its long metal arm lifts each bin, tips it, and puts it down again. Jack likes to watch from the window.',
      qs: [
        { p: 'What night do the bins go out?', c: ['Tuesday', 'Monday', 'Friday', 'Sunday'], a: 0, e: 'The first sentence says “On Tuesday nights”.' },
        { p: 'The bins are described as being “like soldiers waiting”. Why?', c: ['They stand in a straight line, still and tall', 'They are wearing uniforms', 'They can march', 'They are dangerous'], a: 0, e: 'This is a comparison. Soldiers stand still, tall and in a line — so do the bins.' },
        { p: 'What lifts the bins?', c: ['A metal arm on the truck', 'Jack', 'The driver’s hands', 'The wind'], a: 0, e: '“Its long metal arm lifts each bin.”' }
      ] },
    { lv: 3, title: 'Why Koalas Sleep So Much', text: 'Koalas sleep for up to 20 hours a day. People often think they are lazy, but there is a better reason. Koalas eat gum leaves. Gum leaves are tough, and they hold very little energy. A koala’s body has to work slowly to get anything out of them. Sleeping saves energy, so the koala has enough left to climb and eat.',
      qs: [
        { p: 'What is the main idea of this text?', c: ['Koalas sleep a lot because their food gives them little energy', 'Koalas are lazy animals', 'Gum trees are very tall', 'Koalas cannot climb well'], a: 0, e: 'The whole text explains the reason. The word “but” signals the writer is correcting the “lazy” idea.' },
        { p: 'What does the word “tough” mean here?', c: ['Hard to chew and break down', 'Brave', 'Very tasty', 'Wet'], a: 0, e: 'It is describing leaves, so it means hard, not brave.' },
        { p: 'Which sentence shows the writer disagrees with what people think?', c: ['“People often think they are lazy, but there is a better reason.”', '“Koalas eat gum leaves.”', '“Koalas sleep for up to 20 hours a day.”', '“Sleeping saves energy.”'], a: 0, e: 'The word “but” is the clue that a different idea is coming.' }
      ] },
    { lv: 3, title: 'The Sandcastle Rule', text: 'Nina built her sandcastle too close to the water. “Move it back,” said her grandfather. “The tide is coming in.” Nina did not want to start again, so she built a wall of sand around the castle instead. For a while the wall held. Then one wave came further than the rest, and the castle melted into the sand.',
      qs: [
        { p: 'Why did the castle fall down?', c: ['Nina built it too close to the water and the tide came in', 'Someone stepped on it', 'The sand was too dry', 'Her grandfather knocked it over'], a: 0, e: 'The grandfather warns about the tide at the start, and a wave destroys it at the end.' },
        { p: 'What does “the castle melted into the sand” mean?', c: ['It collapsed and lost its shape', 'It became hot', 'It turned into water', 'It floated away whole'], a: 0, e: '“Melted” is used as a picture, not a fact — the shape disappeared.' },
        { p: 'What lesson does this story teach?', c: ['Fixing a problem is harder than avoiding it', 'Never go to the beach', 'Walls are always strong', 'Grandfathers build the best castles'], a: 0, e: 'Nina chose a quick fix instead of moving the castle, and it did not work.' }
      ] },
    { lv: 4, title: 'The First Fleet Garden', text: 'When the First Fleet arrived in 1788, the settlers planted seeds they had carried from England. Most of the seeds failed. The soil at Sydney Cove was thin and sandy, and the summer was far hotter than any English summer. Within two years the settlement was close to starving. Farms further up the river, where the soil was richer, finally saved them.',
      qs: [
        { p: 'Why did the first seeds fail?', c: ['The soil was poor and the weather was much hotter than in England', 'The settlers forgot to water them', 'There were too many birds', 'They planted them in winter'], a: 0, e: 'Two reasons are given in one sentence: thin, sandy soil and a far hotter summer.' },
        { p: 'What finally solved the food problem?', c: ['Farms further up the river with better soil', 'Ships from England', 'Fishing at Sydney Cove', 'Planting the same seeds again'], a: 0, e: 'The last sentence gives the answer.' },
        { p: 'What does “close to starving” tell you about the settlement?', c: ['They were running out of food and in danger', 'They had plenty of food', 'They were bored', 'They were about to sail home'], a: 0, e: '“Close to” means nearly — a serious warning, not an actual famine yet.' }
      ] },
    { lv: 4, title: 'Two Kinds of Clever', text: 'Ravens can work out how to bend a wire into a hook to lift food from a tube. Ants cannot do anything like that. But one ant is not the whole story. A colony of ants can build a bridge out of their own bodies, farm fungus, and keep a city running underground. The raven is clever on its own. The ant colony is clever together.',
      qs: [
        { p: 'What is the writer comparing?', c: ['Cleverness in one animal versus cleverness in a group', 'Birds versus insects in size', 'Which animal is stronger', 'Which animal lives longer'], a: 0, e: 'The last two sentences state the comparison directly.' },
        { p: 'Which statement would the writer most likely agree with?', c: ['A group can solve problems that no single member could', 'Ants are smarter than ravens', 'Ravens are useless in groups', 'Only big brains matter'], a: 0, e: 'The colony examples exist to show group cleverness, without claiming one is better.' },
        { p: 'Why does the writer say “one ant is not the whole story”?', c: ['To warn that judging ants alone gives the wrong answer', 'Because ants cannot be counted', 'Because ants live a short time', 'To say ants have no story'], a: 0, e: 'It signals a turn in the argument — look at the colony instead.' }
      ] }
  ];

  topic('reading', { label: 'Reading', tr: 'Okuma', emoji: '📖', strand: 'literacy', modes: ['naplan', 'oc'] }, function (lv, rng) {
    var pool = PASSAGES.filter(function (p) { return Math.abs(p.lv - lv) <= 1; });
    if (!pool.length) pool = PASSAGES;
    var p = rng.pick(pool), qq = rng.pick(p.qs);
    var order = rng.shuffle(qq.c.map(function (c, i) { return { c: c, i: i }; }));
    return {
      topic: 'reading', level: lv, sub: p.title,
      passage: { title: p.title, text: p.text },
      prompt: qq.p, format: 'mc',
      choices: order.map(function (o) { return { text: o.c }; }),
      answer: order.map(function (o) { return o.i; }).indexOf(qq.a),
      explain: qq.e
    };
  });

  /* ========================= LANGUAGE CONVENTIONS ========================= */
  var SPELL = [
    ['because', 'becuase', 'becos', 'beacause'], ['friend', 'freind', 'frend', 'friende'],
    ['beautiful', 'beutiful', 'beautifull', 'beautifil'], ['tomorrow', 'tomorow', 'tommorow', 'tomorrowe'],
    ['favourite', 'favorite', 'favurite', 'favouright'], ['people', 'peaple', 'peopel', 'pepole'],
    ['question', 'questoin', 'qestion', 'questien'], ['enough', 'enuff', 'enoug', 'enouhg'],
    ['different', 'diffrent', 'diferent', 'differant'], ['knew', 'new', 'nuw', 'knue'],
    ['caught', 'cought', 'caugt', 'cawt'], ['through', 'thru', 'throuhg', 'threw'],
    ['school', 'schoool', 'scool', 'shcool'], ['writing', 'writting', 'writeing', 'wrighting'],
    ['surprise', 'suprise', 'surprize', 'surpise'], ['exciting', 'exsiting', 'excitting', 'exiting'],
    ['thought', 'thort', 'thougt', 'thaught'], ['scissors', 'sissors', 'scisors', 'scissers']
  ];
  var GRAMMAR = [
    ['Yesterday I ____ to the park.', 'went', ['go', 'gone', 'going'], 'Yesterday means past tense, so we need <b>went</b>.'],
    ['There ____ three cats on the fence.', 'are', ['is', 'was', 'am'], 'Three cats is plural, so we use <b>are</b>.'],
    ['This is ____ book, not yours.', 'my', ['mine', 'me', 'I'], 'Before a noun we use <b>my</b>. “Mine” stands alone: “This book is mine.”'],
    ['She has two ____ .', 'boxes', ['boxs', 'boxies', 'box'], 'Words ending in x add <b>-es</b>: box → <b>boxes</b>.'],
    ['I have three ____ .', 'children', ['childs', 'childrens', 'childes'], '<b>Children</b> is an irregular plural — no -s needed.'],
    ['The dog wagged ____ tail.', 'its', ['it’s', 'its’', 'his’'], '<b>its</b> shows belonging. “It’s” always means “it is”.'],
    ['We were tired, ____ we kept walking.', 'but', ['so', 'because', 'or'], '<b>but</b> joins two ideas that disagree.'],
    ['I stayed inside ____ it was raining.', 'because', ['but', 'or', 'although'], '<b>because</b> gives the reason.'],
    ['The ____ mouse ran under the door.', 'tiny', ['tinily', 'tinier than', 'tinyness'], 'We need an adjective to describe the mouse: <b>tiny</b>.'],
    ['He ran ____ across the playground.', 'quickly', ['quick', 'quicker', 'quickness'], 'It describes how he ran, so we need the adverb <b>quickly</b>.'],
    ['If it rains tomorrow, we ____ stay home.', 'will', ['would have', 'was', 'were'], 'Tomorrow is the future, so <b>will</b>.'],
    ['The books ____ on the shelf all week.', 'have been', ['has been', 'is', 'was'], 'Books is plural → <b>have been</b>.']
  ];
  var PUNCT = [
    ['Which sentence is written correctly?', 'On Monday, Leo went to Sydney.', ['on monday, leo went to sydney.', 'On monday, Leo went to sydney.', 'On Monday leo went to Sydney'], 'Days, names and places start with a capital letter, and a sentence ends with a full stop.'],
    ['Which sentence needs a question mark?', 'Where did you put my shoes', ['I put your shoes away', 'The shoes are blue', 'Put the shoes away'], 'It asks something, so it ends with <b>?</b>'],
    ['Choose the correct sentence.', 'That is Sam’s bike.', ['That is Sams bike.', 'That is Sams’ bike.', 'That is Sam bike’s.'], 'One person named Sam owns it → <b>Sam’s</b>.'],
    ['Choose the correct sentence.', 'I bought apples, pears and milk.', ['I bought apples pears and milk.', 'I bought, apples pears and milk.', 'I bought apples, pears, and, milk.'], 'Commas separate items in a list.'],
    ['Which one uses speech marks correctly?', '“Come inside,” said Mum.', ['Come inside, said Mum.', '“Come inside, said Mum.”', 'Come “inside,” said Mum.'], 'Speech marks go around the exact words spoken.'],
    ['Where does the full stop go?', 'We walked home in the rain.', ['We walked. home in the rain', 'We. walked home in the rain', 'We walked home. in the rain'], 'A full stop goes at the end of a complete sentence.'],
    ['Choose the correct sentence.', 'The children’s coats are wet.', ['The childrens’ coats are wet.', 'The childrens coats are wet.', 'The children coats’ are wet.'], '“Children” is already plural, so add <b>’s</b>.'],
    ['Which sentence is correct?', 'It’s too cold to swim.', ['Its too cold to swim.', 'Its’ too cold to swim.', 'It is’ too cold to swim.'], '“It’s” = “it is”. Try reading it the long way to check.']
  ];

  topic('language', { label: 'Grammar & spelling', tr: 'Dil bilgisi ve yazım', emoji: '✏️', strand: 'literacy', modes: ['naplan'] }, function (lv, rng) {
    var q = { topic: 'language', level: lv };
    var kind = lv <= 2 ? rng.pick(['spell', 'punct']) : rng.pick(['spell', 'grammar', 'punct', 'grammar']);
    if (kind === 'spell') {
      var w = rng.pick(SPELL.slice(0, lv <= 2 ? 10 : SPELL.length));
      q.sub = 'Spelling'; q.prompt = 'Which word is spelled <b>correctly</b>?';
      Object.assign(q, mc(rng, w[0], w.slice(1)));
      q.explain = 'The correct spelling is <b>' + w[0] + '</b>.';
      return q;
    }
    if (kind === 'grammar') {
      var g = rng.pick(GRAMMAR);
      q.sub = 'Grammar'; q.prompt = g[0].replace('____', '<b>____</b>');
      Object.assign(q, mc(rng, g[1], g[2]));
      q.explain = g[3];
      return q;
    }
    var p = rng.pick(PUNCT);
    q.sub = 'Punctuation'; q.prompt = p[0];
    Object.assign(q, mc(rng, p[1], p[2]));
    q.explain = p[3];
    return q;
  });

  /* ========================= OC THINKING SKILLS ========================= */
  var MUSTBETRUE = [
    ['Every child in Year 2 at Bright Hill School learns the recorder. Sam is in Year 2 at Bright Hill School.', 'Sam learns the recorder.',
      ['Sam is the best recorder player.', 'Sam likes music.', 'Only Year 2 children learn the recorder.'],
      'The rule covers every Year 2 child, and Sam is one. Nothing is said about how well he plays or who else learns.'],
    ['All of the cakes in the box have icing. Some of the cakes have sprinkles.', 'Every cake in the box has icing.',
      ['Every cake has sprinkles.', 'No cake has sprinkles.', 'Cakes with icing never have sprinkles.'],
      '“All” is a complete rule; “some” tells you nothing about the rest.'],
    ['Mia only reads a book after she has finished her homework. Tonight Mia is reading a book.', 'Mia has finished her homework.',
      ['Mia has no homework tonight.', 'Mia finished her homework quickly.', 'Mia reads every night.'],
      'The rule says reading only happens after homework, so reading proves homework is done.'],
    ['If the pool is open, the flag is up. The flag is not up.', 'The pool is not open.',
      ['The flag is broken.', 'The pool is open but quiet.', 'Someone forgot the flag.'],
      'Open always means flag up. No flag means it cannot be open — that is the only safe conclusion.'],
    ['Every player on the team is taller than Ben. Ben is taller than Ali.', 'Every player on the team is taller than Ali.',
      ['Ali is on the team.', 'Ben is the shortest person in the school.', 'The tallest player is Ben.'],
      'Taller than Ben, and Ben is taller than Ali — so all of them clear Ali too.']
  ];

  topic('thinking', { label: 'Thinking skills', tr: 'Mantık ve akıl yürütme', emoji: '🧩', strand: 'thinking', modes: ['oc'] }, function (lv, rng) {
    var q = { topic: 'thinking', level: lv };
    var kinds = lv <= 2 ? ['odd', 'seq', 'matrix'] : lv === 3 ? ['odd', 'matrix', 'order', 'code'] :
                lv === 4 ? ['order', 'matrix', 'code', 'balance', 'must'] : ['order', 'must', 'balance', 'numlogic', 'code'];
    var kind = rng.pick(kinds);

    if (kind === 'odd') {
      var groups = [
        [['🍎', '🍌', '🍇', '🥕'], 3, 'The carrot is a vegetable — the others are fruit.'],
        [['🐶', '🐱', '🐟', '🐰'], 2, 'The fish lives in water; the others are land animals with fur.'],
        [['⚽', '🏀', '🎾', '🎹'], 3, 'The piano is an instrument — the others are balls.'],
        [['🚗', '🚲', '✈️', '🏠'], 3, 'The house does not move — the others carry people.'],
        [['🌧️', '☀️', '❄️', '📚'], 3, 'The book is not weather.'],
        [['🐝', '🦋', '🐞', '🐍'], 3, 'The snake has no wings and is not an insect.']
      ], g = rng.pick(groups);
      var order = rng.shuffle(g[0].map(function (e, i) { return { e: e, i: i }; }));
      q.sub = 'Odd one out'; q.prompt = 'Which one does <b>not</b> belong with the others?';
      q.format = 'mc';
      q.choices = order.map(function (o) { return { visual: { type: 'emojiRow', items: [o.e], cell: 52 } }; });
      q.answer = order.map(function (o) { return o.i; }).indexOf(g[1]);
      q.explain = g[2];
      return q;
    }
    if (kind === 'seq') {
      var shapes = ['circle', 'square', 'triangle', 'star'], A = rng.pick(shapes), Bn = rng.pick(shapes.filter(function (s) { return s !== A; }));
      var unit = [A, Bn, Bn], items = [], i;
      for (i = 0; i < 7; i++) items.push({ name: unit[i % 3], color: V.C[unit[i % 3] === A ? 0 : 1] });
      var correct = items[6].name; items[6] = '?';
      q.sub = 'Pattern'; q.prompt = 'What comes next?';
      q.visual = { type: 'seq', items: items, cell: 46 };
      var opts = rng.shuffle([A, Bn, rng.pick(shapes.filter(function (s) { return s !== A && s !== Bn; }))]);
      q.format = 'mc';
      q.choices = opts.map(function (nm) { return { visual: { type: 'shape', name: nm, size: 60, color: V.C[nm === A ? 0 : nm === Bn ? 1 : 2] } }; });
      q.answer = opts.indexOf(correct);
      q.explain = 'The unit is <b>' + unit.join(', ') + '</b> and then it starts again.';
      return q;
    }
    if (kind === 'matrix') {
      var base = rng.pick(['circle', 'square', 'triangle', 'hexagon']);
      var rows = [0, 1, 2], cells = [], sizes = [0, 1, 2];
      // rule: colour changes down the columns, rotation changes across the rows
      var cols = [V.C[0], V.C[1], V.C[2]];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++)
        cells.push({ name: base, color: cols[r], rotate: c * 30 });
      var answerCell = cells[8]; cells[8] = '?';
      q.sub = 'Matrix'; q.prompt = 'Which shape completes the grid?';
      q.visual = { type: 'matrix', n: 3, cells: cells };
      var wrongs = [{ name: base, color: cols[0], rotate: 60 }, { name: base, color: cols[2], rotate: 0 }, { name: base, color: cols[1], rotate: 60 }];
      var all = rng.shuffle([answerCell].concat(wrongs));
      q.format = 'mc';
      q.choices = all.map(function (cc) { return { visual: { type: 'shape', name: cc.name, color: cc.color, rotate: cc.rotate, size: 74 } }; });
      q.answer = all.indexOf(answerCell);
      q.explain = 'Colour stays the same across each <b>row</b>, and the shape turns a little more in each <b>column</b>. The last cell needs the third row colour with the biggest turn.';
      return q;
    }
    if (kind === 'order') {
      var n = lv >= 5 ? 4 : 3, people = rng.sample(NAMES, n);
      var order = rng.shuffle(people);             // order[0] = tallest
      var clues = [], i2;
      for (i2 = 0; i2 < n - 1; i2++) clues.push(order[i2] + ' is taller than ' + order[i2 + 1] + '.');
      if (n === 4) clues.push(order[0] + ' is taller than ' + order[3] + '.');
      var ask = rng.pick(['tallest', 'shortest', 'middle']);
      var correct = ask === 'tallest' ? order[0] : ask === 'shortest' ? order[n - 1] : order[1];
      q.sub = 'Logic puzzle';
      q.prompt = rng.shuffle(clues).join(' ') + '<br><br>Who is the <b>' + (ask === 'middle' ? 'second tallest' : ask) + '</b>?';
      Object.assign(q, mc(rng, correct, people.filter(function (p) { return p !== correct; })));
      q.explain = 'Line them up from tallest to shortest: <b>' + order.join(' → ') + '</b>.';
      return q;
    }
    if (kind === 'code') {
      var words = rng.sample(['CAT', 'DOG', 'SUN', 'BAT', 'PEN', 'CUP', 'HAT'], 2);
      var shift = rng.int(1, 3);
      var enc = function (w) { return w.split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65); }).join(''); };
      q.sub = 'Secret code';
      q.prompt = 'In a secret code <b>' + words[0] + '</b> is written as <b>' + enc(words[0]) + '</b>.<br>How is <b>' + words[1] + '</b> written?';
      Object.assign(q, mc(rng, enc(words[1]), [words[1].split('').reverse().join(''),
        words[1].split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 1) % 26) + 65); }).join(''),
        words[1].split('').map(function (ch) { return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65); }).join('')]));
      q.explain = 'Each letter moves <b>' + shift + '</b> place' + (shift > 1 ? 's' : '') + ' forward in the alphabet. ' +
        words[1].split('').map(function (ch) { return ch + '→' + String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65); }).join(', ') + '.';
      return q;
    }
    if (kind === 'balance') {
      // 1 square = k circles ; how many circles balance m squares?
      var k = rng.int(2, 4), m = rng.int(2, 3);
      q.sub = 'Balance puzzle';
      q.prompt = 'One 🟦 balances exactly ' + k + ' 🔴.<br>How many 🔴 are needed to balance <b>' + m + ' 🟦</b>?';
      q.visual = { type: 'balance', left: ['🟦'], right: Array.from({ length: k }, function () { return '🔴'; }), tilt: 0 };
      Object.assign(q, mc(rng, k * m, [k + m, k * m + k, k * m - k, m]));
      q.explain = 'Each 🟦 needs ' + k + ' 🔴, and there are ' + m + ' of them: ' + m + ' × ' + k + ' = <b>' + (k * m) + '</b>.';
      return q;
    }
    if (kind === 'must') {
      var mb = rng.pick(MUSTBETRUE);
      q.sub = 'What must be true?';
      q.prompt = '<i>' + mb[0] + '</i><br><br>Which statement <b>must</b> be true?';
      Object.assign(q, mc(rng, mb[1], mb[2]));
      q.explain = mb[3];
      return q;
    }
    // numlogic — work out a number from clues
    var target = rng.int(21, 89);
    var clues2 = ['It is between ' + (target - rng.int(3, 8)) + ' and ' + (target + rng.int(3, 8)) + '.',
      'It is ' + (target % 2 === 0 ? 'an even' : 'an odd') + ' number.',
      'The digits add to ' + (Math.floor(target / 10) + target % 10) + '.'];
    var makeWrong = function () {
      for (var tries = 0; tries < 60; tries++) {
        var c = target + rng.int(-8, 8);
        if (c !== target && c > 9 && c < 100 && !(c % 2 === target % 2 && (Math.floor(c / 10) + c % 10) === (Math.floor(target / 10) + target % 10))) return c;
      }
      return target + 11;
    };
    q.sub = 'Number detective';
    q.prompt = 'I am thinking of a number.<br>' + clues2.join('<br>') + '<br><br>What is my number?';
    Object.assign(q, mc(rng, target, [makeWrong(), makeWrong(), makeWrong()]));
    q.explain = 'Only <b>' + target + '</b> fits all three clues at once. Test each option against every clue — one clue is never enough.';
    return q;
  });

  /* ========================= OC MATHEMATICAL REASONING ========================= */
  topic('reasoning', { label: 'Maths reasoning', tr: 'Matematiksel akıl yürütme', emoji: '🧮', strand: 'thinking', modes: ['oc'] }, function (lv, rng) {
    var q = { topic: 'reasoning', level: lv }, name = rng.pick(NAMES), name2 = rng.pick(NAMES.filter(function (n) { return n !== name; }));
    var kinds = lv <= 2 ? ['twostep', 'combo'] : lv === 3 ? ['twostep', 'combo', 'backwards'] :
                lv === 4 ? ['backwards', 'combo', 'table', 'compare'] : ['backwards', 'table', 'compare', 'rate', 'combo'];
    var kind = rng.pick(kinds);

    if (kind === 'twostep') {
      var packs = rng.pick([7, 8, 6]), each = rng.int(3, 6), eaten = rng.int(3, 12);
      var res = packs * each - eaten;
      q.sub = 'Two-step problem';
      q.prompt = name + ' buys ' + each + ' packs of stickers. Each pack has ' + packs + ' stickers. ' + name + ' gives ' + eaten + ' away. How many are left?';
      q.visual = { type: 'groups', groups: Math.min(each, 4), per: Math.min(packs, 4), sym: '⭐' };
      Object.assign(q, mc(rng, res, [packs * each, packs * each + eaten, res - each, packs + each - eaten]));
      q.explain = 'First ' + each + ' × ' + packs + ' = ' + (each * packs) + '. Then ' + (each * packs) + ' − ' + eaten + ' = <b>' + res + '</b>.';
      return q;
    }
    if (kind === 'combo') {
      var tops = rng.int(3, 5), bots = rng.int(2, 4);
      q.sub = 'Combinations';
      q.prompt = name + ' has ' + tops + ' different t-shirts and ' + bots + ' different shorts. How many different outfits can ' + name + ' make?';
      q.visual = { type: 'array', rows: bots, cols: tops, cell: 30, sym: '👕' };
      Object.assign(q, mc(rng, tops * bots, [tops + bots, tops * bots + 1, tops * bots - bots, tops * 2 + bots]));
      q.explain = 'Each of the ' + tops + ' shirts can go with each of the ' + bots + ' shorts: ' + tops + ' × ' + bots + ' = <b>' + (tops * bots) + '</b> outfits. The grid shows every pair.';
      return q;
    }
    if (kind === 'backwards') {
      var m = rng.pick([2, 3, 7, 8]), add = rng.int(4, 19), start = rng.int(3, 12), end = start * m + add;
      q.sub = 'Work backwards';
      q.prompt = 'I think of a number. I multiply it by ' + m + ', then add ' + add + '. My answer is <b>' + end + '</b>. What number did I start with?';
      Object.assign(q, mc(rng, start, [end - add, Math.round((end + add) / m), start + 1, start - 1]));
      q.explain = 'Undo it backwards: ' + end + ' − ' + add + ' = ' + (end - add) + ', then ' + (end - add) + ' ÷ ' + m + ' = <b>' + start + '</b>.';
      return q;
    }
    if (kind === 'table') {
      var per = rng.pick([7, 8, 4, 6]), rowsN = [1, 2, 3, 5], hide = 3;
      q.sub = 'Reading a table';
      q.prompt = 'Each box holds the same number of pencils.<br>' +
        rowsN.slice(0, 3).map(function (r) { return r + ' box' + (r > 1 ? 'es' : '') + ' → ' + (r * per) + ' pencils'; }).join('<br>') +
        '<br><br>How many pencils in <b>' + rowsN[hide] + ' boxes</b>?';
      Object.assign(q, mc(rng, rowsN[hide] * per, [rowsN[hide] * per + per, 3 * per + 1, rowsN[hide] + per, rowsN[hide] * per - per]));
      q.explain = 'Each box holds ' + per + ' (because ' + rowsN[1] + ' boxes = ' + (rowsN[1] * per) + '). So ' + rowsN[hide] + ' × ' + per + ' = <b>' + (rowsN[hide] * per) + '</b>.';
      return q;
    }
    if (kind === 'compare') {
      var aTot = rng.int(4, 8) * rng.pick([7, 8]), bTot = aTot + rng.pick([-1, 1]) * rng.int(3, 15);
      q.sub = 'Compare and decide';
      q.prompt = name + ' saved $' + aTot + ' and ' + name2 + ' saved $' + bTot + '. A scooter costs $' + (Math.max(aTot, bTot) + rng.int(5, 20)) + '. How much <b>more</b> does ' + (aTot > bTot ? name2 : name) + ' need than ' + (aTot > bTot ? name : name2) + '?';
      var diff = Math.abs(aTot - bTot);
      Object.assign(q, mc(rng, '$' + diff, ['$' + (aTot + bTot), '$' + (diff + 5), '$' + Math.max(aTot, bTot), '$' + Math.min(aTot, bTot)]));
      q.explain = 'The scooter price cancels out — only the gap between the savings matters: ' + Math.max(aTot, bTot) + ' − ' + Math.min(aTot, bTot) + ' = <b>$' + diff + '</b>.';
      return q;
    }
    var rate = rng.pick([7, 8, 6]), mins = rng.pick([3, 4, 5]);
    q.sub = 'Rate problem';
    q.prompt = 'A machine makes ' + rate + ' toys every minute. How many toys does it make in <b>' + mins + ' minutes</b>?';
    q.visual = { type: 'skip', step: rate, jumps: mins, hideLast: true };
    Object.assign(q, mc(rng, rate * mins, [rate + mins, rate * mins + rate, rate * mins - rate, rate * (mins + 1)]));
    q.explain = 'Count on in ' + rate + 's for ' + mins + ' minutes: ' + rate + ' × ' + mins + ' = <b>' + (rate * mins) + '</b>.';
    return q;
  });
})(window);
