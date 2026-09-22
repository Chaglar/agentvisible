/* writing.js — writing tasks.
 *
 * This is the part of the app aimed at Leo's one declining area: his alphabet
 * writing fluency fell from the 98th percentile at four to the 47th at six, and
 * his teacher reports writing and spelling behind. Multiple-choice spelling
 * measures recognition; none of it measures production. These tasks do.
 *
 * Three lengths, because fluency is built by writing often and briefly, not by
 * one long piece a week:
 *   - spark   one sentence, about two minutes. Almost no barrier to starting.
 *   - short   a paragraph, five to ten minutes.
 *   - naplan  a full narrative or persuasive piece, the shape of the real Year 3
 *             paper, which is handwritten on paper in 40 minutes.
 *
 * The clock counts up and never runs out. His processing speed sits at the 6th
 * percentile; a countdown would measure his weakest channel instead of his writing.
 */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var TASKS = [
    /* ---------- spark: one sentence ---------- */
    { id: 's1', kind: 'spark', mins: 2, sym: '🐙', title: 'One sentence',
      prompt: 'Write <b>one sentence</b> about this octopus. Give it a name.',
      focus: 'Capital letter at the start, full stop at the end.' },
    { id: 's2', kind: 'spark', mins: 2, sym: '🌧️', title: 'One sentence',
      prompt: 'Write <b>one sentence</b> that starts with: <b>When the rain came…</b>',
      focus: 'Keep the letters sitting on the line.' },
    { id: 's3', kind: 'spark', mins: 2, sym: '🦘', title: 'One sentence',
      prompt: 'Write <b>one sentence</b> telling someone something surprising about kangaroos.',
      focus: 'Try to use a word longer than six letters.' },
    { id: 's4', kind: 'spark', mins: 2, sym: '🍕', title: 'Two sentences',
      prompt: 'Write <b>two sentences</b>: one saying what your favourite food is, one saying why.',
      focus: 'Two sentences means two full stops.' },
    { id: 's5', kind: 'spark', mins: 2, sym: '🚪', title: 'One sentence',
      prompt: 'There is a door in your bedroom wall that was not there yesterday. Write <b>one sentence</b> about what is behind it.',
      focus: 'Make the reader want to know more.' },
    { id: 's6', kind: 'spark', mins: 2, sym: '❓', title: 'A question',
      prompt: 'Write <b>one question</b> you would ask an astronaut.',
      focus: 'A question ends with a question mark.' },

    /* ---------- short: a paragraph ---------- */
    { id: 'p1', kind: 'short', mins: 7, sym: '🏖️', title: 'A small moment',
      prompt: 'Write about <b>one thing that happened at the beach</b>. Not the whole day — just one moment.',
      focus: 'Three or four sentences. Say what you could hear and smell, not only what you saw.' },
    { id: 'p2', kind: 'short', mins: 7, sym: '🐕', title: 'Describe',
      prompt: 'Describe a dog so well that someone could pick it out in a park full of dogs.',
      focus: 'Use at least three describing words.' },
    { id: 'p3', kind: 'short', mins: 8, sym: '🔧', title: 'Explain how',
      prompt: 'Explain <b>how to make a sandwich</b> to someone who has never seen one.',
      focus: 'Put the steps in order. First, then, next, finally.' },
    { id: 'p4', kind: 'short', mins: 8, sym: '🎒', title: 'Persuade',
      prompt: 'Your class is voting on one thing to add to the playground. Write a paragraph saying <b>what it should be and why</b>.',
      focus: 'Give two reasons, not one.' },
    { id: 'p5', kind: 'short', mins: 7, sym: '🌙', title: 'A strange night',
      prompt: 'You wake up and everything in your house is upside down. Write what you do next.',
      focus: 'Start in the middle of the action, not with “One day”.' },
    { id: 'p6', kind: 'short', mins: 8, sym: '📮', title: 'A letter',
      prompt: 'Write a short letter to your future self, aged sixteen.',
      focus: 'Start with Dear, and remember the comma after it.' },

    /* ---------- naplan: the real shape ---------- */
    { id: 'n1', kind: 'naplan', genre: 'Narrative', mins: 40, sym: '🗝️',
      title: 'Narrative — The Key',
      prompt: 'Today you are going to write a <b>narrative</b> — a story.<br><br>The idea for your story is <b>the key</b>.<br><br>It might be a key you found, or a key that opens something it should not, or a key nobody can find. It is up to you.',
      focus: 'Plan for two minutes first. Who is in it? What goes wrong? How does it end?' },
    { id: 'n2', kind: 'naplan', genre: 'Narrative', mins: 40, sym: '🌊',
      title: 'Narrative — The Wave',
      prompt: 'Today you are going to write a <b>narrative</b> — a story.<br><br>The idea for your story is <b>the wave</b>.<br><br>It could be a wave of water, or a wave of people, or something else waving. Your story can be set anywhere.',
      focus: 'Give your character a problem in the first few sentences.' },
    { id: 'n3', kind: 'naplan', genre: 'Persuasive', mins: 40, sym: '📱',
      title: 'Persuasive — Screens at school',
      prompt: 'Some people think students should be allowed to use tablets in every lesson. Others think they should be used only sometimes.<br><br>What do <b>you</b> think? Write to convince a reader.',
      focus: 'Say what you think, give three reasons, then say it again at the end.' },
    { id: 'n4', kind: 'naplan', genre: 'Persuasive', mins: 40, sym: '🐾',
      title: 'Persuasive — Class pet',
      prompt: 'Your teacher has said the class can have one pet in the classroom.<br><br>Write to convince your teacher <b>which animal it should be</b>.',
      focus: 'Think about what someone might say against your idea, and answer it.' },
    { id: 'n5', kind: 'naplan', genre: 'Narrative', mins: 40, sym: '🕯️',
      title: 'Narrative — The last one',
      prompt: 'Today you are going to write a <b>narrative</b> — a story.<br><br>The idea for your story is <b>the last one</b>.<br><br>The last biscuit, the last train, the last person awake. You choose.',
      focus: 'Try to make the reader feel something at the end.' }
  ];

  var KINDS = {
    spark:  { label: 'One sentence', blurb: 'Two minutes. Just get the pen moving.', emoji: '⚡' },
    short:  { label: 'A paragraph',  blurb: 'Five to ten minutes on one idea.',      emoji: '✏️' },
    naplan: { label: 'Full NAPLAN piece', blurb: '40 minutes, like the real test. On paper.', emoji: '📝' }
  };

  L.writing = {
    TASKS: TASKS, KINDS: KINDS,
    byKind: function (kind) { return TASKS.filter(function (t) { return t.kind === kind; }); },
    pick: function (kind, rng) {
      var pool = L.writing.byKind(kind);
      return pool[Math.floor((rng ? rng.next() : Math.random()) * pool.length)];
    },
    get: function (id) { return TASKS.filter(function (t) { return t.id === id; })[0] || null; }
  };
})(window);
