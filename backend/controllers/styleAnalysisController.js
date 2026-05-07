const { preprocessImage } = require('../services/imageProcessor');
const { getObservations, getClassification, getStylePersonalization } = require('../services/groqClient');
const {
  parseClassification,
  parsePersonalization,
  isGenericResponse,
  validateFaceObservations,
} = require('../utils/responseValidator');
const { UNDERTONE_INFO, FACE_SHAPE_RECS, SUBTYPE_PALETTES, DEPTH_MAKEUP } = require('../data/styleRecommendations');

// this is the ai analyzer end point, 
// so we can be more aggressive with retries and fallback logic to ensure a good 
// user experience even if the ai is being difficult.

const MAX_RETRIES = 2;

const DEEP_SKIN_DEPTHS = new Set(['Medium-Deep', 'Deep', 'Very Deep']);
const LIGHT_SKIN_DEPTHS = new Set(['Fair', 'Light']);
const DARK_HAIR_CATEGORIES = new Set(['Black', 'Dark Brown', 'Auburn']);
const LIGHT_HAIR_CATEGORIES = new Set(['Light Blonde', 'Dark Blonde', 'Light Brown', 'Grey']);
const STRONG_COLOR_CATEGORIES = new Set(['Statement', 'Jewel tone', 'Warm accent']);
const SOFT_COLOR_CATEGORIES = new Set(['Warm neutral', 'Cool neutral', 'Earth tone']);
const VEIN_REFERENCE_PATTERN = /\bvein(s)?\b/i;

