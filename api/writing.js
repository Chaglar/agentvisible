/* api/writing.js — marks a piece of Leo's writing.
 *
 * He photographs what he wrote on paper and this returns structured feedback:
 * what he actually wrote, which words are misspelled, how the letters are formed,
 * what he did well, and the two things worth fixing next. Typed text works too,
 * for when there is no paper to hand.
 *
 * Why a photo rather than typing. His assessments put alphabet writing fluency at
 * the 47th percentile, down from the 98th, and that is the skill that needs work —
 * forming letters, spacing words, keeping to the line. A keyboard measures none of
 * it. The real Year 3 NAPLAN writing test is handwritten on paper, so paper is also
 * the honest medium.
 *
 * Privacy: the image is held in memory for the length of the request and is never
 * written to storage. Only the derived assessment is returned, and only that is
 * kept in the progress record.
 *
 * Configure in the Vercel project:
 *     ANTHROPIC_API_KEY   required, or this endpoint reports configured:false
 *     LEO_ACCESS_KEY      the same shared secret the rest of the app uses
 */

const Anthropic = require('@anthropic-ai/sdk');

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;      // ~6 MB of decoded image
const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['legible', 'transcription', 'word_count', 'sentence_count', 'spelling',
             'letter_formation', 'punctuation', 'strengths', 'fix_next', 'to_leo', 'scores'],
  properties: {
    legible: { type: 'boolean', description: 'false only if the writing genuinely cannot be read' },
    transcription: { type: 'string', description: 'Exactly what is written, errors and all. Never corrected.' },
    word_count: { type: 'integer' },
    sentence_count: { type: 'integer' },
    spelling: {
      type: 'array', maxItems: 10,
      description: 'Only real misspellings. An empty array is a valid and good answer.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['written', 'correct', 'hint'],
        properties: {
          written: { type: 'string' },
          correct: { type: 'string' },
          hint: { type: 'string', description: 'One short line a child can use, naming the tricky part' }
        }
      }
    },
    letter_formation: {
      type: 'array', maxItems: 5,
      description: 'Only what is visible in the image: reversals, size, spacing, sitting on the line, joins. Empty for typed work.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['issue', 'letters', 'note'],
        properties: {
          issue: { type: 'string', enum: ['reversal', 'size', 'spacing', 'baseline', 'formation', 'pressure'] },
          letters: { type: 'string', description: 'Which letters or words, quoted from the page' },
          note: { type: 'string' }
        }
      }
    },
    punctuation: {
      type: 'array', maxItems: 6,
      items: {
        type: 'object', additionalProperties: false,
        required: ['issue', 'example'],
        properties: { issue: { type: 'string' }, example: { type: 'string' } }
      }
    },
    strengths: {
      type: 'array', minItems: 1, maxItems: 3,
      description: 'Specific and true. Quote from his writing. Never generic praise.',
      items: { type: 'string' }
    },
    fix_next: {
      type: 'array', minItems: 1, maxItems: 2,
      description: 'Exactly the highest-leverage things. Two at most, never more.',
      items: {
        type: 'object', additionalProperties: false,
        required: ['what', 'how', 'example'],
        properties: {
          what: { type: 'string' },
          how: { type: 'string', description: 'A concrete action, not a principle' },
          example: { type: 'string', description: 'Rewritten from his own words, showing the fix' }
        }
      }
    },
    to_leo: { type: 'string', description: 'Two or three short sentences addressed to Leo, aged 8. Warm, specific, no baby talk.' },
    scores: {
      type: 'object', additionalProperties: false,
      required: ['handwriting', 'spelling', 'punctuation', 'ideas', 'structure'],
      properties: {
        handwriting: { type: 'integer', minimum: 1, maximum: 5 },
        spelling: { type: 'integer', minimum: 1, maximum: 5 },
        punctuation: { type: 'integer', minimum: 1, maximum: 5 },
        ideas: { type: 'integer', minimum: 1, maximum: 5 },
        structure: { type: 'integer', minimum: 1, maximum: 5 }
      }
    }
  }
};

