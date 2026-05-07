const Groq = require('groq-sdk');
const {
  OBSERVATION_PROMPT,
  FACE_GEOMETRY_PROMPT,
  COLOR_ANALYSIS_PROMPT,
  STYLE_PERSONALIZATION_PROMPT,
} = require('../prompts/styleAnalysisPrompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Scout: fast, used for observations and personalization (no need for heavy reasoning).
// Maverick: more capable MoE model, used for classification where accuracy matters.
const MODEL_FAST = 'meta-llama/llama-4-scout-17b-16e-instruct';
const MODEL_ACCURATE = 'meta-llama/llama-4-maverick-17b-16e-instruct';

function safeParseJson(text = '') {
  const clean = String(text).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

async function callModel(model, imageBase64, mediaType, promptText, maxTokens, temperature) {
  const response = await groq.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
        { type: 'text', text: promptText },
      ],
    }],
  });
  return response.choices[0].message.content;
}

/**
 * Pass 1 — Raw observations. Fast model is sufficient; this is descriptive, not analytical.
 */
async function getObservations(base64, mediaType) {
  return callModel(MODEL_FAST, base64, mediaType, OBSERVATION_PROMPT, 1500, 0.2);
}

/**
 * Pass 2 — Classification via two focused parallel sub-passes:
 *   2A: Face geometry only  → shape, proportions, features
 *   2B: Color analysis only → undertone, skin depth, hair, contrast
 *
 * Both use the more capable Maverick model and run in parallel to keep latency low.
 * If either sub-pass fails or returns unusable JSON, falls back to single-pass Scout.
 *
 * Returns a JSON string in the same combined schema the controller expects.
 */
async function getClassification(base64, mediaType, observations) {
  const [faceResult, colorResult] = await Promise.allSettled([
    callModel(MODEL_ACCURATE, base64, mediaType, FACE_GEOMETRY_PROMPT(observations), 900, 0.15),
    callModel(MODEL_ACCURATE, base64, mediaType, COLOR_ANALYSIS_PROMPT(observations), 900, 0.15),
  ]);

  const faceJson = faceResult.status === 'fulfilled' ? safeParseJson(faceResult.value) : null;
  const colorJson = colorResult.status === 'fulfilled' ? safeParseJson(colorResult.value) : null;

  // Both passes must succeed and contain the minimum required fields.
  const faceOk = faceJson && faceJson.faceShape?.shape && faceJson.imageValidation;
  const colorOk = colorJson && colorJson.undertone?.result && colorJson.hairColor?.current;

  if (faceOk && colorOk) {
    // Use the face pass imageValidation as the primary (it saw the photo more carefully for geometry).
    const merged = {
      imageValidation: faceJson.imageValidation,
      undertone: colorJson.undertone,
      faceShape: faceJson.faceShape,
      hairColor: colorJson.hairColor,
      skinDepth: colorJson.skinDepth || 'Medium',
      contrastLevel: colorJson.contrastLevel || 'Medium',
      lightingQuality: colorJson.lightingQuality || 'ACCEPTABLE',
    };
    console.log('[groq] dual-pass classification succeeded');
    return JSON.stringify(merged);
  }

  // Partial success: use whichever passed and fill defaults for the other.
  if (faceOk && !colorOk) {
    console.log('[groq] color pass failed — using face result + Scout fallback for color');
    const colorFallbackRaw = await callModel(
      MODEL_FAST, base64, mediaType, COLOR_ANALYSIS_PROMPT(observations), 900, 0.15
    );
    const colorFallback = safeParseJson(colorFallbackRaw);
    if (colorFallback?.undertone?.result) {
      return JSON.stringify({
        imageValidation: faceJson.imageValidation,
        undertone: colorFallback.undertone,
        faceShape: faceJson.faceShape,
        hairColor: colorFallback.hairColor,
        skinDepth: colorFallback.skinDepth || 'Medium',
        contrastLevel: colorFallback.contrastLevel || 'Medium',
        lightingQuality: colorFallback.lightingQuality || 'ACCEPTABLE',
      });
    }
  }

  if (colorOk && !faceOk) {
    console.log('[groq] face pass failed — using color result + Scout fallback for face');
    const faceFallbackRaw = await callModel(
      MODEL_FAST, base64, mediaType, FACE_GEOMETRY_PROMPT(observations), 900, 0.15
    );
    const faceFallback = safeParseJson(faceFallbackRaw);
    if (faceFallback?.faceShape?.shape) {
      return JSON.stringify({
        imageValidation: colorJson.imageValidation,
        undertone: colorJson.undertone,
        faceShape: faceFallback.faceShape,
        hairColor: colorJson.hairColor,
        skinDepth: colorJson.skinDepth || 'Medium',
        contrastLevel: colorJson.contrastLevel || 'Medium',
        lightingQuality: colorJson.lightingQuality || 'ACCEPTABLE',
      });
    }
  }

  // Both failed — fall back to single combined call with Scout.
  console.log('[groq] dual-pass both failed — falling back to single-pass Scout');
  return callModel(
    MODEL_FAST, base64, mediaType,
    `${COLOR_ANALYSIS_PROMPT(observations)}\n\nALSO include faceShape in your JSON with shape, confidence, and features (foreheadWidth Wide|Medium|Narrow, cheekboneWidth, jawlineAngle, faceLengthRatio, chinShape).`,
    1500, 0.15
  );
}

async function getStylePersonalization(context) {
  const response = await groq.chat.completions.create({
    model: MODEL_FAST,
    max_tokens: 1400,
    temperature: 0.7,
    messages: [{
      role: 'user',
      content: STYLE_PERSONALIZATION_PROMPT(context),
    }],
  });
  return response.choices[0].message.content;
}

module.exports = { getObservations, getClassification, getStylePersonalization };
