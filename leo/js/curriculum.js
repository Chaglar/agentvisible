/* curriculum.js — maps this app's difficulty ladder onto the real Australian
   Curriculum v9 and onto the two tests being practised.

   Sources checked September 2026:
     - Australian Curriculum v9, Mathematics Year 2 and Year 3 content descriptions
       (australiancurriculum.edu.au; code list cross-checked against QCAA's
       Year 2 v9 alignment document).
     - NAPLAN: nap.edu.au "What's in the tests" and "Tailored tests". Year 3 sits
       Reading (45 min), Conventions of Language (45 min, spelling then grammar and
       punctuation), Numeracy (40 min), plus Writing on paper. Online tests branch by
       testlet: everyone starts on A, then moves to B (less complex) or D (more
       complex); a low score on A routes to C first and B afterwards.
     - NSW Opportunity Class placement test (education.nsw.gov.au): three computer
       based sections — Reading 40 min, Mathematical Reasoning 35 questions in 40 min
       with FIVE options per question, Thinking Skills 30 questions in 30 min with
       FOUR options. Content is drawn from the NSW curriculum up to Year 4. The test
       is a fixed form; it does not adapt.

   The year numbers below are the year level at which the Australian Curriculum
   actually introduces that content — not the year Leo is in. Levels 4 and 5 are
   deliberately ahead of Year 2, because that is the point of the exercise. */
