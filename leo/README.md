# Leo's Test Lab

Two practice tests for a Year 2 student in Australia (NAPLAN and OC), plus a parent
dashboard that reports progress against an age-referenced scale.

Static HTML/CSS/JS with one serverless function. No build step, no framework, no npm
dependencies. Records are stored server-side so a tablet and a laptop see the same
history; a local copy keeps the pages working offline.

- `/leo/` — student page
- `/leo/admin/` — parent dashboard
- `/api/progress` — the record

Everything is in English, because that is the language of both tests.

## The two modes

**NAPLAN practice** reproduces NAPLAN's *tailored test* behaviour. Questions arrive in
blocks; do well and the next block steps up a difficulty level, struggle and it steps
down. The real Year 3 online test works the same way — every student starts on testlet A
and is routed to an easier or harder testlet from there — so a hard-feeling paper is a
good sign. Immediate feedback with a worked explanation after every question.

**OC practice** is deliberately *not* adaptive, because the NSW Opportunity Class
placement test is a fixed hard form for everyone. It sits high on the ladder throughout,
is timed, and withholds feedback until the end. Its Mathematical Reasoning questions
offer **five** options, matching the real paper; Thinking Skills offers four.

**Focus drill** — ten questions on one topic, adapting question by question. The home
screen orders these weakest-first.

**Fix-ups** — after any round, anything he got wrong is taught, not just marked. The
app groups the wrong answers by kind, takes the three most common, and for each one
shows a short lesson: one line at a time, each with a picture, ending in a single
sentence to remember. Then it asks a *fresh* question of the same kind. Get it right
and it is ticked off; get it wrong and it explains that specific question and offers an
easier one of the same type. An explanation a child only nods at does not stick — doing
one is what makes it stick.

**Choosing and answering are two separate taps.** Picking an option only highlights
it; nothing is recorded until *Check my answer*, and tapping a different option moves
the highlight. A stray tap on a phone used to commit an answer outright and there was
no way back.

The home screen also chooses when answers appear: straight away, or held to the end like
a real exam. Either way the fix-up round runs afterwards.

## Fast maths — number-fact fluency

The quiz asks whether he can *work something out*. This asks whether he can *recall
it*. Those are different skills and need different machinery, so this is a separate
mode rather than more question types.

Three sets, matching the gaps his practice actually shows:

| Set | Facts | What it covers |
|---|---|---|
| Add & take away to 20 | 116 | Number bonds both ways, including bridging ten |
| Counting in 6s 7s 8s 9s | 40 | The ladder up each table, with the arc picture |
| Times tables 6 7 8 9 | 88 | × and ÷ to 12, both directions |

**Answers are typed, not chosen.** Four options let you work backwards from the
answers, which is exactly the habit this mode exists to make unnecessary. A large
keypad handles it on a tablet; a physical keyboard works too.

**The clock measures time to the first keypress, not time to submit.** Leo's
processing speed sits at the 6th percentile, so total time would largely measure how
fast he can find digits on a keypad. Time-to-first-key is thinking time, which is the
thing worth knowing. **Nothing is ever marked wrong for being slow** — speed is
diagnosis, never grade, and there is no countdown anywhere.

**A fact counts as known only after two correct answers under three seconds, on
separate sittings.** One fast answer is luck; a right-but-slow answer means he is
still counting it out. Those two look identical on an ordinary test — both are just a
tick — and separating them is the entire point of the mode.

Scheduling is Leitner-style, derived from the log rather than stored: wrong sends a
fact back to box 0, right-and-fast moves it up one, right-but-slow leaves it where it
is. Boxes come round after 0, 1, 3, 7 and 21 days. **30% of every set is reserved for
facts he has not met yet** — without that reserve the ones he keeps getting wrong are
permanently due and crowd out the rest of the table, which a simulation over 14
sessions showed happening (57 of 88 facts never appeared at all).

The dashboard draws the whole times-table grid, one cell per fact, coloured green /
amber / orange / red for known, nearly, right-but-counting, and getting-it-wrong, with
his typical thinking time in the cell. A topic score of "80% right" cannot tell you
*which* four facts are missing; this can.

Storage is an **append-only attempt log**. Box and fluency are derived on read rather
than written down, so two devices merge by id with no conflict resolution and no
last-write-wins — the same property the answer log has.

## Writing

