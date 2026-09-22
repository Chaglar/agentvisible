/* content-reading.js — interest-led reading passages.
 *
 * Appended to the bank in content-literacy.js rather than replacing it, so the
 * short early-level passages stay for warm-ups.
 *
 * Why these topics. Background knowledge is the strongest single predictor of
 * reading comprehension: a child who already knows a subject reads well above his
 * decoding level in it, because he is not spending effort working out what the
 * words refer to. Leo can name hundreds of fungi and dozens of minerals on sight,
 * so a passage about opal or mycelium is EASIER for him than a passage about a wet
 * sock, even though the words are far harder. That is the lever these use.
 *
 * Minecraft appears as a bridge to the real thing — real geology, real circuits,
 * real ecology — never as retold game lore. It earns attention and then spends it
 * on something true.
 *
 * Levels are weighted to 4 and 5, where the bank was thinnest, and passages are
 * longer than the originals (100-180 words) because the real OC paper's are.
 * Genres cover what the OC reading paper actually contains, including poetry,
 * which the bank had none of and which every source names as its hardest text type.
 *
 * Fields: lv (1-5), title, kind, theme, text (HTML), qs[{ p, c[], a, e }].
 * `skill` on a question records which OC reading skill it exercises, so coverage
 * can be checked rather than assumed.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};
  var C = L.content;
  if (!C || !C.PASSAGES) return;                 // content-literacy.js must load first

  var MORE = [

    /* ---------------------------------------------------------------- level 2 */
    { lv: 2, kind: 'information', theme: 'minerals', title: 'Glass From a Volcano',
      text: 'Obsidian is a black stone with edges so sharp they shine. It is really a kind of glass. When runny lava pours out of a volcano and cools very fast, the tiny parts inside it have no time to line up into crystals. They freeze where they are. That is what makes obsidian smooth instead of grainy. People once chipped it into knives and arrowheads, because a broken edge of obsidian can be sharper than a kitchen knife.',
      qs: [
        { p: 'Why does obsidian have no crystals in it?', c: ['The lava cooled too fast for crystals to form', 'It was never hot', 'The crystals were washed out by rain', 'It is made of sand'], a: 0, skill: 'comprehension',
          e: 'The lava cools “very fast”, so the tiny parts “have no time to line up into crystals”.' },
        { p: 'In this passage, “grainy” is the opposite of', c: ['smooth', 'black', 'sharp', 'hot'], a: 0, skill: 'vocabulary',
          e: 'The sentence says cooling fast makes obsidian “smooth instead of grainy”, so the two words are set against each other.' },
        { p: 'Why does the writer mention kitchen knives at the end?', c: ['To help you picture how sharp obsidian is', 'To say obsidian is used for cooking', 'To warn you not to go near volcanoes', 'To explain how knives are made'], a: 0, skill: 'evaluation',
          e: 'Comparing it to something you already know is a way of making “sharp” mean something real.' }
      ] },

    { lv: 2, kind: 'procedure', theme: 'fungi', title: 'Making a Spore Print',
      text: 'You can find out a lot about a mushroom without knowing its name. Cut the stem off and lay the cap gills-down on a sheet of paper. Put a bowl over the top so no draught gets in. Leave it overnight. In the morning, lift the cap. Underneath you will find a print in fine dust — sometimes white, sometimes brown, sometimes pink or black. Those are the spores. The colour is one of the first things an expert checks, because two mushrooms that look alike can drop quite different colours. Wash your hands afterwards, and never taste anything you have not had checked by someone who knows.',
      qs: [
        { p: 'Why is a bowl put over the mushroom cap?', c: ['To keep a draught from disturbing the spores', 'To keep the cap warm', 'To stop the paper blowing away', 'To make the print darker'], a: 0, skill: 'comprehension',
          e: '“Put a bowl over the top so no draught gets in.”' },
        { p: 'What does the passage suggest about mushrooms that look alike?', c: ['They may still be different kinds', 'They are always the same kind', 'They always drop white spores', 'They are safe to eat'], a: 0, skill: 'inference',
          e: 'It says two look-alike mushrooms “can drop quite different colours” — so looking the same is not enough.' },
        { p: 'The last sentence is there mainly to', c: ['keep the reader safe', 'end the passage politely', 'explain what spores are', 'describe the colours'], a: 0, skill: 'purpose',
          e: 'It is a warning, not a fact about spore prints.' }
      ] },

    /* ---------------------------------------------------------------- level 3 */
    { lv: 3, kind: 'information', theme: 'minerals', title: 'Why an Opal Holds a Rainbow',
      text: 'Most stones get their colour from what they are made of. An opal is different. Under a microscope, an opal is packed with tiny balls of silica, stacked like oranges in a crate. When light goes in, it bounces between the balls and splits into colours, the way it does in a soap bubble. Move the stone and the colours move too, because you are looking down a different path through the stack. If the balls are all the same size and neatly stacked, the flashes are bright. If they are jumbled, the opal is plain and milky. Australia digs up most of the world’s opal, much of it from Coober Pedy, a town in South Australia where the summers are so hot that many people live in houses carved underground.',
      qs: [
        { p: 'What makes the colours in an opal move when you tilt it?', c: ['Light takes a different path through the stacked balls', 'The stone changes what it is made of', 'Heat from your hand alters the colour', 'The balls roll around inside'], a: 0, skill: 'comprehension',
          e: '“Move the stone and the colours move too, because you are looking down a different path through the stack.”' },
        { p: 'Why does the writer compare the silica balls to oranges in a crate?', c: ['To show they are stacked in a regular pattern', 'To show they are the same colour as oranges', 'To show they can be eaten', 'To show how large they are'], a: 0, skill: 'evaluation',
          e: 'The comparison is about the neat stacking, which is what the rest of the passage depends on.' },
        { p: 'A plain, milky opal most likely has', c: ['silica balls of uneven size, jumbled up', 'no silica in it at all', 'larger crystals than a bright opal', 'been left out in the sun'], a: 0, skill: 'inference',
          e: 'The passage says jumbled balls give a plain, milky stone; you have to put that together yourself.' }
      ] },

    { lv: 3, kind: 'information', theme: 'fungi', title: 'The Biggest Living Thing on Earth',
      text: 'Ask most people to name the largest living thing and they will say a blue whale, or perhaps a giant redwood. Both are wrong. In a forest in Oregon there is a honey fungus that spreads underground across about nine square kilometres. Tests show it is all one organism, not thousands of separate ones. It is thought to be at least two thousand years old. Almost all of it is hidden: a mat of pale threads called mycelium, thinner than cotton, creeping between roots and rotting wood. What you can see above ground — a few clumps of honey-coloured mushrooms in autumn — is only the part that makes spores, the way an apple is only a small part of an apple tree.',
      qs: [
        { p: 'Why do most people get the answer wrong?', c: ['They think of things they can see', 'They have never heard of fungi', 'They think whales are plants', 'They are counting only trees'], a: 0, skill: 'inference',
          e: 'The passage contrasts whales and redwoods, which are visible, with a fungus that is “almost all hidden”.' },
        { p: 'What does the apple tree comparison explain?', c: ['That the mushrooms are only a small visible part of the fungus', 'That the fungus grows fruit', 'That the fungus is good to eat', 'That apples and mushrooms are related'], a: 0, skill: 'evaluation',
          e: 'It is there to show the size difference between the part you see and the whole organism.' },
        { p: 'In this passage, “organism” means', c: ['a single living thing', 'a kind of forest', 'a type of soil', 'a group of species'], a: 0, skill: 'vocabulary',
          e: '“It is all one organism, not thousands of separate ones” tells you it means one living thing.' }
      ] },

    { lv: 3, kind: 'information', theme: 'making', title: 'What Redstone Is Copying',
      text: 'In Minecraft, redstone dust carries a signal from a lever to a door. Real circuits work on the same idea, and the parts have the same jobs. A wire is the dust. A switch is the lever. A battery is what pushes the signal along, and that push is called voltage. There is one rule the game keeps: the loop has to be complete. Break the wire anywhere and nothing works, no matter how tidy the rest of it looks. That is why electricians speak of a circuit — the word means going around. The game leaves out the dangerous part. Real wires carry enough push to hurt you, which is why the ones in your walls are wrapped in plastic and why nobody opens a power point to have a look.',
      qs: [
        { p: 'What does the word “circuit” tell you about how electricity flows?', c: ['It must travel in a complete loop', 'It travels in a straight line', 'It moves only downwards', 'It needs no wire'], a: 0, skill: 'vocabulary',
          e: '“The word means going around”, and the passage says the loop has to be complete.' },
        { p: 'If a lamp does not light, this passage suggests you should first check', c: ['whether the loop is broken somewhere', 'whether the lamp is the right colour', 'how long the wire is', 'how tidy the wiring looks'], a: 0, skill: 'inference',
          e: '“Break the wire anywhere and nothing works, no matter how tidy the rest of it looks.”' },
        { p: 'The writer’s attitude to the game is best described as', c: ['it is a useful model but leaves things out', 'it is completely wrong about electricity', 'it is more accurate than real science', 'it is too hard for children'], a: 0, skill: 'tone',
          e: 'The passage says the parts “have the same jobs” but that the game “leaves out the dangerous part”.' }
      ] },

    /* ---------------------------------------------------------------- level 4 */
    { lv: 4, kind: 'information', theme: 'fungi', title: 'The Wood Wide Web',
      text: 'Under a healthy forest floor, tree roots are wrapped in fungal threads. It looks like an infection. It is closer to a trade. The fungus is good at pulling water and minerals out of soil but cannot make its own food. The tree makes sugar in its leaves but cannot reach far through the ground. So they swap, and both grow better than either would alone. Scientists call this arrangement mycorrhiza, from Greek words for fungus and root. The threads of one fungus often reach several trees at once, so a seedling growing in deep shade can be fed sugar from a large tree nearby. Researchers have shown this happens by feeding one tree carbon they could later identify, then finding it in a neighbour. Not everyone agrees about how much sharing really goes on, and the argument is still running.',
      qs: [
        { p: 'Why is “trade” a better word than “infection” for what the passage describes?', c: ['Both sides give something the other needs', 'The fungus takes without giving', 'The tree is harmed by the fungus', 'Money is involved'], a: 0, skill: 'evaluation',
          e: 'The fungus supplies water and minerals, the tree supplies sugar — each gives what the other cannot get.' },
        { p: 'How did researchers show sugar moves between trees?', c: ['They fed one tree carbon they could later recognise', 'They dug up the roots and measured them', 'They cut down a tree and watched its neighbour', 'They counted the mushrooms each autumn'], a: 0, skill: 'comprehension',
          e: 'They fed one tree carbon “they could later identify, then finding it in a neighbour”.' },
        { p: 'The last sentence suggests the writer thinks', c: ['the science is real but not yet settled', 'the whole idea has been disproved', 'nobody has studied it properly', 'the argument does not matter'], a: 0, skill: 'tone',
          e: 'Saying the argument “is still running” accepts the evidence while admitting it is not finished.' }
      ] },

    { lv: 4, kind: 'information', theme: 'minerals', title: 'How Deep a Diamond Starts',
      text: 'In the game you dig down near bedrock and there they are. In the world, diamonds begin about a hundred and fifty kilometres beneath your feet, far deeper than any mine has ever reached. Down there the rock is hot and the weight of everything above squeezes carbon until its atoms lock into the tightest pattern they can make. That pattern is what makes diamond the hardest natural material we know. So how do they reach us? Every so often, a violent eruption tears up a narrow pipe of rock from those depths and fires it at the surface faster than a car on a motorway. The rock it leaves behind is called kimberlite, and that is what diamond miners actually look for. Nobody has ever made a diamond at the depth it forms. They are all hitch-hikers, brought up by accident.',
      qs: [
        { p: 'Why can no mine reach the depth where diamonds form?', c: ['It is about a hundred and fifty kilometres down', 'The rock there is too soft', 'The diamonds move around', 'There is no oxygen'], a: 0, skill: 'comprehension',
          e: 'The passage says this is “far deeper than any mine has ever reached”.' },
        { p: 'What makes diamond so hard?', c: ['Its carbon atoms are locked in the tightest possible pattern', 'It is the oldest rock on Earth', 'It cooled very quickly', 'It contains metal'], a: 0, skill: 'comprehension',
          e: 'Pressure squeezes carbon “until its atoms lock into the tightest pattern they can make”.' },
        { p: 'Calling diamonds “hitch-hikers” suggests that they', c: ['did not travel up under their own power', 'are found beside roads', 'are easy to pick up', 'are worth very little'], a: 0, skill: 'evaluation',
          e: 'A hitch-hiker gets a lift from something else — here, the eruption. The next words, “brought up by accident”, confirm it.' }
      ] },

    { lv: 4, kind: 'poem', theme: 'minerals', title: 'Geode',
      text: '<div class="verse">Nothing about the outside asks to be picked up.<br>A grey fist of a stone, dull as a road.<br>You could walk past it for a hundred years.<br><br>But set it on the block and bring the hammer down<br>and the dull thing opens like a word you finally hear —<br>a cave no bigger than your palm,<br>purple, spined, and older than the hill.<br><br>Nobody put those crystals there for you.<br>Water did it, slowly, in the dark,<br>for longer than there have been eyes.</div>',
      qs: [
        { p: 'What is the main contrast the poem is built on?', c: ['The plain outside and the striking inside', 'The hammer and the stone', 'The hill and the road', 'Water and crystal'], a: 0, skill: 'main idea',
          e: 'The first verse is all dullness; the second is all colour. Everything else serves that contrast.' },
        { p: '“Opens like a word you finally hear” suggests the moment feels', c: ['like something hidden suddenly making sense', 'loud and frightening', 'slow and disappointing', 'like listening to music'], a: 0, skill: 'evaluation',
          e: 'A word you “finally” hear is one that was there all along but meant nothing until now — which is what the stone does.' },
        { p: 'The line “Nobody put those crystals there for you” mainly makes the reader feel', c: ['small beside something very old', 'angry at being left out', 'proud of finding the stone', 'worried about breaking it'], a: 0, skill: 'tone',
          e: 'It is followed by “longer than there have been eyes”, which sets the reader against an enormous stretch of time.' }
      ] },

    { lv: 4, kind: 'information', theme: 'fungi', title: 'Dressed as a Warning',
      text: 'The fly agaric is the mushroom everyone can draw: scarlet cap, white flecks, storybook stalk. It is also poisonous. That pairing is not a coincidence. Plenty of living things that can harm you advertise it — wasps in yellow and black, some frogs in blue, some snakes in red bands. Biologists call it warning colouration. It only works if the predator learns, so the animal has to survive one bad experience and remember it. A creature that hides is betting you will not find it. A creature in bright red is betting you already know. The rule for anyone walking in a forest is simpler than the biology: look, photograph, leave it standing. Colour is a clue to a mushroom, never a verdict, and plenty of deadly ones are a modest brown.',
      qs: [
        { p: 'Why does warning colouration only work if a predator survives?', c: ['It has to live to learn and remember the lesson', 'It needs to warn other predators', 'It must eat the whole mushroom', 'It has to be able to see red'], a: 0, skill: 'inference',
          e: '“It only works if the predator learns, so the animal has to survive one bad experience and remember it.”' },
        { p: '“A creature that hides is betting you will not find it. A creature in bright red is betting you already know.” These two sentences are built to', c: ['set two opposite survival strategies side by side', 'describe two kinds of mushroom', 'explain how predators hunt', 'show that red is the safest colour'], a: 0, skill: 'text structure',
          e: 'The matching shape of the two sentences points up the contrast between hiding and advertising.' },
        { p: 'What is the writer’s main warning in the last sentence?', c: ['A dull colour does not mean a mushroom is safe', 'Brown mushrooms are always safe', 'Only red mushrooms are dangerous', 'You should never walk in forests'], a: 0, skill: 'purpose',
          e: '“Plenty of deadly ones are a modest brown” — the point is that colour cannot be trusted either way.' }
      ] },

    { lv: 4, kind: 'procedure', theme: 'making', title: 'The Maker’s Rule',
      text: 'Anyone who builds things learns the same lesson, usually the expensive way. Measure twice, cut once. A cut cannot be taken back, so the thirty seconds you spend checking are cheaper than the hour you spend starting again. Good makers go further than that. Before committing to the real material, they build a rough version out of cardboard or scrap — a prototype — to find the mistakes while mistakes are still cheap. A prototype is not a failed attempt. It is a question you are asking the design, and the answer arrives before it can cost you anything. The people who post their builds online rarely show the three cardboard versions in the bin. Watching only the finished piece can leave you thinking your own first try went badly, when in fact you are comparing it to somebody’s fourth.',
      qs: [
        { p: 'According to the passage, what is a prototype for?', c: ['Finding mistakes while they are still cheap to fix', 'Showing other people your skill', 'Practising measuring', 'Using up scrap material'], a: 0, skill: 'comprehension',
          e: '“To find the mistakes while mistakes are still cheap.”' },
        { p: 'Why does the writer mention the cardboard versions in the bin?', c: ['To explain why finished builds online look so easy', 'To say cardboard is a poor material', 'To suggest makers waste a lot', 'To show that bins should be checked'], a: 0, skill: 'purpose',
          e: 'It sets up the last sentence: you compare your first try to somebody’s fourth without knowing it.' },
        { p: '“A prototype is not a failed attempt. It is a question you are asking the design.” The writer says this to', c: ['change how the reader judges an imperfect first version', 'explain how to ask good questions', 'argue that designs cannot be planned', 'describe a kind of test'], a: 0, skill: 'evaluation',
          e: 'Reframing it as a question rather than a failure is the whole point of the sentence.' }
      ] },

    /* ---------------------------------------------------------------- level 5 */
    { lv: 5, kind: 'information', theme: 'minerals', title: 'The Colour That Leaves',
      text: 'Amethyst is quartz with a flaw. Pure quartz is clear; amethyst contains a trace of iron, and natural radiation deep in the ground has altered how that iron sits in the crystal. The result is purple — from a faint lilac to something close to ink. The flaw is the value. What is less often mentioned is that the colour is not permanent. Leave a good amethyst on a sunny windowsill for a year or two and it will fade towards a washed-out grey, and no amount of darkness will bring it back. Collectors know this and store their best stones out of the light, which produces an odd situation: the finest specimens in a collection are the ones nobody sees. Heat does something stranger still. Warm certain amethysts carefully and the purple turns golden, and much of the citrine sold in shops began life this way.',
      qs: [
        { p: '“The flaw is the value.” This sentence is doing which job in the passage?', c: ['Turning a defect into the reason the stone is prized', 'Warning the reader about fake stones', 'Explaining how quartz is formed', 'Arguing that amethyst is overpriced'], a: 0, skill: 'evaluation',
          e: 'The paragraph has just called the iron a flaw; this line points out that without it there would be nothing but clear quartz.' },
        { p: 'What does the passage call “an odd situation”?', c: ['The best stones are kept where nobody can look at them', 'Amethyst is cheaper than quartz', 'Collectors prefer faded stones', 'Citrine is more valuable than amethyst'], a: 0, skill: 'comprehension',
          e: 'Because light fades them, the finest specimens are stored in the dark.' },
        { p: 'From the last sentence you can work out that some citrine on sale is', c: ['heated amethyst rather than naturally golden quartz', 'a completely different mineral from quartz', 'always more valuable than amethyst', 'coloured with dye'], a: 0, skill: 'inference',
          e: '“Much of the citrine sold in shops began life this way” — that is, as amethyst that was warmed.' }
      ] },

    { lv: 5, kind: 'poem', theme: 'fungi', title: 'What the Forest Is Doing Underneath',
      text: '<div class="verse">You are told the forest is the trees.<br>It is not. It is the handshake under them,<br>a million threads too fine to photograph,<br>passing sugar in the dark like notes in class.<br><br>The tall ones look like winners.<br>They are not standing. They are held.<br><br>And when one falls, the whole grey web<br>takes it apart with enormous patience<br>and hands it back as soil,<br>which is the only kind of forgetting<br>that builds anything.</div>',
      qs: [
        { p: 'What is the poem’s central claim about a forest?', c: ['What matters most is hidden below ground', 'Trees compete rather than co-operate', 'Forests are smaller than they appear', 'Fallen trees are wasted'], a: 0, skill: 'main idea',
          e: 'The opening flatly rejects “the forest is the trees” and the rest of the poem is about what lies underneath.' },
        { p: '“They are not standing. They are held.” The effect of these six words is to', c: ['overturn the idea that big trees are independent', 'describe how trees are planted', 'suggest the trees are about to fall', 'explain how roots grow'], a: 0, skill: 'evaluation',
          e: 'The short, flat sentences take away the word “standing”, which implies doing it alone, and replace it with being supported.' },
        { p: '“The only kind of forgetting that builds anything” describes decay as', c: ['a loss that turns into something useful', 'a failure of memory', 'a slow kind of damage', 'something that should be prevented'], a: 0, skill: 'tone',
          e: '“Forgetting” is usually a loss, but here it produces soil — so the line asks you to hold both at once.' }
      ] },

    { lv: 5, kind: 'persuasive', theme: 'minerals', title: 'Leave the Stone Where It Lies',
      text: 'Every collector starts the same way: one interesting rock in a pocket. It seems harmless, and for one child on one afternoon it is. The trouble is arithmetic. A popular national park can take two million visitors in a year. If one in a thousand pockets a stone, that is two thousand stones gone, and a beach of smooth pebbles becomes a beach of sand in a decade. Nothing replaces them at the rate they leave. Defenders of collecting make a fair point: children who pick things up are the ones who grow into geologists, and a rule that keeps hands in pockets may cost us more than it saves. But the choice is not really between collecting and not collecting. Quarry tips, rock shops and old mine dumps are full of specimens nobody is counting, and a stone bought with pocket money teaches the same lesson as a stone taken from a creek bed — except that the creek still has its stone.',
      qs: [
        { p: 'What is the writer’s main argument?', c: ['Collect from places where it does no harm, not from protected ones', 'Children should not be allowed to collect rocks at all', 'National parks should be closed to visitors', 'Buying rocks is always better than finding them'], a: 0, skill: 'main idea',
          e: 'The last sentence offers tips, shops and mine dumps as the alternative — the objection is to where, not to collecting.' },
        { p: 'Why does the writer include the argument from “defenders of collecting”?', c: ['To answer the strongest objection rather than ignore it', 'To show that collecting has no defenders', 'To change their own mind mid-passage', 'To fill space before the conclusion'], a: 0, skill: 'text structure',
          e: 'Calling it “a fair point” and then answering it is how a persuasive text deals with the other side.' },
        { p: '“The trouble is arithmetic.” What does the writer mean?', c: ['One person’s harmless act becomes serious when multiplied', 'The park cannot count its visitors', 'Geology requires mathematics', 'The numbers in the argument are wrong'], a: 0, skill: 'evaluation',
          e: 'The sentences that follow do the multiplication: two million visitors, one in a thousand, two thousand stones.' }
      ] },

    { lv: 5, kind: 'narrative', theme: 'making', title: 'The Fourth One',
      text: 'The first three were on the bench where he had left them, and none of them worked. Sam turned the newest one over. The joint was neat this time — he had spent an hour on the joint — and it still would not hold weight. Behind him his sister said, without looking up, "You could just buy one." He did not answer. She was not being unkind; she genuinely could not see the difference, and he had stopped trying to explain it. A bought one would sit on the shelf and be a shelf bracket. This one, when it finally held, would be the answer to a question he had been asking since Tuesday. He picked up the pencil, drew a line two centimetres further along the grain, and reached for the saw. The clock in the kitchen said half past four. There was time for a fifth.',
      qs: [
        { p: 'Why does Sam not answer his sister?', c: ['He has given up explaining something she does not share', 'He is angry with her', 'He did not hear her', 'He agrees with her'], a: 0, skill: 'inference',
          e: '“She was not being unkind; she genuinely could not see the difference, and he had stopped trying to explain it.”' },
        { p: 'What does the contrast between “a shelf bracket” and “the answer to a question” show about Sam?', c: ['He values the solving more than the object', 'He thinks bought things are badly made', 'He wants to sell what he makes', 'He does not need a shelf at all'], a: 0, skill: 'evaluation',
          e: 'The bought one would be only what it is; his would be the end of a problem he has been working on.' },
        { p: 'The last three sentences suggest Sam feels', c: ['determined rather than defeated', 'bored with the project', 'worried about the time', 'annoyed at his sister'], a: 0, skill: 'tone',
          e: 'He measures again, reaches for the saw, and notes that there is time for a fifth — nothing there is giving up.' }
      ] }
  ];

  MORE.forEach(function (p) { C.PASSAGES.push(p); });
})(window);
