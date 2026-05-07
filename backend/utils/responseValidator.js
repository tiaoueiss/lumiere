/**
 * Check if the AI response looks suspiciously generic/defaulted.
 * Models love to return "Neutral undertone, Oval face, Medium skin" when unsure.
 */
function isGenericResponse(analysis) {
  const flags = [];

  // The "I didn't really look" combo
  if (
    analysis.undertone?.result === 'Neutral' &&
    analysis.faceShape?.shape === 'Oval' &&
    analysis.skinDepth === 'Medium'
  ) {
    flags.push('default_combo');
  }

  // Suspiciously high confidence on everything
  if (analysis.undertone?.confidence > 0.9 && analysis.faceShape?.confidence > 0.9) {
    flags.push('overconfident');
  }

  // Vague indicators (model didn't observe specifics)
  const indicators = analysis.undertone?.indicators || [];
  const vagueWords = ['appears', 'seems', 'general', 'overall', 'typical'];
  const vagueCount = indicators.filter((ind) =>
    vagueWords.some((w) => ind.toLowerCase().includes(w))
  ).length;
  if (vagueCount >= 3) flags.push('vague_indicators');

  // Details are too short or generic
  if ((analysis.undertone?.details || '').length < 50) flags.push('thin_details');

  const scores = analysis.undertone?.scores;
  if (scores) {
    const values = [scores.warm, scores.cool, scores.neutral]
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (values.length === 3) {
      const spread = Math.max(...values) - Math.min(...values);
      if (spread <= 1) flags.push('flat_undertone_scores');
    }
  }

  return { isGeneric: flags.length >= 2, flags };
}

function validateFaceObservations(observations = '') {
  const text = String(observations);
  const noFaceMatch = text.match(/FACE_VALIDATION:\s*NO_FACE/i);
  const faceVisibleMatch = text.match(/FACE_VALIDATION:\s*FACE_VISIBLE/i);
  const reasonMatch = text.match(/REASON:\s*(.+)/i);

  if (noFaceMatch) {
    return {
      hasFace: false,
      reason: reasonMatch?.[1]?.trim() || 'No visible human face was detected.',
    };
  }

  if (faceVisibleMatch) {
    return {
      hasFace: true,
      reason: reasonMatch?.[1]?.trim() || 'A visible human face was detected.',
    };
  }

  return {
    hasFace: null,
    reason: 'The AI did not provide a face validation marker.',
  };
}

/**
 * Parse and validate the classification JSON from Groq.
 * Returns { success, data, error }.
 */
function parseClassification(rawText) {
  const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { success: false, error: 'No JSON found in response' };

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    return { success: false, error: `JSON parse failed: ${e.message}` };
  }

  if (parsed.error === 'insufficient_image_quality') {
    return { success: false, error: parsed.reason || 'Image quality too poor for analysis', isRefusal: true };
  }

  if (parsed.imageValidation?.containsHumanFace === false) {
    return {
      success: false,
      error: parsed.imageValidation.reason || 'No visible human face was detected.',
      isRefusal: true,
    };
  }

  if (!parsed.imageValidation || parsed.imageValidation.containsHumanFace !== true) {
    return {
      success: false,
      error: 'Could not confirm that the image contains a visible human face.',
      isRefusal: true,
    };
  }

  if (!parsed.undertone?.result || !parsed.faceShape?.shape || !parsed.hairColor?.current) {
    return { success: false, error: 'Missing required fields in analysis' };
  }

  if (!parsed.undertone?.scores) {
    return { success: false, error: 'Missing undertone score evidence' };
  }

  const validUndertones = ['Warm', 'Cool', 'Neutral'];
  const validShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong'];
  const validContrastLevels = ['Low', 'Medium', 'High'];

  if (!validUndertones.includes(parsed.undertone.result)) {
    return { success: false, error: `Invalid undertone: ${parsed.undertone.result}` };
  }
  if (!validShapes.includes(parsed.faceShape.shape)) {
    return { success: false, error: `Invalid face shape: ${parsed.faceShape.shape}` };
  }

  if (parsed.contrastLevel && !validContrastLevels.includes(parsed.contrastLevel)) {
    return { success: false, error: `Invalid contrast level: ${parsed.contrastLevel}` };
  }

  const scoreKeys = ['warm', 'cool', 'neutral'];
  for (const key of scoreKeys) {
    const value = Number(parsed.undertone.scores[key]);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      return { success: false, error: `Invalid undertone score for ${key}: ${parsed.undertone.scores[key]}` };
    }
  }

  return { success: true, data: parsed };
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function parsePersonalization(rawText) {
  const clean = String(rawText || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { success: false, error: 'No JSON found in personalization response' };

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (error) {
    return { success: false, error: `Personalization JSON parse failed: ${error.message}` };
  }

  const makeList = (value, max = 4) => (
    Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, max)
      : []
  );

  // Parse color arrays that include hex codes — drop any item with a missing/invalid hex.
  const makeHexColorList = (value, max) => (
    Array.isArray(value)
      ? value
          .map((item) => ({
            hex: String(item?.hex || '').trim(),
            name: String(item?.name || '').trim(),
            category: String(item?.category || '').trim(),
          }))
          .filter((item) => HEX_RE.test(item.hex) && item.name)
          .slice(0, max)
      : []
  );

  const makeHexAvoidList = (value, max) => (
    Array.isArray(value)
      ? value
          .map((item) => ({
            hex: String(item?.hex || '').trim(),
            name: String(item?.name || '').trim(),
            reason: String(item?.reason || '').trim(),
          }))
          .filter((item) => HEX_RE.test(item.hex) && item.name && item.reason)
          .slice(0, max)
      : []
  );

  const data = {
    paletteSummary: String(parsed.paletteSummary || '').trim(),
    palette: makeHexColorList(parsed.palette, 8),
    accentColors: makeHexColorList(parsed.accentColors, 3),
    neutrals: makeHexColorList(parsed.neutrals, 4),
    makeup: parsed.makeup && {
      foundationTips: String(parsed.makeup.foundationTips || '').trim(),
      blush: makeList(parsed.makeup.blush),
      lips: makeList(parsed.makeup.lips),
      eyeshadow: makeList(parsed.makeup.eyeshadow),
    },
    colorsToAvoid: makeHexAvoidList(parsed.colorsToAvoid, 4),
  };

  return { success: true, data };
}

module.exports = { isGenericResponse, parseClassification, parsePersonalization, validateFaceObservations };