The one area his assessments show going backwards: alphabet writing fluency fell from
the 98th percentile at four to the 47th at six, and his teacher reports writing and
spelling behind. Multiple-choice spelling measures recognition; none of the rest of the
app measures production. This does.

He picks a task, writes it **on paper**, photographs it, and gets it marked. Paper
rather than a keyboard for two reasons: letter formation is the skill that slipped and a
keyboard measures none of it, and the real Year 3 NAPLAN writing test is handwritten in
40 minutes. Typing is offered as a fallback, and when he types, nothing is said about
handwriting.

Three lengths, because fluency comes from writing often and briefly rather than once a
week at length: **one sentence** (~2 min), **a paragraph** (~7 min), and a **full NAPLAN
piece** (40 min, narrative or persuasive, in the shape of the real paper). 17 tasks. The
clock counts up and never runs out — a countdown would measure his processing speed,
which sits at the 6th percentile, instead of his writing.

The marking returns: a verbatim transcription (errors kept), misspellings with a hint
each, letter-formation notes from the image (reversals, baseline, sizing, spacing),
punctuation, what genuinely worked quoted from his own writing, **at most two** things to
fix next — a child with a writing aversion given nine corrections writes less next time,
not more — a short note addressed to him, and 1–5 scores on letters, spelling,
punctuation, ideas and structure. Those scores drive a section of the dashboard; they are
deliberately kept out of the ability model, because a rubric judgement is not an item
response and averaging the two would be dishonest.

**Setup.** `api/writing.js` calls Claude (`claude-opus-5`) with the photo and a JSON
schema. Add `ANTHROPIC_API_KEY` to the Vercel project; without it the endpoint reports
`configured: false` and the rest of the app is unaffected. Roughly a couple of cents per
piece. Server-side refusal fallbacks are enabled; if your account lacks that beta, remove
the `betas` and `fallbacks` lines from the request.

**Privacy.** The photo is held in memory for the length of the request and never written
to storage. Only the derived assessment is returned, and only that is kept in the record.

### Why the lessons are shaped this way

They follow Leo's assessment profile rather than a generic teaching style: visual-spatial
reasoning at the 98th percentile, auditory working memory at the 25th, processing speed at
the 6th. So every lesson gives **one short line at a time, carried by a picture**, never a
paragraph or a verbal chain to hold in the head, and never a rule learnt by chanting. The
times-table lessons are built on structure rather than recall — eights are three doublings,
sevens are fives plus twos, nines are tens minus one lot — and they rebuild themselves
around the actual numbers he got wrong. The OC clock counts up and never runs out, because
under time pressure is precisely where his profile says he stops showing what he knows.

Lesson content is in `js/coach.js`, separate from the flow that runs it.

## Question bank

Questions are generated, not drawn from a fixed list, so the maths topics do not
meaningfully repeat. Measured distinct items (ignoring option shuffling, which is not
real variety):

| Topic | Distinct items |
|---|---|
| Addition & subtraction | 78,000+ (effectively unbounded) |
| Number & place value | 27,000+ |
| Thinking skills | 13,500+ |
| Maths reasoning | 11,000+ |
| Multiplication & division | 6,400+ |
| Shape & space | 4,700 |
| Fractions | 2,300 |
| Measurement & time | 1,900 |
| Data & chance | 1,700 |
| Patterns & algebra | 311 |
| Grammar & spelling | 98 (hand-written) |
| Number facts (fluency mode) | 244 (a fixed, deliberately finite set) |
| Reading | 101 (32 passages, hand-written) |

Reading and language are hand-written and therefore finite — extend them in
`js/content-literacy.js` and `js/content-reading.js`, which hold nothing but content.

### Why the reading passages are about minerals, fungi and making things

Background knowledge is the strongest single predictor of reading comprehension: a
child reads well above his decoding level in a subject he already knows, because he
is not spending effort working out what the words refer to. Leo can name hundreds of
fungi and dozens of minerals on sight, so a passage about opal or mycorrhiza is
*easier* for him than one about a wet sock, despite far harder vocabulary. The
passages in `content-reading.js` use that.

Minecraft appears as a bridge to the real subject — real geology, real circuits,
real ecology — never as retold game lore. It earns the attention and then spends it
on something true.

The set covers what the OC reading paper actually contains, including **poetry**,
which the bank previously had none of and which every source names as its hardest
text type.

`content-reading-oc.js` adds the paper's harder shapes, written after reading an
actual OC reading sample:

- **Extract matching** — several labelled texts and a statement to place against
  one of them. The answer options *are* the labels, so the generator must not
  shuffle them; the smoke test renders a few hundred of these and checks the labels
  stay in order and still match the explanation, because a shuffle here would mark
  the wrong extract correct on every attempt while looking perfectly normal.
- **Paired texts** — two extracts on one idea, with questions answerable only by
  holding both in mind. The sample paper's hardest question was of this kind.
- **A poem that withholds its subject.** The sample used Tennyson's *Crossing the
  Bar*, which never says "death"; the whole task is to arrive at it. The earlier
  poems here state their contrast outright, which is a gentler exercise.

That sample was harder than this bank had assumed — a ~900-word Victorian folk tale
beside a Mark Twain extract, then policy prose with vocabulary like *heterogeneous*
and *subsistence*. Register in this file is correspondingly heavier. Note that the
real papers draw on public-domain classics precisely because they are free to
reproduce, which is an option open to this bank too. Questions are tagged with the OC reading skill they exercise
(comprehension, inference, evaluation, text structure, tone, vocabulary) so coverage
can be checked rather than assumed.

## Argument analysis (OC Thinking Skills)

`bank-argue.js`, added after reading an actual Thinking Skills sample in which
**four of ten questions were argument analysis** — a family this bank had none of.
It could produce matrices, sequences, codes and ordering puzzles, but nothing that
asked a child to find the flaw in someone's reasoning.

| Family | What it asks |
|---|---|
| Finding the flaw | Name the reasoning error, usually reading a hedged claim ("many", "sometimes") as if it said "all" |
| Weakening an argument | Which statement, if true, removes the mechanism the criticism depends on |
| Main conclusion | Which sentence is the point, and which are the support for it |
| Whose reasoning holds? | A chain of requirements, two speakers, necessary vs sufficient conditions |

Generated rather than hand-written, because a fixed list is memorised in a
fortnight and it is the shape that has to be learnt. Two properties the smoke test
checks rather than assumes: distractors are **true statements that simply are not
the answer** (an obviously silly distractor teaches a child to pick the
serious-sounding one), and the answer is not parked in one position. The
two-speaker form has four possible keys and all four occur.

Contexts are drawn from subjects Leo already knows, so reading load does not
obscure the reasoning, which is the thing being tested.

## Curriculum alignment

`js/curriculum.js` maps every topic and level onto Australian Curriculum v9 content
codes and the year level at which that content is actually introduced. The dashboard's
topic table shows the code, so "level 3" is never mistaken for "Year 3 work".

What that mapping surfaced, and what the levels now respect:

- Year 2 fractions are **halves, quarters and eighths, reached by repeated halving**
  (AC9M2N03, AC9M2M02). Thirds, fifths and sixths are Year 3 (AC9M3N02) and now sit at
  level 3, not level 2. A folding question was added as the Year 2 route to eighths.
- Year 2 multiplication is **×2 facts, doubling and halving, arrays and equal groups**
  (AC9M2N05, AC9M2A03). The 3–9 tables are Year 3–4. Leo's ×7 and ×8 focus is therefore
  stretch content by design, and is labelled Year 3/Year 4 rather than presented as
  year-level work.
- Year 2 measurement uses **informal units** (AC9M2M01) and reads a **calendar**
  (AC9M2M03). Both were missing and have been added; formal cm/mL/g now start at
  level 4, which is Year 3 (AC9M3M01).
- Year 2 time is to the **hour, half-hour and quarter-hour** (AC9M2M04); minutes are
  Year 3.
- **Chance does not exist in the Year 2 curriculum** — it starts at AC9M3P01. It is
  level 5 here and marked Year 3.

