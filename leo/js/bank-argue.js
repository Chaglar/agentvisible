/* bank-argue.js — argument analysis for OC Thinking Skills.
 *
 * Added after reading an actual Thinking Skills sample. Four of its ten questions
 * were argument analysis and this bank had none of it at all: it could produce
 * matrices, sequences, codes and ordering puzzles, but nothing that asked a child
 * to find the flaw in somebody's reasoning, weaken a claim, name a conclusion, or
 * tell a necessary condition from a sufficient one.
 *
 * These are generated rather than hand-written because a fixed list of argument
 * questions is memorised within a fortnight, and the shape is what has to be
 * learnt, not the example.
 *
 * Two properties every generator here has to hold, and both are checked by the
 * smoke test rather than assumed:
 *
 *   - The correct option is not distinguishable by anything except being correct.
 *     Distractors are the same length and register, and are TRUE statements that
 *     simply are not the flaw, the conclusion, or the weakener. A distractor that
 *     is obviously silly teaches a child to pick the serious-sounding one.
 *   - The answer is not in a predictable position, and for the two-speaker form the
 *     key is not always the same value. That form has four possible answers (first
 *     only, second only, both, neither) and all four occur.
 *
 * Contexts come from what Leo already knows — minerals, fungi, making things,
 * animals — so the reading load does not get in the way of the reasoning, which is
 * the thing being tested.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var B = L.bank;
  if (!B) return;

  /* Shuffle options and report where the correct one landed. */
  function opts(rng, correct, wrong) {
    var all = rng.shuffle([{ t: correct, ok: true }].concat(wrong.map(function (w) { return { t: w, ok: false }; })));
    return {
      choices: all.map(function (o) { return { text: o.t }; }),
      answer: all.map(function (o) { return o.ok; }).indexOf(true)
    };
  }

  /* ------------------------------------------------------------ 1. the flaw */
  /* Every one of these turns on a hedged claim — "sometimes", "many", "can" —
     being read as if it said "always". That is the single most common reasoning
     error in the sample paper, and the distractors are deliberately things that
     are true of the speaker but are not the mistake. */
  var HEDGED = [
    { topic: 'fungi', fact: 'Many mushrooms that are poisonous are brightly coloured.',
      thing: 'a dull brown mushroom', claim: 'it is safe to eat', who: 'Ines',
      said: 'This one is brown, not bright, so it must be safe to eat.',
      flaw: 'assumed every poisonous mushroom is brightly coloured',
      real: 'The passage says <b>many</b> are brightly coloured, not all — so a dull one can still be poisonous.' },
    { topic: 'minerals', fact: 'Quartz crystals often grow with six flat sides.',
      thing: 'a crystal with five sides', claim: 'it cannot be quartz', who: 'Ben',
      said: 'This crystal has five sides, so it is definitely not quartz.',
      flaw: 'assumed every quartz crystal has six sides',
      real: '“Often” is not “always”. A broken or crowded quartz crystal can end up with a different number of faces.' },
    { topic: 'animals', fact: 'Bats can carry diseases that are dangerous to people.',
      thing: 'a bat in the garden', claim: 'it is dangerous', who: 'Ruby',
      said: 'There is a bat in our tree, so we are all in danger.',
      flaw: 'assumed every bat is carrying a disease',
      real: '“Can carry” means some do. It does not follow that this particular bat does.' },
    { topic: 'making', fact: 'Glue joints sometimes fail if the wood is damp.',
      thing: 'a joint that failed', claim: 'the wood must have been damp', who: 'Sam',
      said: 'This joint came apart, so the wood must have been damp.',
      flaw: 'assumed damp wood is the only thing that makes a joint fail',
      real: 'Damp wood is <b>one</b> cause the passage gives. A joint can fail for other reasons entirely.' },
    { topic: 'minecraft', fact: 'Redstone circuits stop working if the line is broken anywhere.',
      thing: 'a circuit that does not work', claim: 'the line must be broken', who: 'Ada',
      said: 'My door will not open, so somewhere the redstone line must be broken.',
      flaw: 'assumed a broken line is the only reason a circuit can fail',
      real: 'A broken line always stops a circuit, but that does not mean it is the only thing that can.' }
  ];

  function flawQ(lv, rng) {
    var h = rng.pick(HEDGED);
    var o = opts(rng, h.who + ' ' + h.flaw + '.', [
      h.who + ' did not give any evidence for what ' + h.who.toLowerCase() + ' said.',
      h.who + ' used a word with more than one meaning.',
      h.who + ' relied on what ' + h.who.toLowerCase() + ' had seen rather than on the text.'
    ]);
    return {
      topic: 'thinking', level: lv, sub: 'Finding the flaw', format: 'mc',
      prompt: '<div class="argbox"><p>' + h.fact + '</p>' +
        '<p><b>' + h.who + ':</b> “' + h.said + '”</p></div>' +
        'Which option best describes the flaw in ' + h.who + '’s reasoning?',
      choices: o.choices, answer: o.answer,
      explain: h.real + ' The other options describe things that may be true of ' + h.who +
        ', but they are not the mistake in the reasoning.'
    };
  }

  /* -------------------------------------------------------- 2. weaken a claim */
  var CLAIMS = [
    { who: 'Nadia', what: 'takes a stone from the creek every time she visits',
      critic: 'Her brother says she is stripping the creek bed bare.',
      weaken: 'Nadia only picks up stones from the pile the council tips there each spring.',
      near: ['Nadia has been collecting stones since she was five.',
             'Her brother has never collected anything himself.',
             'The creek is a popular place for families to visit.'],
      why: 'If the stones she takes were dumped there by the council, removing them takes nothing from the creek bed — which is exactly what the criticism claimed.' },
    { who: 'Theo', what: 'leaves his amethyst on the windowsill',
      critic: 'His mother says the sun will ruin its colour.',
      weaken: 'The window is on the south side of the house and never receives direct sun.',
      near: ['Theo has several other amethysts in a drawer.',
             'Amethyst is a common and inexpensive stone.',
             'His mother collects minerals herself.'],
      why: 'Sunlight is what fades amethyst. If no direct sun reaches that window, the mechanism behind the warning never happens.' },
    { who: 'Priya', what: 'eats a large meal straight after training',
      critic: 'Her coach says she will put on weight doing that.',
      weaken: 'Priya trains hard enough to use more energy each day than the food provides.',
      near: ['Priya enjoys cooking and prepares the meals herself.',
             'Her coach has trained many athletes over the years.',
             'Eating after exercise helps muscles repair.'],
      why: 'The warning assumes the food is more than she uses. If she uses more than she takes in, the predicted weight gain cannot follow.' },
    { who: 'Otto', what: 'digs up mushrooms to identify them',
      critic: 'A ranger says he is destroying the fungus.',
      weaken: 'Almost all of the fungus is the underground network, which is left untouched.',
      near: ['Otto photographs everything he finds before touching it.',
             'The ranger is responsible for a very large area.',
             'Some mushrooms are difficult to identify from above.'],
      why: 'The mushroom is only the fruiting body. If the organism itself is the network below and that is undisturbed, picking one does not destroy it.' }
  ];

  function weakenQ(lv, rng) {
    var c = rng.pick(CLAIMS);
    var o = opts(rng, c.weaken, c.near.slice(0, 3));
    return {
      topic: 'thinking', level: lv, sub: 'Weakening an argument', format: 'mc',
      prompt: '<div class="argbox"><p>' + c.who + ' ' + c.what + '. ' + c.critic + '</p></div>' +
        'Which statement, <b>if true</b>, most weakens the criticism?',
      choices: o.choices, answer: o.answer,
      explain: c.why + ' The others may all be true without touching the reason given for the criticism.'
    };
  }

  /* ------------------------------------------------------- 3. main conclusion */
  /* The trap is a supporting detail dressed up as the point. Each distractor here
     is drawn from the passage itself, so picking by familiarity does not work. */
  var ARGUMENTS = [
    { text: 'The new museum display lets visitors handle the specimens instead of viewing them behind glass. Fewer pieces are shown, and a handful have been chipped. But visitors stay almost twice as long as they did before, children ask far more questions, and the staff report that people remember what they saw weeks later. Some damage is a fair price for a room where people actually learn something.',
      conc: 'Allowing visitors to handle specimens is worth the damage it causes.',
      near: ['The new display shows fewer specimens than the old one.',
             'Children ask more questions when they can touch things.',
             'Museums should replace all their glass cases.'],
      why: 'The last sentence states the judgement; everything before it is evidence offered in support. The other options are either details used as support, or a wider claim the passage never makes.' },
    { text: 'Building a model from a kit teaches you to follow instructions accurately, which is genuinely useful. Building one from scratch teaches you something different: what to do when the instructions run out. Kits are easier to start and far more likely to be finished. Even so, the child who has improvised a bracket out of a bent paperclip has learnt the thing that transfers to everything else.',
      conc: 'Building without instructions teaches a more useful skill than building from a kit.',
      near: ['Kits are more likely to be finished than scratch builds.',
             'Following instructions accurately is a useful skill.',
             'Children should not be given model kits.'],
      why: 'The passage concedes several points in the kit’s favour and then overrules them in the last sentence — that reversal is where the conclusion sits. The first two options are the concessions; the third is stronger than anything the passage says.' },
    { text: 'The council wants to clear the fallen logs from the reserve to tidy it. Fallen wood is where most of the reserve’s fungi live, and those fungi are what return nutrients to the soil. Several of the birds that nest there feed on insects that only breed in rotting timber. A reserve that looks tidy and a reserve that works are not the same thing.',
      conc: 'The fallen logs should be left where they are.',
      near: ['Fungi return nutrients to the soil in the reserve.',
             'Some birds in the reserve eat insects from rotting wood.',
             'The council does not understand how reserves work.'],
      why: 'Every sentence builds a case against clearing the logs, which is the conclusion even though it is stated as a contrast rather than an instruction. Two options are the supporting facts; the last is an accusation the passage never makes.' }
  ];

  function conclusionQ(lv, rng) {
    var a = rng.pick(ARGUMENTS);
    var o = opts(rng, a.conc, a.near.slice(0, 3));
    return {
      topic: 'thinking', level: lv, sub: 'Main conclusion', format: 'mc',
      prompt: '<div class="argbox"><p>' + a.text + '</p></div>' +
        'Which option best states the <b>main conclusion</b> of the passage?',
      choices: o.choices, answer: o.answer,
      explain: a.why
    };
  }

  /* --------------------------------------- 4. necessary vs sufficient conditions */
  /* The sample's hardest question. A chain of requirements is given, and two people
     each draw an inference from it; the child decides who is right. Reading DOWN
     the chain from a lower step to the goal is a leap — meeting one requirement
     does not meet the rest. Reading UP from the goal is sound, because reaching
     the goal means every requirement below it was met.
     Both speakers are drawn independently from valid and invalid forms, so all
     four answers occur and the key cannot be guessed. */
  var CHAINS = [
    { goal: 'enter the gem show', mid: 'have a stall ticket', low: 'be a club member',
      names: ['Tom', 'Tara'],
      story: 'To enter the gem show you need a stall ticket and an adult with you. To get a stall ticket you must be a club member. To be a club member you must pay the fee and be nominated by two members.' },
    { goal: 'lead a fungi walk', mid: 'hold a guide badge', low: 'pass the identification test',
      names: ['Milo', 'Mira'],
      story: 'To lead a fungi walk you need a guide badge and a first aid card. To get a guide badge you must pass the identification test. To sit the identification test you must have attended ten walks.' },
    { goal: 'use the workshop alone', mid: 'hold a tool licence', low: 'finish the safety course',
      names: ['Jonah', 'Joss'],
      story: 'To use the workshop alone you need a tool licence and your own goggles. To get a tool licence you must finish the safety course. To start the safety course you must be over ten.' }
  ];

  function chainQ(lv, rng) {
    var c = rng.pick(CHAINS);
    // Two valid forms (reading up the chain) and two invalid ones (reading down).
    var FORMS = [
      { valid: true,  say: function (x) { return 'If someone can ' + x.goal + ', then they must ' + x.mid + '.'; },
        why: 'sound — reaching the goal means every requirement below it was met' },
      { valid: true,  say: function (x) { return 'If someone does not ' + x.mid + ', then they cannot ' + x.goal + '.'; },
        why: 'sound — a missing requirement blocks the goal' },
      { valid: false, say: function (x) { return 'If someone can ' + x.low + ', then they can ' + x.goal + '.'; },
        why: 'a leap — meeting one requirement does not meet the others' },
      { valid: false, say: function (x) { return 'If someone cannot ' + x.goal + ', then they did not ' + x.low + '.'; },
        why: 'a leap — they might have failed at some other requirement instead' }
    ];
    var f1 = rng.pick(FORMS), f2 = rng.pick(FORMS);
    var key = f1.valid && f2.valid ? 'Both ' + c.names[0] + ' and ' + c.names[1]
            : f1.valid ? c.names[0] + ' only'
            : f2.valid ? c.names[1] + ' only'
            : 'Neither ' + c.names[0] + ' nor ' + c.names[1];
    var all = [c.names[0] + ' only', c.names[1] + ' only',
               'Both ' + c.names[0] + ' and ' + c.names[1],
               'Neither ' + c.names[0] + ' nor ' + c.names[1]];
    // Keep these four in their usual order — it is a fixed answer set, like A-D.
    return {
      topic: 'thinking', level: lv, sub: 'Whose reasoning holds?', format: 'mc',
      prompt: '<div class="argbox"><p>' + c.story + '</p>' +
        '<p><b>' + c.names[0] + ':</b> “' + f1.say(c) + '”</p>' +
        '<p><b>' + c.names[1] + ':</b> “' + f2.say(c) + '”</p></div>' +
        'If the information above is true, whose reasoning is correct?',
      choices: all.map(function (t) { return { text: t }; }),
      answer: all.indexOf(key),
      explain: c.names[0] + ' is ' + (f1.valid ? '' : 'not ') + 'right: ' + f1.why + '. ' +
        c.names[1] + ' is ' + (f2.valid ? '' : 'not ') + 'right: ' + f2.why + '.<br>' +
        'The rule to hold on to: you can always reason <b>up</b> the chain from the goal, ' +
        'never <b>down</b> it from one requirement.'
    };
  }

  L.argue = {
    flawQ: flawQ, weakenQ: weakenQ, conclusionQ: conclusionQ, chainQ: chainQ,
    // level 3 meets the gentler two; the chain form is the sample paper's hardest
    pick: function (lv, rng) {
      var fns = lv <= 3 ? [flawQ, weakenQ]
              : lv === 4 ? [flawQ, weakenQ, conclusionQ]
              : [flawQ, weakenQ, conclusionQ, chainQ, chainQ];
      return rng.pick(fns)(lv, rng);
    }
  };
})(window);