function getLuminance(hex = '#888888') {
  if (typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function areVeinsClearlyVisible(observations = '') {
  const text = String(observations || '').toLowerCase();

  if (!text.includes('vein')) {
    return false;
  }

  const hiddenPatterns = [
    /veins?\s+(are\s+)?not\s+visible/,
    /no\s+visible\s+veins?/,
    /unable\s+to\s+see\s+veins?/,
    /cannot\s+see\s+veins?/,
    /can'?t\s+see\s+veins?/,
    /veins?\s+(are\s+)?not\s+clearly\s+visible/,
  ];

  if (hiddenPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  const visiblePatterns = [
    /visible\s+veins?/,
    /veins?\s+appear/,
    /veins?\s+look/,
    /green\s+veins?/,
    /blue\/purple\s+veins?/,
    /blue\s+veins?/,
    /purple\s+veins?/,
    /mixed\s+veins?/,
  ];

  return visiblePatterns.some((pattern) => pattern.test(text));
}

function stripVeinSentences(text = '') {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence && !VEIN_REFERENCE_PATTERN.test(sentence))
    .join(' ')
    .trim();
}

function sanitizeUndertoneEvidence(undertone = {}, observations = '') {
  if (areVeinsClearlyVisible(observations)) {
    return undertone;
  }

  const cleanedDetails = stripVeinSentences(undertone.details);
  const cleanedIndicators = (undertone.indicators || []).filter(
    (indicator) => !VEIN_REFERENCE_PATTERN.test(String(indicator || ''))
  );

  return {
    ...undertone,
    details: cleanedDetails || undertone.details,
    indicators: cleanedIndicators.length ? cleanedIndicators : undertone.indicators,
  };
}

function getDepthGroup(skinDepth = 'Medium') {
  if (LIGHT_SKIN_DEPTHS.has(skinDepth)) return 'light';
  if (DEEP_SKIN_DEPTHS.has(skinDepth)) return 'deep';
  return 'medium';
}

function getUndertoneMagnitude(undertone = {}) {
  const scores = undertone.scores || {};
  const values = [Number(scores.warm) || 0, Number(scores.cool) || 0, Number(scores.neutral) || 0]
    .sort((a, b) => b - a);
  const spread = values[0] - values[1];
  if (spread >= 4) return 'strong';
  if (spread >= 2) return 'moderate';
  return 'soft';
}

function scoreColorForProfile(color, profile) {
  const luminance = getLuminance(color.hex);
  let score = 0;

  if (profile.depthGroup === 'light') {
    score += luminance;
  } else if (profile.depthGroup === 'deep') {
    score += 1 - luminance;
  } else {
    score += 1 - Math.abs(luminance - 0.52);
  }

  if (profile.contrastLevel === 'High') {
    if (STRONG_COLOR_CATEGORIES.has(color.category)) score += 0.22;
    if (luminance < 0.45) score += 0.08;
  } else if (profile.contrastLevel === 'Low') {
    if (SOFT_COLOR_CATEGORIES.has(color.category)) score += 0.18;
    if (STRONG_COLOR_CATEGORIES.has(color.category)) score -= 0.08;
    if (luminance > 0.48 && luminance < 0.75) score += 0.08;
  } else {
    if (color.category?.includes('neutral')) score += 0.08;
  }

  if (profile.subtype.includes('Spring') && luminance > 0.5) score += 0.1;
  if (profile.subtype.includes('Summer') && luminance > 0.58) score += 0.1;
  if (profile.subtype.includes('Autumn') && luminance < 0.58) score += 0.1;
  if (profile.subtype.includes('Winter') && luminance < 0.45) score += 0.1;

  // Strong undertone magnitude → reward undertone-specific saturated colors.
  // Soft magnitude (borderline) → reward neutrals that blend more easily.
  if (profile.undertoneMagnitude === 'strong') {
    if (STRONG_COLOR_CATEGORIES.has(color.category)) score += 0.12;
  } else if (profile.undertoneMagnitude === 'soft') {
    if (SOFT_COLOR_CATEGORIES.has(color.category)) score += 0.1;
    if (color.category?.includes('neutral')) score += 0.08;
  }

  return score;
}

function pickProfileColors(colors = [], profile, max) {
  return [...colors]
    .sort((a, b) => scoreColorForProfile(b, profile) - scoreColorForProfile(a, profile))
    .slice(0, max);
}

function scoreHairShadeForProfile(shade, profile, currentCategory) {
  const luminance = getLuminance(shade.hex);
  let score = 0;

  if (profile.depthGroup === 'light') {
    score += luminance;
  } else if (profile.depthGroup === 'deep') {
    score += 1 - luminance;
  } else {
    score += 1 - Math.abs(luminance - 0.45);
  }

  if (profile.contrastLevel === 'High' && luminance < 0.42) score += 0.16;
  if (profile.contrastLevel === 'Low' && luminance > 0.52) score += 0.14;
  if (shade.name?.toLowerCase().includes(String(currentCategory || '').toLowerCase())) score += 0.06;

  return score;
}

function pickHairSuggestions(hair = {}, profile, currentCategory) {
  const recommended = [...(hair.recommended || [])]
    .sort((a, b) => scoreHairShadeForProfile(b, profile, currentCategory) - scoreHairShadeForProfile(a, profile, currentCategory))
    .slice(0, 4);

  const avoid = [...(hair.avoid || [])]
    .sort((a, b) => scoreHairShadeForProfile(a, profile, currentCategory) - scoreHairShadeForProfile(b, profile, currentCategory))
    .slice(0, 3);

  return {
    recommended,
    avoid,
  };
}

function buildDepthNote(skinDepth = 'Medium') {
  const notes = {
    Fair: 'Because your skin depth reads fair, lighter and cleaner versions of your palette tend to look fresher than very heavy saturation.',
    Light: 'Because your skin depth reads light, fresh mid-light shades usually stay more flattering than very dense dark colors near the face.',
    'Light-Medium': 'Because your skin depth sits around light-medium, you can balance softness with a little richness without needing extreme contrast.',
    Medium: 'Because your skin depth reads medium, you have room for both supportive neutrals and a few stronger accents.',
    'Medium-Deep': 'Because your skin depth reads medium-deep, richer tones and deeper neutrals usually give you more presence than washed-out pastels.',
    Deep: 'Because your skin depth reads deep, saturated color and deeper grounding shades tend to look more intentional than pale dusty tones.',
    'Very Deep': 'Because your skin depth reads very deep, strong saturation and rich depth usually keep the palette feeling alive against your complexion.',
  };

  return notes[skinDepth] || notes.Medium;
}

function buildContrastNote(contrastLevel = 'Medium') {
  if (contrastLevel === 'High') {
    return 'Your natural contrast can support sharper pairings and clearer depth differences.';
  }
  if (contrastLevel === 'Low') {
    return 'Your natural contrast looks best with smoother tonal transitions and softer jumps between pieces.';
  }
  return 'Your medium contrast gives you flexibility between soft tonal looks and one stronger focal shade.';
}

function buildMetalReason(baseReason, profile) {
  const depthSentence = profile.depthGroup === 'deep'
    ? 'Richer finishes and a bit more depth in the metal usually feel especially polished on you.'
    : profile.depthGroup === 'light'
      ? 'Lighter, cleaner finishes usually stay fresher and more balanced on you.'
      : 'Balanced finishes usually look more natural than extremes that are too icy or too yellow.';
  const contrastSentence = profile.contrastLevel === 'High'
    ? 'You can also handle slightly bolder contrast in jewelry styling.'
    : profile.contrastLevel === 'Low'
      ? 'Softer, smoother metal styling usually feels more harmonious than very sharp contrast.'
      : 'A moderate amount of shine and contrast tends to be the sweet spot.';

  return `${baseReason} ${depthSentence} ${contrastSentence}`.trim();
}

function normalizeUndertone(undertone = {}, lightingQuality = 'UNKNOWN') {
  const scores = undertone.scores || {};
  const warm = Number(scores.warm) || 0;
  const cool = Number(scores.cool) || 0;
  const neutral = Number(scores.neutral) || 0;
  const sorted = [
    { label: 'Warm', value: warm },
    { label: 'Cool', value: cool },
    { label: 'Neutral', value: neutral },
  ].sort((a, b) => b.value - a.value);

  const top = sorted[0];
  const second = sorted[1];
  const spread = top.value - second.value;
  const confidence = Number(undertone.confidence) || 0;
  const lowConfidenceLighting = lightingQuality !== 'GOOD';

  // Keep true Neutral available, but do not let it swallow every slightly uncertain result.
  if (top.label === 'Neutral') {
    if (top.value >= 6 && spread >= 0.75) {
      return 'Neutral';
    }

    if (second.label !== 'Neutral' && second.value >= 6 && top.value - second.value <= 0.5) {
      return second.label;
    }

    return 'Neutral';
  }

  // Strong non-neutral evidence should stay non-neutral even if confidence is not perfect.
  if (top.value >= 7 && spread >= 1) {
    return top.label;
  }

  if (top.value >= 6 && spread >= 1.5) {
    return top.label;
  }

  // Only collapse to Neutral when the evidence is genuinely muddled.
  if (top.value < 5.5 && neutral >= top.value - 0.25) {
    return 'Neutral';
  }

  if (confidence < 0.55 && spread < 1.25 && neutral >= second.value) {
    return 'Neutral';
  }

  if (top.label === 'Warm' && lowConfidenceLighting && spread < 1 && neutral >= top.value - 0.5) {
    return 'Neutral';
  }

  return top.label;
}

function derivePersonalSubtype(undertoneResult, skinDepth, hairCategory, contrastLevel) {
  const isLight = LIGHT_SKIN_DEPTHS.has(skinDepth);
  const isDeep = DEEP_SKIN_DEPTHS.has(skinDepth);
  const darkHair = DARK_HAIR_CATEGORIES.has(hairCategory);
  const lightHair = LIGHT_HAIR_CATEGORIES.has(hairCategory);

  if (undertoneResult === 'Warm') {
    if (isLight || (contrastLevel === 'Low' && lightHair)) {
      return { season: 'Spring', subtype: 'Light Spring' };
    }
    if (isDeep || contrastLevel === 'High' || darkHair) {
      return { season: 'Fall', subtype: 'Deep Autumn' };
    }
    return { season: 'Fall', subtype: 'Warm Autumn' };
  }

  if (undertoneResult === 'Cool') {
    if (isLight || (contrastLevel === 'Low' && lightHair)) {
      return { season: 'Summer', subtype: 'Light Summer' };
    }
    if (isDeep || contrastLevel === 'High' || darkHair) {
      return { season: 'Winter', subtype: 'Deep Winter' };
    }
    if (contrastLevel === 'Low') {
      return { season: 'Summer', subtype: 'Cool Summer' };
    }
    return { season: 'Winter', subtype: 'Cool Winter' };
  }

  if (isDeep || contrastLevel === 'High') {
    return { season: 'Winter', subtype: 'Deep Neutral' };
  }
  if (contrastLevel === 'Low' || isLight || lightHair) {
    return { season: 'Summer', subtype: 'Soft Summer' };
  }
  return { season: 'Spring', subtype: 'Soft Spring' };
}

function buildPersonalizedInfo(baseInfo, analysis) {
  const undertoneResult = normalizeUndertone(analysis.undertone, analysis.lightingQuality);
  const seasonProfile = derivePersonalSubtype(
    undertoneResult,
    analysis.skinDepth || 'Medium',
    analysis.hairColor?.category || 'Other',
    analysis.contrastLevel || 'Medium'
  );
  const depthGroup = getDepthGroup(analysis.skinDepth);
  const profile = {
    subtype: seasonProfile.subtype,
    contrastLevel: analysis.contrastLevel || 'Medium',
    depthGroup,
    undertoneMagnitude: getUndertoneMagnitude(analysis.undertone),
  };

  // Per-subtype palette — gives genuinely different colors per subtype instead of
  // reordering the same 12 undertone colors for everyone.
  const subtypeOverride = SUBTYPE_PALETTES[seasonProfile.subtype];
  const paletteSource = subtypeOverride || baseInfo;

  // Depth-aware makeup — Fair and Deep skin get distinct shades, not the same list.
  const depthMakeup = DEPTH_MAKEUP[depthGroup]?.[undertoneResult];
  const blendedMakeup = depthMakeup
    ? { ...baseInfo.makeup, blush: depthMakeup.blush, lips: depthMakeup.lips, eyeshadow: depthMakeup.eyeshadow }
    : baseInfo.makeup;

  const summaryBySubtype = {
    'Light Spring': 'Your coloring reads lighter and clearer within the warm family, so fresh peach, light camel, soft coral, and creamy warm neutrals will usually feel more lively than heavier autumn shades.',
    'Warm Autumn': baseInfo.paletteSummary,
    'Deep Autumn': 'Your coloring can handle richer warmth and more depth, so espresso, olive, burgundy, rust, and deep camel will usually feel more powerful than pale warm shades.',
    'Light Summer': 'Your cool coloring reads lighter and softer, so airy blues, rose, lavender, cool beige, and softened neutrals will usually flatter more than very dramatic winter contrast.',
    'Cool Summer': 'Your coloring is cool but softer than a full winter palette, so dusty rose, slate blue, berry, soft navy, and cool taupe create a more natural harmony.',
    'Cool Winter': baseInfo.paletteSummary,
    'Deep Winter': 'Your coloring can take sharper contrast and depth, so black, midnight, deep teal, crimson, and icy accents will usually feel stronger than muted cool shades.',
    'Soft Spring': baseInfo.paletteSummary,
    'Soft Summer': 'Your neutral coloring leans softer and calmer, so muted rose, sage, dusty blue, mushroom, and balanced cool-warm neutrals will feel especially easy to wear.',
    'Deep Neutral': 'Your balanced coloring can support more depth than stark contrast, so rich taupe, muted berry, deep teal, cocoa, and polished mixed neutrals tend to feel especially flattering.',
  };

  const hairSuggestions = pickHairSuggestions(
    baseInfo.hair,
    profile,
    analysis.hairColor?.category || 'Other'
  );

  return {
    ...baseInfo,
    season: seasonProfile.season,
    subtype: seasonProfile.subtype,
    // Use subtype-specific palette pool when available so Light Spring and Deep Autumn
    // draw from genuinely different color sets rather than reordering the same 12.
    palette: pickProfileColors(paletteSource.palette, profile, 8),
    accents: pickProfileColors(paletteSource.accents, profile, 3),
    neutrals: pickProfileColors(paletteSource.neutrals, profile, 4),
    // Subtype colorsToAvoid are already curated; fall back to scored base when not defined.
    colorsToAvoid: subtypeOverride?.colorsToAvoid
      ? subtypeOverride.colorsToAvoid.slice(0, 4)
      : pickProfileColors(baseInfo.colorsToAvoid, {
          ...profile,
          depthGroup: profile.depthGroup === 'light' ? 'deep' : profile.depthGroup === 'deep' ? 'light' : 'medium',
        }, 4),
    paletteSummary: `${summaryBySubtype[seasonProfile.subtype] || baseInfo.paletteSummary} ${buildDepthNote(analysis.skinDepth)} ${buildContrastNote(analysis.contrastLevel)}`.trim(),
    metalReason: buildMetalReason(baseInfo.metalReason, profile),
    hair: {
      ...baseInfo.hair,
      recommended: hairSuggestions.recommended,
      avoid: hairSuggestions.avoid,
      seasonal: `${baseInfo.hair.seasonal} ${buildDepthNote(analysis.skinDepth)}`.trim(),
    },
    makeup: {
      ...blendedMakeup,
      foundationTips: `${baseInfo.makeup.foundationTips} ${buildDepthNote(analysis.skinDepth)}`.trim(),
    },
  };
}

const AI_HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function buildStylingPromptContext({ analysis, undertoneResult, info, observations }) {
  return {
    undertone: undertoneResult,
    season: info.season,
    subtype: info.subtype,
    skinDepth: analysis.skinDepth || 'Medium',
    contrastLevel: analysis.contrastLevel || 'Medium',
    lightingQuality: analysis.lightingQuality || 'UNKNOWN',
    skinHex: info.skinSample || null,
    currentHair: analysis.hairColor?.current || null,
    hairCategory: analysis.hairColor?.category || 'Other',
    undertoneScores: analysis.undertone?.scores || null,
    indicators: analysis.undertone?.indicators || [],
    undertoneDetails: analysis.undertone?.details || '',
    observations: String(observations || '').slice(0, 900),
  };
}

function isValidHexColor(item) {
  return item && AI_HEX_RE.test(String(item.hex || '')) && String(item.name || '').trim().length > 0;
}

function mergeStylingContent(info, generated = {}) {
  // Use AI palette only when it has enough valid hex-coded colors.
  // Threshold intentionally lower than max so partial AI output still beats hardcoded.
  const aiPalette = (generated.palette || []).filter(isValidHexColor);
  const aiAccents = (generated.accentColors || []).filter(isValidHexColor);
  const aiNeutrals = (generated.neutrals || []).filter(isValidHexColor);
  const aiAvoid = (generated.colorsToAvoid || []).filter(
    (c) => isValidHexColor(c) && String(c.reason || '').trim().length > 0
  );

  return {
    makeup: generated.makeup?.foundationTips ? generated.makeup : info.makeup,
    paletteSummary: generated.paletteSummary || info.paletteSummary,
    // Fall back to curated data when AI output is too sparse or invalid.
    palette: aiPalette.length >= 6 ? aiPalette.slice(0, 8) : null,
    accents: aiAccents.length >= 2 ? aiAccents.slice(0, 3) : null,
    neutrals: aiNeutrals.length >= 3 ? aiNeutrals.slice(0, 4) : null,
    colorsToAvoid: aiAvoid.length >= 3 ? aiAvoid.slice(0, 4) : info.colorsToAvoid,
  };
}

// give it the photo, it will return the style analysis or an error with suggestions on how to improve the photo for better results.
async function styleAnalysisHandler(req, res) {
  try {
    console.log('[style-analysis] Request received');

    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image provided. Please send a base64-encoded image.' });
    }

    const match = image.match(/^data:(image\/(jpeg|png|webp|gif));base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format. Please send a JPEG, PNG, or WebP image.' });
    }

    const rawMediaType = match[1];
    const rawBase64 = match[3];

    // Step 1: Preprocess image
    console.log('[style-analysis] Preprocessing image...');
    const processed = await preprocessImage(rawBase64, rawMediaType);

    if (processed.qualityFlags.includes('very_dark') && processed.qualityFlags.includes('low_contrast')) {
      return res.status(400).json({
        error: 'The photo is too dark for accurate analysis. Please retake in better lighting.',
        qualityFlags: processed.qualityFlags,
      });
    }

    // Step 2: Pass 1 — Raw observations
    console.log('[style-analysis] Pass 1: Observing...');
    const observations = await getObservations(processed.base64, processed.mediaType);
    console.log('[style-analysis] Observations:', observations.slice(0, 200));

    const faceCheck = validateFaceObservations(observations);
    if (faceCheck.hasFace === false) {
      return res.status(400).json({
        error: 'No visible human face detected. Please upload a clear selfie with your face visible.',
        reason: faceCheck.reason,
        suggestion: 'Use a front-facing, well-lit selfie. Avoid object photos, product photos, covered faces, or heavily cropped images.',
      });
    }

    // Step 3: Pass 2 — Classification with retry
    let analysis = null;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[style-analysis] Pass 2: Classifying (attempt ${attempt + 1})...`);

      const rawClassification = await getClassification(processed.base64, processed.mediaType, observations);
      console.log('[style-analysis] Classification:', rawClassification.slice(0, 200));

      const parsed = parseClassification(rawClassification);

      if (!parsed.success) {
        if (parsed.isRefusal) {
          return res.status(400).json({
            error: parsed.error,
            suggestion: 'Please try again with a well-lit selfie, facing the camera directly.',
          });
        }
        lastError = parsed.error;
        console.log(`[style-analysis] Parse failed (attempt ${attempt + 1}): ${parsed.error}`);
        continue;
      }

      const genericCheck = isGenericResponse(parsed.data);
      if (genericCheck.isGeneric && attempt < MAX_RETRIES) {
        console.log(`[style-analysis] Generic response detected (${genericCheck.flags.join(', ')}), retrying...`);
        lastError = `Generic response: ${genericCheck.flags.join(', ')}`;
        continue;
      }

      if (genericCheck.isGeneric) {
        parsed.data._lowConfidence = true;
        parsed.data._flags = genericCheck.flags;
      }

      analysis = parsed.data;
      break;
    }

    if (!analysis) {
      return res.status(500).json({
        error: `AI analysis failed after ${MAX_RETRIES + 1} attempts: ${lastError}. Please try a different photo.`,
      });
    }

    // Step 4: Enrich with curated recommendations
    const cleanedUndertone = sanitizeUndertoneEvidence(analysis.undertone, observations);
    const { faceShape, hairColor, skinDepth } = analysis;
    const normalizedUndertone = normalizeUndertone(cleanedUndertone, analysis.lightingQuality);
    const baseInfo = UNDERTONE_INFO[normalizedUndertone] || UNDERTONE_INFO.Neutral;
    const info = buildPersonalizedInfo(baseInfo, {
      ...analysis,
      undertone: {
        ...cleanedUndertone,
        result: normalizedUndertone,
      },
    });
    const shapeRecs = FACE_SHAPE_RECS[faceShape.shape] || FACE_SHAPE_RECS.Oval;
    let stylingContent = mergeStylingContent(info);

    try {
      const rawPersonalization = await getStylePersonalization(
        buildStylingPromptContext({
          analysis: {
            ...analysis,
            undertone: {
              ...cleanedUndertone,
              result: normalizedUndertone,
            },
          },
          undertoneResult: normalizedUndertone,
          info,
          observations,
        })
      );
      const personalization = parsePersonalization(rawPersonalization);
      if (personalization.success) {
        stylingContent = mergeStylingContent(info, personalization.data);
      } else {
        console.log('[style-analysis] Personalization parse failed:', personalization.error);
      }
    } catch (personalizationError) {
      console.log('[style-analysis] Personalization generation failed:', personalizationError.message || personalizationError);
    }

    return res.json({
      undertone: {
        result: normalizedUndertone,
        confidence: cleanedUndertone.confidence,
        hex_sample: info.skinSample,
        details: cleanedUndertone.details,
        indicators: cleanedUndertone.indicators,
        scores: cleanedUndertone.scores,
        season: info.season,
        subtype: info.subtype,
        skinDepth: skinDepth || 'Medium',
        contrastLevel: analysis.contrastLevel || 'Medium',
        makeup: stylingContent.makeup,
        colorsToAvoid: stylingContent.colorsToAvoid,
      },
      faceShape: {
        shape: faceShape.shape,
        confidence: faceShape.confidence,
        features: faceShape.features,
        recommendations: shapeRecs,
      },
      jewelryMetal: {
        best: info.metal,
        bestHex: info.metalHex,
        alternatives: info.metalAlts,
        reasoning: info.metalReason,
      },
      outfitColors: {
        season: info.season,
        subtype: info.subtype,
        bestColors: stylingContent.palette || info.palette,
        accentColors: stylingContent.accents || info.accents,
        neutrals: stylingContent.neutrals || info.neutrals,
        colorsToAvoid: stylingContent.colorsToAvoid,
        metalRecommendation: info.metal.toLowerCase(),
        summary: stylingContent.paletteSummary,
      },
      hairColor: {
        currentHair: hairColor.current,
        category: hairColor.category,
        recommended: info.hair.recommended,
        avoid: info.hair.avoid,
        seasonalNotes: info.hair.seasonal,
      },
      skinDepth: skinDepth || 'Medium',
      contrastLevel: analysis.contrastLevel || 'Medium',
      analysisMethod: 'groq-vision-two-pass',
      _meta: {
        imageQualityFlags: processed.qualityFlags,
        lightingQuality: analysis.lightingQuality || 'unknown',
        faceValidation: analysis.imageValidation || {
          containsHumanFace: faceCheck.hasFace === true,
          reason: faceCheck.reason,
        },
        undertoneScores: cleanedUndertone.scores || null,
        lowConfidence: analysis._lowConfidence || false,
        genericFlags: analysis._flags || [],
        observations: observations.slice(0, 500),
      },
    });
  } catch (err) {
    console.error('[style-analysis] Error:', err.message || err);

    if (err.status === 401) {
      return res.status(500).json({ error: 'API key is invalid or missing. Check your .env file.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limited — please wait a moment and try again.' });
    }

    return res.status(500).json({
      error: err.message || 'Something went wrong during analysis. Please try again.',
    });
  }
}

module.exports = styleAnalysisHandler;
