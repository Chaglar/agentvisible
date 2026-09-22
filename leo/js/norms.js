/* norms.js — turning right/wrong logs into an age-referenced picture.
   Model: 3PL-lite item response theory.
     P(correct | ability t, item difficulty b, guess c) = c + (1 - c) * logistic(t - b)
   b comes from the question's level (1..5), c from the number of options (1/4 for a
   4-choice item), and ability is estimated by EAP over a normal cohort prior.

   IMPORTANT, and stated in the UI too: the cohort prior is a MODEL, not measured
   NAPLAN norm data. theta = 0 is defined as "the middle of a mid-Year-2 cohort" and
   the item difficulties are the app's own level ladder. Percentiles are therefore
   relative to this app's scale — good for tracking direction and spread over time,
   not a substitute for an official scaled score. Every parameter is editable. */
(function (root) {
  var L = root.LEO = root.LEO || {};

  var P = {
    bAt: [-1.8, -0.9, 0.0, 0.9, 1.8],  // logit difficulty of levels 1..5
    cohortSD: 1.0,                      // spread of the reference cohort, in logits
    cohortAgeMid: 7.5,                  // mid-year-2 age in years
    growthPerYear: 1.0,                 // ability growth per school year at this age, logits
    minItems: 8                         // below this, report "not enough data yet"
  };

  function logistic(x) { return 1 / (1 + Math.exp(-x)); }
  function pCorrect(theta, b, c) { return c + (1 - c) * logistic(theta - b); }

  // standard normal CDF (Abramowitz & Stegun 7.1.26 via erf approximation)
  function phi(z) {
    var s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2;
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + s * y);
  }

  /* EAP ability estimate over a grid, with a N(mu, sd) cohort prior */
  function ability(records, mu) {
    mu = mu || 0;
    var n = records.length;
    if (!n) return { theta: mu, se: P.cohortSD, n: 0, enough: false };
    var lo = -4, hi = 4, steps = 161, num = 0, den = 0, i, k, g, th, lik, pr, post;
    var posts = [], grid = [];
    for (k = 0; k < steps; k++) {
      th = lo + (hi - lo) * k / (steps - 1);
      lik = 1;
      for (i = 0; i < n; i++) {
        var r = records[i];
        var b = P.bAt[Math.min(4, Math.max(0, (r.lv || 3) - 1))];
        var c = r.nc ? 1 / r.nc : 0.25;
        var p = pCorrect(th, b, c);
        lik *= r.ok ? p : (1 - p);
        if (lik < 1e-300) { lik = 1e-300; }
      }
      pr = Math.exp(-0.5 * Math.pow((th - mu) / P.cohortSD, 2));
      post = lik * pr;
      grid.push(th); posts.push(post);
      num += th * post; den += post;
    }
    if (!den || !isFinite(den)) return { theta: mu, se: P.cohortSD, n: n, enough: false };
    var theta = num / den, varSum = 0;
    for (k = 0; k < steps; k++) varSum += Math.pow(grid[k] - theta, 2) * posts[k];
    var se = Math.sqrt(varSum / den);
    return { theta: theta, se: se, n: n, enough: n >= P.minItems };
  }

  function ageYears(dob, at) {
    if (!dob) return null;
    var d = new Date(dob); if (isNaN(d)) return null;
    return ((at || Date.now()) - d.getTime()) / (365.2425 * 24 * 3600 * 1000);
  }

  var N = {
    params: P,
    logistic: logistic, pCorrect: pCorrect, phi: phi, ability: ability, ageYears: ageYears,

    // percentile against the Year-level cohort (theta scale is anchored there)
    percentile: function (theta) { return Math.max(1, Math.min(99, Math.round(100 * phi(theta / P.cohortSD)))); },

    // percentile against children of the SAME AGE — shifts the reference point if the
    // child is young or old for their year group
    agePercentile: function (theta, age) {
      if (age == null) return null;
      var expected = (age - P.cohortAgeMid) * P.growthPerYear;
      return Math.max(1, Math.min(99, Math.round(100 * phi((theta - expected) / P.cohortSD))));
    },
    expectedFor: function (age) { return age == null ? 0 : (age - P.cohortAgeMid) * P.growthPerYear; },

    // rough "working like a child in year X" reading
    yearEquivalent: function (theta) {
      return Math.round((2.5 + theta / P.growthPerYear) * 10) / 10;
    },

    band: function (pct) {
      if (pct == null) return { key: 'none', tr: 'Veri yok', color: 'var(--mut)' };
      if (pct >= 90) return { key: 'top', tr: 'Üst %10', color: 'var(--good)' };
      if (pct >= 75) return { key: 'strong', tr: 'Güçlü', color: 'var(--good)' };
      if (pct >= 40) return { key: 'ontrack', tr: 'Yaşıtlarıyla aynı seviyede', color: 'var(--acc)' };
      if (pct >= 20) return { key: 'watch', tr: 'Takip edilmeli', color: 'var(--warn)' };
      return { key: 'support', tr: 'Destek gerekiyor', color: 'var(--bad)' };
    },

    // suggested starting level for a fresh session, from what we already know
    suggestLevel: function (records) {
      var a = ability(records);
      if (!a.enough) return 3;
      var lv = 1, best = 0, d;
      for (var i = 0; i < 5; i++) {
        // pick the level where the child is expected to get ~70% right
        d = Math.abs(pCorrect(a.theta, P.bAt[i], 0.25) - 0.72);
        if (i === 0 || d < best) { best = d; lv = i + 1; }
      }
      return lv;
    }
  };
  L.norms = N;
})(window);