(function (root) {
  var L = root.LEO = root.LEO || {};

  // topic -> level (1..5) -> { yr: curriculum year, ac: [codes], note }
  var MAP = {
    number: {
      1: { yr: 1, ac: ['AC9M1N01'], note: 'Numbers to 120, two-digit place value' },
      2: { yr: 2, ac: ['AC9M2N01'], note: 'Order and represent numbers to at least 1000' },
      3: { yr: 2, ac: ['AC9M2N02'], note: 'Partition and rename three-digit numbers; the role of zero' },
      4: { yr: 3, ac: ['AC9M3N01'], note: 'Place value to 10 000, digit value, ordering' },
      5: { yr: 4, ac: ['AC9M4N01'], note: 'Larger numbers and rounding' }
    },
    addsub: {
      1: { yr: 1, ac: ['AC9M1A01'], note: 'Addition and subtraction facts within 20' },
      2: { yr: 2, ac: ['AC9M2N04', 'AC9M2A02'], note: 'Two-digit addition and subtraction, part-part-whole' },
      3: { yr: 2, ac: ['AC9M2N04'], note: 'Regrouping and missing-part problems' },
      4: { yr: 3, ac: ['AC9M3N03'], note: 'Three-digit addition and subtraction in context' },
      5: { yr: 4, ac: ['AC9M4N06'], note: 'Multi-step written problems' }
    },
    multdiv: {
      1: { yr: 2, ac: ['AC9M2A03', 'AC9M2N05'], note: 'Doubling and halving; ×2 facts; arrays' },
      2: { yr: 2, ac: ['AC9M2N05', 'AC9M2N06'], note: 'Equal groups and arrays, ×5 and ×10' },
      3: { yr: 3, ac: ['AC9M3A02'], note: 'Multiplication facts for 3, 4, 6, 7, 8, 9 — Leo’s focus area' },
      4: { yr: 4, ac: ['AC9M4N05', 'AC9M4A02'], note: 'Missing factors, division, word problems' },
      5: { yr: 4, ac: ['AC9M4N05'], note: 'Remainders, two-step, derived facts' }
    },
    fractions: {
      1: { yr: 1, ac: ['AC9M1N02'], note: 'One half of a shape or collection' },
      2: { yr: 2, ac: ['AC9M2N03', 'AC9M2M02'], note: 'Halves, quarters and eighths by repeated halving' },
      3: { yr: 3, ac: ['AC9M3N02'], note: 'Thirds, fifths and sixths; fraction of a collection' },
      4: { yr: 4, ac: ['AC9M4N03', 'AC9M4N04'], note: 'Equivalence, comparing, fractions on a number line' },
      5: { yr: 4, ac: ['AC9M4N04', 'AC9M5N04'], note: 'Adding same denominators, mixed numbers, ordering' }
    },
    patterns: {
      1: { yr: 1, ac: ['AC9M1A02'], note: 'Repeating patterns' },
      2: { yr: 2, ac: ['AC9M2A01'], note: 'Additive patterns with a constant amount; missing elements' },
      3: { yr: 3, ac: ['AC9M3A01'], note: 'Number patterns including sevens and eights' },
      4: { yr: 4, ac: ['AC9M4A01'], note: 'Rules and function machines' },
      5: { yr: 5, ac: ['AC9M5A02'], note: 'Two-step rules' }
    },
    measurement: {
      1: { yr: 2, ac: ['AC9M2M01', 'AC9M2M04'], note: 'Informal units; o’clock' },
      2: { yr: 2, ac: ['AC9M2M01', 'AC9M2M03', 'AC9M2M04'], note: 'Informal units, calendars, half past' },
      3: { yr: 2, ac: ['AC9M2M04', 'AC9M2N06'], note: 'Quarter past and quarter to; money' },
      4: { yr: 3, ac: ['AC9M3M01', 'AC9M3M02'], note: 'Formal units (cm, m, mL, g); time to the minute' },
      5: { yr: 4, ac: ['AC9M4M01', 'AC9M4M03'], note: 'Unit conversion, area, perimeter, elapsed time' }
    },
    geometry: {
      1: { yr: 1, ac: ['AC9M1SP01'], note: 'Naming familiar 2D shapes' },
      2: { yr: 2, ac: ['AC9M2SP01'], note: 'Features of shapes: sides and corners' },
      3: { yr: 2, ac: ['AC9M2SP01', 'AC9M2M05'], note: 'Symmetry, 3D objects, turns' },
      4: { yr: 3, ac: ['AC9M3SP01', 'AC9M3SP02'], note: 'Faces, edges, vertices; grid references' },
      5: { yr: 4, ac: ['AC9M4SP01', 'AC9M4SP03'], note: 'Shape properties and transformations' }
    },
    data: {
      1: { yr: 1, ac: ['AC9M1ST01'], note: 'Reading a picture graph' },
      2: { yr: 2, ac: ['AC9M2ST01', 'AC9M2ST02'], note: 'Collecting and comparing data' },
      3: { yr: 3, ac: ['AC9M3ST01'], note: 'Reading a bar graph with a scale' },
      4: { yr: 3, ac: ['AC9M3ST02'], note: 'Comparing and interpreting data displays' },
      5: { yr: 3, ac: ['AC9M3P01'], note: 'Chance — the curriculum introduces this in Year 3, not Year 2' }
    },
    reading: {
      1: { yr: 1, ac: ['AC9E1LY05'], note: 'Literal comprehension of a short text' },
      2: { yr: 2, ac: ['AC9E2LY05'], note: 'Retrieving and connecting information' },
      3: { yr: 3, ac: ['AC9E3LY05'], note: 'Inference and figurative language' },
      4: { yr: 4, ac: ['AC9E4LY05'], note: 'Main idea, author viewpoint, vocabulary in context' },
      5: { yr: 5, ac: ['AC9E5LY05'], note: 'Evaluating an argument across a whole text' }
    },
    language: {
      1: { yr: 1, ac: ['AC9E1LY10', 'AC9E1LA08'], note: 'Common spellings, capital letters, full stops' },
      2: { yr: 2, ac: ['AC9E2LY09', 'AC9E2LA08'], note: 'Question marks, plurals, simple sentences' },
      3: { yr: 3, ac: ['AC9E3LY09', 'AC9E3LA06'], note: 'Apostrophes, tense, commas in lists' },
      4: { yr: 4, ac: ['AC9E4LY09', 'AC9E4LA07'], note: 'Speech marks, clauses, harder spellings' },
      5: { yr: 5, ac: ['AC9E5LY09'], note: 'Possessives, agreement, irregular spellings' }
    },
    thinking: {
      1: { yr: 2, ac: [], note: 'OC Thinking Skills — pattern and category reasoning' },
      2: { yr: 2, ac: [], note: 'OC Thinking Skills — sequences and odd one out' },
      3: { yr: 3, ac: [], note: 'OC Thinking Skills — deduction from clues, codes' },
      4: { yr: 4, ac: [], note: 'OC Thinking Skills — multi-clue deduction, balance logic' },
      5: { yr: 4, ac: [], note: 'OC Thinking Skills — what must be true, constraint puzzles' }
    },
    reasoning: {
      1: { yr: 2, ac: ['AC9M2N06'], note: 'OC Mathematical Reasoning — one-step modelling' },
      2: { yr: 2, ac: ['AC9M2N06'], note: 'OC Mathematical Reasoning — combinations' },
      3: { yr: 3, ac: ['AC9M3N04'], note: 'OC Mathematical Reasoning — two-step problems' },
      4: { yr: 4, ac: ['AC9M4N06'], note: 'OC Mathematical Reasoning — working backwards, tables' },
      5: { yr: 4, ac: ['AC9M4N06'], note: 'OC Mathematical Reasoning — rate and comparison' }
    }
  };

  /* the real tests, for the UI to quote rather than invent */
  var TESTS = {
    naplan: {
      name: 'NAPLAN (Year 3)',
      sections: [
        { key: 'reading', label: 'Reading', minutes: 45 },
        { key: 'language', label: 'Conventions of language', minutes: 45, note: 'spelling, then grammar and punctuation' },
        { key: 'numeracy', label: 'Numeracy', minutes: 40 }
      ],
      adaptive: true,
      adaptiveNote: 'Online NAPLAN is a tailored test. Every student starts on testlet A; the next testlet is harder (D) or easier (B) depending on how A went, and a low score on A routes to C first.',
      options: 4,
      source: 'nap.edu.au'
    },
    oc: {
      name: 'NSW Opportunity Class placement test',
      sections: [
        { key: 'reading', label: 'Reading', minutes: 40 },
        { key: 'thinking', label: 'Thinking Skills', minutes: 30, questions: 30, options: 4 },
        { key: 'reasoning', label: 'Mathematical Reasoning', minutes: 40, questions: 35, options: 5 }
      ],
      adaptive: false,
      adaptiveNote: 'The OC placement test is a fixed form — every child sits the same hard paper, so this mode does not adapt.',
      scope: 'NSW curriculum content up to Year 4',
      source: 'education.nsw.gov.au'
    }
  };

  function forQuestion(topic, level) {
    var t = MAP[topic];
    return (t && t[level]) || { yr: null, ac: [], note: '' };
  }

  L.curriculum = {
    MAP: MAP, TESTS: TESTS, forQuestion: forQuestion,
    // how many options a question in this topic should offer
    optionsFor: function (topic) {
      return (topic === 'reasoning') ? 5 : 4;   // OC Mathematical Reasoning uses five
    },
    yearLabel: function (yr) { return yr == null ? '—' : 'Year ' + yr; }
  };
})(window);