const SYSTEM = `You mark the writing of one child, Leo, aged 8, in Year 2 in Australia.

What you are told about him, from formal assessment, because it changes what is worth saying:
- Visual-spatial reasoning at the 98th percentile. He thinks in pictures.
- Auditory working memory at the 25th percentile. Long verbal instructions are lost on him.
- Processing speed at the 6th percentile. He is slow on paper, and that is not effort or attitude.
- Reading at the 88th percentile. His ideas run well ahead of his handwriting.
- Alphabet writing fluency fell from the 98th percentile at four to the 47th at six. Handwriting and spelling are the real work; ideas are not the problem.

How to mark:
1. Transcribe exactly what is on the page, including every misspelling and missing full stop. Never silently correct. If a word is genuinely unreadable, write [?].
2. Judge handwriting only from what you can actually see: letter reversals (b/d, p/q, s, 5, 9 are the usual ones), letters sitting above or below the line, letter size drifting, words running together, ragged spacing. Do not guess at what is not visible. For typed work, return an empty letter_formation array.
3. Report only real errors. If the spelling is clean, return an empty array and say so. Inventing errors to look thorough is a failure.
4. Praise must be specific and quoted from his writing. "Great job" is worthless to him. "You used 'enormous' instead of 'big'" is not.
5. fix_next must contain AT MOST TWO items, and they must be the two that would improve the next piece the most. A child with a writing aversion given a list of nine corrections writes less next time, not more. Choose.
6. Write to_leo directly to him. Two or three short sentences. Warm, specific, honest. He is 8 and bright; do not talk down to him, and do not pretend something was good when it was not.
7. Scores are 1-5 against what is typical for a Year 2 Australian child, where 3 is on track for his year. Handwriting is legibility and control, not neatness of the paper.

Australian spelling throughout (colour, realise, favourite).`;

function client() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? new Anthropic({ apiKey: key }) : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, reason: 'Method not allowed' });
  }

  const anthropic = client();
  if (!anthropic) {
    return res.status(200).json({
      ok: false, configured: false,
      reason: 'Writing feedback is not set up. Add ANTHROPIC_API_KEY to the Vercel project and redeploy.'
    });
  }

  const required = process.env.LEO_ACCESS_KEY || '';
  if (required && (req.headers['x-leo-key'] || '') !== required) {
    return res.status(401).json({ ok: false, configured: true, reason: 'Wrong or missing access key.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // the task prompts carry <b> and <br> for the screen; strip the markup and tidy
  // the whitespace so the model reads a clean sentence
  const task = String(body.taskPrompt || '').slice(0, 2000)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const kind = String(body.kind || 'short').slice(0, 20);
  const minutes = Number(body.minutes) || null;
  const typed = typeof body.typed === 'string' ? body.typed.slice(0, 8000) : '';

  const content = [];

  if (body.image) {
    const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(body.image));
    if (!m) return res.status(400).json({ ok: false, configured: true, reason: 'The photo could not be read. Try taking it again.' });
    const mediaType = m[1].toLowerCase();
    if (ALLOWED_MEDIA.indexOf(mediaType) < 0) {
      return res.status(400).json({ ok: false, configured: true, reason: 'That image format is not supported. Use a JPEG or PNG.' });
    }
    const data = m[2];
    if (data.length * 0.75 > MAX_IMAGE_BYTES) {
      return res.status(413).json({ ok: false, configured: true, reason: 'That photo is too large. Take it again a little further back.' });
    }
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: data } });
  } else if (!typed) {
    return res.status(400).json({ ok: false, configured: true, reason: 'Send either a photo or some typed text.' });
  }

  content.push({
    type: 'text',
    text: [
      'The task Leo was given:',
      task || '(not recorded)',
      minutes ? `He was given about ${minutes} minutes.` : '',
      `Task type: ${kind}.`,
      '',
      body.image
        ? 'His writing is in the photograph. Transcribe it and mark it.'
        : 'He typed this rather than writing it by hand, so judge nothing about letter formation:\n\n' + typed
    ].filter(Boolean).join('\n')
  });

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: content }]
    });

    if (response.stop_reason === 'refusal') {
      return res.status(200).json({
        ok: false, configured: true,
        reason: 'The assistant declined to assess this image. If it is a photo of school work, try a clearer, closer photo.'
      });
    }

    const text = (response.content || [])
      .filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; }).join('');

    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) {
      return res.status(502).json({ ok: false, configured: true, reason: 'The assessment came back in an unexpected shape. Try again.' });
    }

    return res.status(200).json({
      ok: true, configured: true,
      assessment: parsed,
      usage: response.usage ? {
        input: response.usage.input_tokens, output: response.usage.output_tokens
      } : null
    });
  } catch (e) {
    const status = e && e.status ? e.status : 502;
    return res.status(status === 401 ? 500 : 502).json({
      ok: false, configured: true,
      reason: status === 401
        ? 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in the Vercel project.'
        : 'Could not reach the assessment service: ' + (e && e.message ? e.message : 'unknown error')
    });
  }
};