Sources checked September 2026: australiancurriculum.edu.au (v9 Mathematics Year 2 and
Year 3, cross-checked against QCAA's Year 2 alignment document), nap.edu.au ("What's in
the tests", "Tailored tests"), education.nsw.gov.au (OC placement test information).

## How the dashboard scores things

A 3PL-style item response model:

```
P(correct | θ, b, c) = c + (1 − c) · logistic(θ − b)
```

- `b` — item difficulty from the level, mapped to −1.8 … +1.8 logits
- `c` — guessing floor, `1 / number of options` (0.25 for four options, 0.20 for the
  five-option OC maths items)
- `θ` — ability, estimated by EAP over a normal reference prior

Percentile is `Φ(θ/σ)`. For the age comparison the reference point shifts by
`(age − 7.5) × growth_per_year`, so the same performance scores higher for a younger
child. A year-level equivalent is read off the same scale.

**The reference distribution is a model, not measured NAPLAN norm data.** `θ = 0` is
defined as the middle of a mid-Year-2 cohort on *this app's* difficulty ladder. The
numbers are meaningful for tracking direction and spread over time; they are not a
substitute for an official scaled score. The three parameters are editable in the
dashboard so they can be calibrated once a real result exists.

EAP estimates shrink toward the prior: simulated at 60 items, a true θ of +2 is recovered
at about +1.72, so at the extremes real ability is slightly *higher* than shown. The ±1
standard error band is drawn on the ability chart. Topics with fewer than 8 answers show
no percentile.

## Server-side storage

`api/progress.js` is a single serverless function over a Redis-compatible REST store.

**Setup** — in the Vercel project, add environment variables and redeploy:

| Variable | Purpose |
|---|---|
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV. Or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for Upstash directly. |
| `LEO_ACCESS_KEY` | A shared secret the pages must send. Strongly recommended — the site is public. Enter it once per device via *Access key* on the dashboard. |

With no store configured the endpoint reports `configured: false` and both pages fall
back to this-device-only storage with a visible indicator, rather than breaking.

**API**

```
GET    /api/progress?profile=leo    -> { ok, configured, state }
POST   /api/progress                -> merge { answers[], sessions[], patch{} }
DELETE /api/progress?profile=leo    -> wipe that profile
```

Merging is by answer id and is idempotent on both sides, so a retried or duplicated push
cannot double-count a session. `xp`, `best` and the streak are recomputed server-side
from the merged answer log rather than trusted from the client. `profile` supports more
than one child; the value is scrubbed to `[a-z0-9_-]`.

## Files

```
api/progress.js           server-side record
api/writing.js            marks a photographed piece of writing
leo/
  index.html              student app
  app.css
  admin/index.html        parent dashboard
  admin.css
  js/
    curriculum.js         Australian Curriculum v9 mapping and the two test specs
    writing.js            the writing tasks
    content-literacy.js   passages, spelling, grammar, punctuation, thinking-skills banks
    visuals.js            every question picture, as inline SVG
    bank.js               generators: number, add/sub, mult/div, fractions, patterns
    bank-measure.js       generators: measurement, geometry, data & chance
    bank-verbal.js        generators: reading, language, thinking skills, maths reasoning
    store.js              server sync plus a local cache and an offline queue
    norms.js              item response model, ability estimation, age percentiles
    engine.js             session construction and the adaptive rule
    charts.js             dashboard charts
    app.js                student controller
    admin.js              dashboard controller
```

## Local development

```
node dev-server.js      # static site + the real API against an in-memory store
# then open http://localhost:8788/leo/
```

`dev-server.js` lives at the repository root. Vercel only executes files under `api/`,
so it is never deployed.

## Smoke test

```
npm install             # playwright
node dev-server.js &    # port 8788
npm run smoke
```

`test/smoke.mjs` drives the real app in Chromium: it sits a 12-question NAPLAN
test answering 9 right and 3 wrong on purpose, checks the score, checks the
difficulty ladder actually climbed, works the fix-up round, drills a set of number
facts through the keypad, submits a piece of
writing both typed and as a photo of the page, and then opens the dashboard in a
**separate browser profile**. That last part matters — a second profile shares no
localStorage, so if the answers, sessions, writing and fact attempts all show up
there, the record genuinely came back from the server.

It asserts 44 things and exits non-zero if any of them fail, so it can gate a
deploy. Screenshots of every step land in `test/screenshots/` (git-ignored).

It runs on its own throwaway profile (`SMOKE_PROFILE`, default `smoke-test`) and
wipes that profile before and after, so runs are independent and it can never
touch Leo's real record — including when `SMOKE_BASE` points at the deployed site.
That isolation is what lets the counts be exact rather than "at least": a
12-question test plus 3 fix-ups must leave exactly 15 answers, 2 sessions, 2
pieces of writing and 20 fact attempts. Without the wipe, a dev-server left running from a previous run
carries its answers over and every count quietly asserts against stale data.

To answer deliberately rather than by guessing, the test reads `LEO.debug`, a
read-only hook in `app.js` that reports the current question's answer index and
which screen is showing. It exposes nothing a child could not read off the screen
a second later by pressing a button.
