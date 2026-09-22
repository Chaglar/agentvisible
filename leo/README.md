# Leo's Test Lab

Two practice tests for a Year 2 student in Australia (NAPLAN and OC), plus a parent
dashboard that reports progress against an age-referenced scale.

Static HTML/CSS/JS. No build step, no framework, no backend. All progress lives in
the browser's `localStorage` and never leaves the device.

- `/leo/` — student page (English, matching the language of the real tests)
- `/leo/admin/` — parent dashboard (Turkish)

## The two modes

**NAPLAN practice** reproduces NAPLAN's *tailored test* behaviour. Questions arrive in
blocks of five; score 4–5 and the next block steps up a difficulty level, score 0–1 and
it steps back down. This is why a hard-feeling paper is a good sign — it is the same
branching the real online test uses. Immediate feedback with a worked explanation after
every question. Domains: number and place value, addition/subtraction,
multiplication/division, fractions, patterns, measurement and time, shape and space,
data and chance, reading, grammar and spelling.

**OC practice** is deliberately *not* adaptive, because the real NSW Opportunity Class
placement test is a fixed hard form for everyone. It sits high on the difficulty ladder
throughout, is timed, and withholds feedback until the end. Domains: thinking skills,
mathematical reasoning, reading, with some maths mixed in.

**Focus drill** — ten questions on one topic, adapting question by question. The home
screen orders these weakest-first.

## Difficulty and topic selection

Every question is generated, not drawn from a fixed list, and carries a difficulty level
1–5 (roughly: 1 = early Year 1, 3 = mid Year 2, 5 = Year 4 stretch). Topic selection is
weighted by how the child is doing: a topic sitting below the 60th percentile is served
more often, and multiplication/division and fractions carry a standing weight boost.

## How the dashboard scores things

A 3PL-style item response model:

```
P(correct | θ, b, c) = c + (1 − c) · logistic(θ − b)
```

- `b` — item difficulty from the level, mapped to −1.8 … +1.8 logits
- `c` — guessing floor, `1 / number of options` (0.25 for a four-option item)
- `θ` — ability, estimated by EAP over a normal cohort prior

Percentile is `Φ(θ/σ)`. For the age comparison the reference point shifts by
`(age − 7.5) × growth_per_year`, so the same performance scores higher for a younger child.
A year-level equivalent is read off the same scale.

**The reference distribution is a model, not measured NAPLAN norm data.** `θ = 0` is
defined as the middle of a mid-Year-2 cohort on *this app's* difficulty ladder. The
numbers are meaningful for tracking direction and spread over time; they are not a
substitute for an official scaled score. The three model parameters are editable in
the dashboard so they can be calibrated once a real result is available.

EAP estimates shrink toward the prior: simulated at 60 items, a true θ of +2 is recovered
at about +1.72, so at the extremes real ability is slightly *higher* than shown. The
±1 standard error band is drawn on the ability chart. Topics with fewer than 8 answers
show no percentile at all.

## Files

```
leo/
  index.html          student app
  app.css             student styles
  admin/index.html    parent dashboard
  admin.css           dashboard styles
  js/
    visuals.js        every question picture, as inline SVG
    bank.js           generators: number, add/sub, mult/div, fractions, patterns
    bank-measure.js   generators: measurement, geometry, data & chance
    bank-verbal.js    generators: reading, language, thinking skills, maths reasoning
    store.js          localStorage persistence, export/import
    norms.js          item response model, ability estimation, age percentiles
    engine.js         session construction and the adaptive rule
    charts.js         dashboard charts
    app.js            student controller
    admin.js          dashboard controller
```

## Data

Nothing is transmitted anywhere. The dashboard exports JSON (a full backup, restorable
on another device) and CSV (one row per answered question: timestamp, mode, topic,
subtopic, level, correct, seconds, number of options).

## Local development

```
python3 -m http.server 8777
# then open http://localhost:8777/leo/
```
