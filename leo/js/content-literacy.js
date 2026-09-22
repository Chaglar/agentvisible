/* content-literacy.js — the hand-written literacy content.
   Kept apart from the generators so it can be extended without touching code.
   Australian spelling and Australian settings throughout, because that is what
   both NAPLAN and the OC reading paper use. Each passage carries a `lv` for the
   difficulty ladder (see curriculum.js for how a level maps to a year level). */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var PASSAGES = [
    { lv: 1, title: 'The Magpie', text: 'A magpie sits on our fence every morning. Dad calls her Maggie. She sings a long, warbling song. When Dad puts out mince, she hops down and takes it, then flies back to the fence.',
      qs: [
        { p: 'Where does the magpie sit?', c: ['On our fence', 'On the roof', 'In the kitchen', 'On the car'], a: 0, e: 'The first sentence says she sits on our fence.' },
        { p: 'What does Dad put out for her?', c: ['Mince', 'Bread', 'Seeds', 'Water'], a: 0, e: '“When Dad puts out mince, she hops down and takes it.”' },
        { p: 'How often does the magpie come?', c: ['Every morning', 'Once a week', 'Only in summer', 'Never'], a: 0, e: 'The words “every morning” tell you.' }
      ] },
    { lv: 1, title: 'Wet Shoes', text: 'Tom jumped in the puddle on the way to school. The water went over the top of his shoes. All morning his socks squelched when he walked. At lunch, Miss Patel lent him a spare pair from the lost property box.',
      qs: [
        { p: 'Why did Tom’s socks squelch?', c: ['They were wet from the puddle', 'They were too big', 'He had new shoes', 'He was running'], a: 0, e: 'He jumped in a puddle and water went over his shoes.' },
        { p: 'Who helped Tom?', c: ['Miss Patel', 'His mum', 'Another student', 'Nobody'], a: 0, e: 'Miss Patel lent him a spare pair.' },
        { p: 'Where did the spare socks come from?', c: ['The lost property box', 'Tom’s bag', 'The office', 'A shop'], a: 0, e: 'The last sentence names the lost property box.' }
      ] },
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
    { lv: 2, title: 'Nan’s Lemon Tree', text: 'Nan’s lemon tree is older than Dad. It leans to one side because of the wind off the bay. Every winter it gives us more lemons than we can use, so Nan leaves a bucket of them at the front gate with a sign that says FREE.',
      qs: [
        { p: 'Why does the tree lean?', c: ['Because of the wind off the bay', 'Because it is old', 'Because someone pushed it', 'Because of the lemons'], a: 0, e: 'The second sentence gives the reason directly.' },
        { p: 'What does Nan do with the extra lemons?', c: ['Leaves them at the gate for free', 'Sells them', 'Throws them out', 'Makes juice'], a: 0, e: 'She leaves a bucket at the front gate with a FREE sign.' },
        { p: 'What does “older than Dad” tell you about the tree?', c: ['It was planted before Dad was born', 'Dad planted it', 'It is dying', 'It is very small'], a: 0, e: 'If the tree is older, it was already there before Dad existed.' }
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
    { lv: 3, title: 'How a Boomerang Returns', text: 'Not every boomerang comes back. The returning kind has two wings set at a slight angle to each other. As it spins, one wing always moves faster through the air than the other. That difference tips the boomerang over as it flies, bending its path into a wide circle. Hunting boomerangs are heavier and are not made to return at all — coming back would be useless to a hunter.',
      qs: [
        { p: 'What makes a returning boomerang curve?', c: ['One wing moves faster through the air than the other', 'It is thrown very hard', 'It is lighter than air', 'The wind pushes it back'], a: 0, e: 'The third and fourth sentences explain the speed difference and what it does.' },
        { p: 'Why are hunting boomerangs not made to return?', c: ['A returning throw would be no use when hunting', 'They are too heavy to throw', 'They break easily', 'They are only decorations'], a: 0, e: 'The last sentence says coming back would be useless to a hunter.' },
        { p: 'What does the word “slight” mean in “a slight angle”?', c: ['Small', 'Sharp', 'Wide', 'Broken'], a: 0, e: '“Slight” means small or gentle.' }
      ] },
    { lv: 3, title: 'The Queue', text: 'The canteen line stretched past the library. Sam had exactly two dollars and wanted a sausage roll before they ran out. Ahead of him, two Year 6 boys were arguing about whose turn it was. The bell for the end of lunch was only six minutes away. Sam counted the people in front of him: fourteen.',
      qs: [
        { p: 'What is Sam worried about?', c: ['Not getting a sausage roll before lunch ends', 'Losing his money', 'The Year 6 boys', 'Being late to class'], a: 0, e: 'The passage puts three pressures together: a long queue, six minutes, and food running out.' },
        { p: 'Which detail shows time is running out?', c: ['The bell was only six minutes away', 'He had two dollars', 'The line passed the library', 'Fourteen people were ahead'], a: 0, e: 'The bell detail is the one about time; the others are about money or length.' },
        { p: 'Why does the writer mention “exactly two dollars”?', c: ['To show Sam has no spare money if the price is higher', 'To show Sam is rich', 'To show he will buy two things', 'To show he found the money'], a: 0, e: '“Exactly” signals there is no room for error.' }
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
      ] },
    { lv: 4, title: 'The Cane Toad Mistake', text: 'In 1935, cane toads were released in Queensland to eat a beetle that was damaging sugar cane. The plan failed almost immediately. The beetles lived high on the cane stalks; the toads could not climb. Worse, the toads had no predators here, bred quickly, and poisoned the native animals that tried to eat them. They now cover much of northern Australia. The lesson is not that the toads are evil — it is that a solution imported without testing can cost more than the problem.',
      qs: [
        { p: 'Why could the toads not control the beetles?', c: ['The beetles lived high on the stalks and toads cannot climb', 'The toads preferred other food', 'The beetles were too fast', 'There were too few toads'], a: 0, e: 'The third sentence gives exactly this reason.' },
        { p: 'What is the writer’s main point in the last sentence?', c: ['Untested solutions can cause bigger problems than they solve', 'Cane toads are evil', 'Queensland should not grow sugar cane', 'Beetles are harmless'], a: 0, e: 'The writer explicitly rejects “evil” and states the real lesson.' },
        { p: 'What does the word “Worse” at the start of the fourth sentence signal?', c: ['Another problem is about to be added', 'The writer is changing topic', 'The problem was solved', 'A summary is coming'], a: 0, e: '“Worse” stacks a further problem on the one just described.' }
      ] },
    { lv: 5, title: 'Should Homework Be Banned?', text: 'Some people argue that primary homework should be scrapped. They point to studies showing little link between homework and results before high school. Others reply that the point is not the worksheet but the habit: a child who sits down for fifteen minutes each evening learns to start work without being chased. Both sides may be right. The evidence against homework is mostly about long, repetitive tasks — which is not the same thing as a short, regular routine.',
      qs: [
        { p: 'What position does the writer end up taking?', c: ['That the two sides are arguing about different kinds of homework', 'That homework should be banned', 'That homework should be doubled', 'That the studies are wrong'], a: 0, e: 'The last sentence distinguishes long repetitive tasks from a short regular routine.' },
        { p: 'What do supporters of homework value most, according to the text?', c: ['The habit of starting work independently', 'Better test results', 'Keeping children busy', 'Pleasing parents'], a: 0, e: '“The point is not the worksheet but the habit.”' },
        { p: 'Which word signals the writer is about to give the other side?', c: ['Others', 'Some', 'Both', 'Which'], a: 0, e: '“Others reply that…” introduces the opposing view.' }
      ] },
    { lv: 5, title: 'The Slowest Race', text: 'In a slow bicycle race the winner is the last rider to cross the line, but anyone who puts a foot down is out. This flips the usual problem. Speed is easy to add; balance at almost zero speed is not. Riders weave, stand on the pedals and turn the handlebars hard to stay upright. The best competitors are often not the fittest, but the ones who learned to ride on rough ground as children.',
      qs: [
        { p: 'Why is a slow bicycle race difficult?', c: ['Staying balanced at almost no speed is hard', 'The distance is very long', 'The bicycles are heavy', 'There are too many riders'], a: 0, e: '“Balance at almost zero speed is not [easy]” is the key line.' },
        { p: 'Who tends to win, according to the writer?', c: ['Riders who learned on rough ground as children', 'The fittest riders', 'The youngest riders', 'Riders with the best bicycles'], a: 0, e: 'The final sentence says exactly this and contrasts it with fitness.' },
        { p: 'What does “This flips the usual problem” mean?', c: ['The normal goal of a race is reversed', 'The bicycles are turned over', 'The rule is unfair', 'The race is dangerous'], a: 0, e: 'Normally you race to be fastest; here you race to be slowest without stopping.' }
      ] }
  ];

  /* Conventions of language. NAPLAN runs spelling first, then grammar and punctuation. */
  var SPELL = [
    ['because', 'becuase', 'becos', 'beacause'], ['friend', 'freind', 'frend', 'friende'],
    ['beautiful', 'beutiful', 'beautifull', 'beautifil'], ['tomorrow', 'tomorow', 'tommorow', 'tomorrowe'],
    ['favourite', 'favorite', 'favurite', 'favouright'], ['people', 'peaple', 'peopel', 'pepole'],
    ['question', 'questoin', 'qestion', 'questien'], ['enough', 'enuff', 'enoug', 'enouhg'],
    ['different', 'diffrent', 'diferent', 'differant'], ['knew', 'nue', 'nuw', 'knue'],
    ['caught', 'cought', 'caugt', 'cawt'], ['through', 'thruogh', 'throuhg', 'thorough'],
    ['school', 'schoool', 'scool', 'shcool'], ['writing', 'writting', 'writeing', 'wrighting'],
    ['surprise', 'suprise', 'surprize', 'surpise'], ['exciting', 'exsiting', 'excitting', 'exciteing'],
    ['thought', 'thort', 'thougt', 'thaught'], ['scissors', 'sissors', 'scisors', 'scissers'],
    ['colour', 'color', 'culour', 'colur'], ['realise', 'realize', 'relise', 'realice'],
    ['neighbour', 'nieghbour', 'naybour', 'neighbor'], ['practise', 'practice', 'practese', 'practize'],
    ['theatre', 'theater', 'theatere', 'theatr'], ['centre', 'center', 'sentre', 'centere'],
    ['library', 'libary', 'libery', 'liberry'], ['Wednesday', 'Wensday', 'Wednsday', 'Wedensday'],
    ['February', 'Febuary', 'Febrary', 'Feburary'], ['restaurant', 'restarant', 'resturant', 'restaraunt'],
    ['believe', 'beleive', 'belive', 'beleve'], ['receive', 'recieve', 'receeve', 'reseive'],
    ['separate', 'seperate', 'seperete', 'sepparate'], ['necessary', 'neccessary', 'necesary', 'nesessary'],
    ['definitely', 'definately', 'definatly', 'defiantly'], ['probably', 'probally', 'probbably', 'probabley'],
    ['argument', 'arguement', 'arguemant', 'argumant'], ['occasion', 'ocasion', 'occassion', 'occassian'],
    ['bicycle', 'bycicle', 'bicicle', 'bycycle'], ['chocolate', 'choclate', 'chocolat', 'chocholate'],
    ['vegetable', 'vegtable', 'vegetible', 'vegatable'], ['machine', 'mashine', 'machien', 'machin'],
    ['island', 'iland', 'islend', 'isand'], ['muscle', 'mussle', 'muscel', 'musle'],
    ['whether', 'wether', 'whther', 'wheather'], ['weight', 'wieght', 'waight', 'weigth'],
    ['built', 'bilt', 'buit', 'buillt'], ['answer', 'anser', 'ansewr', 'answere'],
    ['Australia', 'Austrailia', 'Austalia', 'Australlia'], ['Sydney', 'Sidney', 'Sydny', 'Sydnee'],
    ['kangaroo', 'kangeroo', 'kangaru', 'kangarroo'], ['immediately', 'imediately', 'immediatly', 'immeadiately']
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
    ['The books ____ on the shelf all week.', 'have been', ['has been', 'is', 'was'], 'Books is plural → <b>have been</b>.'],
    ['My sister and ____ walked to school.', 'I', ['me', 'myself', 'mine'], 'Take the other person out: “<b>I</b> walked to school”, not “me walked”.'],
    ['Mum gave the tickets to Dad and ____ .', 'me', ['I', 'myself', 'mine'], 'Take the other person out: “gave the tickets to <b>me</b>”.'],
    ['There are ____ apples left in the bowl.', 'fewer', ['less', 'lesser', 'little'], '<b>Fewer</b> is for things you can count; “less” is for amounts like water.'],
    ['The team ____ playing well this season.', 'is', ['are', 'were', 'be'], 'A team acting as one group takes <b>is</b> in Australian school grammar.'],
    ['I could not find my hat ____ my gloves.', 'or', ['and', 'but', 'so'], 'After a negative we use <b>or</b> to continue the list.'],
    ['She sang ____ than her brother.', 'better', ['gooder', 'more good', 'best'], 'The comparative of “good” is <b>better</b>. “Best” compares three or more.'],
    ['Of all the puppies, that one is the ____ .', 'smallest', ['smaller', 'more small', 'small'], 'Comparing more than two things uses the superlative <b>smallest</b>.'],
    ['We ____ our lunch before the bell went.', 'had eaten', ['have ate', 'has eaten', 'was eating'], 'One past action finished before another → <b>had eaten</b>.'],
    ['Everyone ____ their own water bottle.', 'brings', ['bring', 'are bringing', 'have brought'], '<b>Everyone</b> is singular, so the verb takes -s.'],
    ['The cat, along with the two dogs, ____ in the sun.', 'sleeps', ['sleep', 'are sleeping', 'have slept'], 'The subject is “the cat” — the phrase in commas does not change it, so <b>sleeps</b>.'],
    ['Put the shoes ____ the door.', 'beside', ['besides', 'beside of', 'aside'], '<b>Beside</b> means next to; “besides” means “as well as”.'],
    ['He asked ____ we were ready.', 'whether', ['weather', 'wether', 'rather'], '<b>Whether</b> introduces a choice; “weather” is rain and sun.'],
    ['The bike ____ wheel is bent belongs to Sam.', 'whose', ['who’s', 'which', 'that’s'], '<b>Whose</b> shows belonging; “who’s” means “who is”.'],
    ['I don’t want ____ chips, thanks.', 'any', ['some', 'no', 'none'], 'After a negative we use <b>any</b>.'],
    ['They arrived ____ the concert had started.', 'after', ['then', 'so', 'and'], '<b>After</b> shows the order of two events.'],
    ['The glass fell and ____ .', 'broke', ['breaked', 'broken', 'breaking'], 'The simple past of “break” is <b>broke</b>.'],
    ['She has ____ her homework already.', 'done', ['did', 'done did', 'doing'], 'After “has” we need the past participle <b>done</b>.'],
    ['It was ____ hot to play outside.', 'too', ['to', 'two', 'toe'], '<b>Too</b> means more than enough.'],
    ['We saw ____ kangaroos near the fence.', 'those', ['them', 'that', 'this'], 'Before a plural noun we use <b>those</b>.'],
    ['Neither the cat nor the dogs ____ hungry.', 'are', ['is', 'was', 'has'], 'With “neither…nor”, the verb matches the nearer subject — “dogs” → <b>are</b>.']
  ];

  var PUNCT = [
    ['Which sentence is written correctly?', 'On Monday, Leo went to Sydney.', ['on monday, leo went to sydney.', 'On monday, Leo went to sydney.', 'On Monday leo went to Sydney'], 'Days, names and places start with a capital letter, and a sentence ends with a full stop.'],
    ['Which sentence needs a question mark?', 'Where did you put my shoes', ['I put your shoes away', 'The shoes are blue', 'Put the shoes away'], 'It asks something, so it ends with <b>?</b>'],
    ['Choose the correct sentence.', 'That is Sam’s bike.', ['That is Sams bike.', 'That is Sams’ bike.', 'That is Sam bike’s.'], 'One person named Sam owns it → <b>Sam’s</b>.'],
    ['Choose the correct sentence.', 'I bought apples, pears and milk.', ['I bought apples pears and milk.', 'I bought, apples pears and milk.', 'I bought apples, pears, and, milk.'], 'Commas separate items in a list.'],
    ['Which one uses speech marks correctly?', '“Come inside,” said Mum.', ['Come inside, said Mum.', '“Come inside, said Mum.”', 'Come “inside,” said Mum.'], 'Speech marks go around the exact words spoken.'],
    ['Where does the full stop go?', 'We walked home in the rain.', ['We walked. home in the rain', 'We. walked home in the rain', 'We walked home. in the rain'], 'A full stop goes at the end of a complete sentence.'],
    ['Choose the correct sentence.', 'The children’s coats are wet.', ['The childrens’ coats are wet.', 'The childrens coats are wet.', 'The children coats’ are wet.'], '“Children” is already plural, so add <b>’s</b>.'],
    ['Which sentence is correct?', 'It’s too cold to swim.', ['Its too cold to swim.', 'Its’ too cold to swim.', 'It is’ too cold to swim.'], '“It’s” = “it is”. Try reading it the long way to check.'],
    ['Which sentence is correct?', 'The two dogs’ bowls were empty.', ['The two dog’s bowls were empty.', 'The two dogs bowls’ were empty.', 'The two dogs bowl’s were empty.'], 'More than one dog, so the apostrophe goes after the s: <b>dogs’</b>.'],
    ['Which sentence needs an exclamation mark?', 'Look out', ['I am reading a book', 'The sky is grey', 'She walked slowly'], 'It is a sudden warning, so it takes <b>!</b>'],
    ['Choose the correctly punctuated sentence.', '“Are we there yet?” asked Ben.', ['“Are we there yet.” asked Ben.', '“Are we there yet” asked Ben?', 'Are we there yet? “asked Ben.”'], 'The question mark belongs inside the speech marks, with the question.'],
    ['Where should the comma go?', 'After the game, we had fish and chips.', ['After, the game we had fish and chips.', 'After the game we had, fish and chips.', 'After the game we had fish, and chips.'], 'A comma follows an opening phrase before the main part of the sentence.'],
    ['Choose the correct sentence.', 'My birthday is in July.', ['My birthday is in july.', 'my birthday is in July.', 'My Birthday is in july.'], 'Months take a capital letter; ordinary nouns like “birthday” do not.'],
    ['Which sentence uses the apostrophe correctly?', 'We didn’t see the bus.', ['We did’nt see the bus.', 'We didnt’ see the bus.', 'We didnt see the bus.'], 'The apostrophe replaces the missing letter in “did not” → <b>didn’t</b>.'],
    ['Choose the correct sentence.', 'Nan asked, “Who wants a lemon?”', ['Nan asked “Who wants a lemon?”', 'Nan asked, Who wants a lemon?', 'Nan asked, “who wants a lemon?”'], 'A comma introduces the speech, and the first spoken word takes a capital.'],
    ['Which sentence is correct?', 'They’re waiting at their gate over there.', ['Their waiting at they’re gate over there.', 'There waiting at their gate over they’re.', 'They’re waiting at there gate over their.'], '<b>They’re</b> = they are, <b>their</b> = belonging to them, <b>there</b> = that place.']
  ];

  /* OC Thinking Skills static banks */
  var ODDONE = [
    [['🍎', '🍌', '🍇', '🥕'], 3, 'The carrot is a vegetable — the others are fruit.'],
    [['🐶', '🐱', '🐟', '🐰'], 2, 'The fish lives in water; the others are land animals with fur.'],
    [['⚽', '🏀', '🎾', '🎹'], 3, 'The piano is an instrument — the others are balls.'],
    [['🚗', '🚲', '✈️', '🏠'], 3, 'The house does not move — the others carry people.'],
    [['🌧️', '☀️', '❄️', '📚'], 3, 'The book is not weather.'],
    [['🐝', '🦋', '🐞', '🐍'], 3, 'The snake has no wings and is not an insect.'],
    [['🔴', '🔵', '🟢', '⬛'], 3, 'The others are circles; the black one is a square.'],
    [['🥄', '🍴', '🔪', '🪥'], 3, 'The toothbrush is not used for eating.'],
    [['👟', '🧦', '🧤', '🎩'], 2, 'Gloves go on hands; the others are worn below the head — and shoes and socks go on feet.'],
    [['🌻', '🌹', '🌳', '🌷'], 2, 'A tree is not a flower.'],
    [['🚒', '🚑', '🚓', '🛴'], 3, 'The scooter is not an emergency vehicle.'],
    [['🥚', '🐣', '🐔', '🍞'], 3, 'The bread is not part of a chicken’s life cycle.'],
    [['📐', '📏', '✂️', '🧮'], 2, 'Scissors cut; the others measure or count.'],
    [['🇦🇺', '🦘', '🐨', '🐼'], 3, 'The panda is not Australian.'],
    [['2️⃣', '4️⃣', '6️⃣', '7️⃣'], 3, 'Seven is odd; the others are even.'],
    [['🏊', '🚴', '🏃', '📺'], 3, 'Watching television is not exercise.']
  ];

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
      'Taller than Ben, and Ben is taller than Ali — so all of them clear Ali too.'],
    ['No bus leaves the depot before six o’clock. The 25 left the depot today.', 'The 25 left at or after six o’clock.',
      ['The 25 left at exactly six o’clock.', 'The 25 is the first bus of the day.', 'Some buses leave before six.'],
      '“No bus before six” rules out everything earlier, but it does not pin down the exact time.'],
    ['Whenever Nan bakes, the kitchen smells of lemon. The kitchen does not smell of lemon.', 'Nan has not baked.',
      ['Nan is out.', 'Nan baked something else.', 'The kitchen window is open.'],
      'Baking always produces the smell, so no smell means no baking. Any other explanation is a guess.'],
    ['Three of the four tanks are full. Tank B is empty.', 'Tanks A, C and D are full.',
      ['Tank B leaks.', 'All the tanks were filled today.', 'Tank A is the largest.'],
      'If exactly one is not full and that one is B, the other three must be the full ones.'],
    ['Everyone who finished the race got a ribbon. Jo did not get a ribbon.', 'Jo did not finish the race.',
      ['Jo came last.', 'Jo did not enter the race.', 'The ribbons ran out.'],
      'Finishing guarantees a ribbon, so no ribbon means no finish. Whether she entered at all is not stated.'],
    ['The shop sells only red and blue bikes. Tim bought a bike there that is not red.', 'Tim’s bike is blue.',
      ['Tim wanted a red bike.', 'The shop had no red bikes left.', 'Blue bikes cost more.'],
      'With only two possibilities, ruling out one leaves the other.'],
    ['Some of the books on the shelf are library books. All the library books have a barcode.', 'Some books on the shelf have a barcode.',
      ['All the books have a barcode.', 'No books have a barcode.', 'The library books are the newest.'],
      '“Some are library books” plus “all library books have barcodes” gives you “some have barcodes” — not “all”.'],
    ['Every Tuesday the canteen sells sushi. Today the canteen is not selling sushi.', 'Today is not Tuesday.',
      ['The canteen is closed.', 'Sushi sold out.', 'The canteen never sells sushi.'],
      'Tuesday always means sushi, so no sushi rules out Tuesday. Why there is no sushi is not stated.'],
    ['Ravi is older than Kim. Kim is older than Tom. Tom is older than Bea.', 'Ravi is older than Bea.',
      ['Kim is the oldest.', 'Bea and Tom are twins.', 'Ravi is the youngest.'],
      'Follow the chain down: Ravi > Kim > Tom > Bea, so Ravi is older than Bea.'],
    ['The only way into the garden is through the gate. The gate has been locked all day.', 'Nobody walked into the garden today.',
      ['The garden is empty.', 'Someone lost the key.', 'The gate is broken.'],
      'One entrance, locked all day, so no one entered. Someone already inside is a different question.']
  ];

  L.content = { PASSAGES: PASSAGES, SPELL: SPELL, GRAMMAR: GRAMMAR, PUNCT: PUNCT, ODDONE: ODDONE, MUSTBETRUE: MUSTBETRUE };
})(window);
