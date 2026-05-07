// Pass 1: Raw observation only — no labels, no classification yet.
const OBSERVATION_PROMPT = `You are an expert color analyst examining a client's selfie. Your job in this step is ONLY to describe what you see — do NOT classify or label anything yet.

FIRST, decide whether the image contains a real, visible human face suitable for style analysis.
If the image is an object, product, animal, landscape, drawing, logo, mannequin, statue, blurred face, covered face, cropped body without a face, or anything that is not a real visible human face, say:
FACE_VALIDATION: NO_FACE
REASON: brief reason

If there is a real visible human face, say:
FACE_VALIDATION: FACE_VISIBLE
REASON: brief reason

1. SKIN TONE OBSERVATIONS
   - What color cast do you see on the cheeks, forehead, and neck? (golden, peachy, rosy, olive, ashy, blue-pink, neutral beige, etc.)
   - Compare the neck area to the cheeks — any color difference?
   - If veins are clearly visible anywhere, note whether they appear more green, more blue/purple, or mixed. If not clearly visible, say so explicitly.
   - Under this lighting, does the skin lean yellow-warm, pink-cool, olive-neutral, or balanced?
   - Skin depth reference: paper-white → porcelain → light beige → beige → tan → medium brown → deep brown → espresso. Where does this person fall?

2. FACE PROPORTION MEASUREMENTS
   - Is the face longer than wide, wider than long, or roughly equal? Estimate the ratio (e.g. "roughly 1.4x taller than wide").
   - Forehead width at eyebrow level vs jaw width at its widest angle: is the forehead clearly wider, clearly narrower, or similar? If wider, estimate by how much (slightly ~10%, moderately ~20%, significantly ~30%+).
   - Forehead width vs cheekbone width: wider, narrower, or same?
   - Cheekbones vs jaw: wider, narrower, or same? Are the cheekbones the widest point of the face?
   - Jawline shape: strongly squared with angular corners, softly rounded with no definition, pointed and tapering, or wide and flat?
   - Chin: pointed and narrow, rounded and soft, wide and square, or flat?
   - Where is the face widest — at the forehead, cheekbones, or jaw?

3. HAIR OBSERVATIONS
   - Describe the exact shade you see — not a category.
   - Any visible highlights, roots, or color variation?
   - Warm (golden/red/copper) or cool (ashy/blue) tones?
   - Overall contrast between skin and hair: low, medium, or high?

4. LIGHTING AND IMAGE QUALITY
   - Natural or artificial lighting?
   - Any strong color cast from the environment (yellow bulb, blue screen, colored walls)?
   - Is the face well-lit and unobstructed?
   - Quality rating for color analysis: GOOD / ACCEPTABLE / POOR

IMPORTANT:
- Be specific — "slight golden warmth along the jawline" beats "warm skin."
- Do not assume warm undertones from indoor yellow light alone.
- Return ONLY plain text. No JSON, no markdown.`;


// Pass 2A: Face geometry ONLY — dedicated to face shape analysis.
const FACE_GEOMETRY_PROMPT = (observations) => `You are a facial geometry analyst. Your ONLY task is to determine face shape. Do not analyze skin tone, hair color, or undertone.

--- PRIOR OBSERVATIONS ---
${observations}
--- END OBSERVATIONS ---

Look at the photo carefully and work through each step before writing JSON.

STEP 1 — IDENTIFY KEY FEATURES
Answer each question in one phrase:
  A. Forehead: Is the forehead clearly wider than the jaw, clearly narrower, or roughly the same width?
  B. Cheekbones: Are the cheekbones the widest point of the face, or do the forehead/jaw compete with them?
  C. Jawline: Is the jaw angular with visible corners, gently rounded, or tapering to a narrow chin?
  D. Face length: Does the face look noticeably long and narrow, noticeably wide and short, or balanced?
  E. Chin: Is the chin pointed/narrow, rounded/soft, square/flat, or wide?

STEP 2 — MATCH TO SHAPE
Use your answers to find the best match. Focus on the ONE or TWO most defining features for each shape:

  OVAL    │ Forehead slightly wider than jaw. Jaw gently curves inward. No strong angles. Balanced length — not short, not long. Rounded chin. This is the default only when features are genuinely balanced, NOT when you are uncertain.
  ROUND   │ Face width and length nearly equal — clearly wider and shorter than Oval. Full soft cheeks. Jaw line has no angular corners at all. The face reads as circular.
  SQUARE  │ Forehead and jaw are similar width AND the jaw has clearly visible angular corners. The angular jaw is the defining feature, not just a wide jaw.
  HEART   │ Forehead is clearly and obviously the widest zone — noticeably wider than both cheekbones and jaw. Chin narrows to a point or is distinctly narrow.
  DIAMOND │ Cheekbones are clearly the widest point — visibly wider than both forehead AND jaw. Both forehead and jaw are noticeably narrower than the cheekbones.
  OBLONG  │ Face is noticeably long relative to its width. Forehead, cheekbones, and jaw are all similar widths with no single zone standing out. Length is the defining feature.

STEP 3 — RESOLVE AMBIGUITY
If torn between two shapes, apply these tiebreakers:
  Round vs Oval   → Only choose Round if the face is genuinely circular in proportion with zero jaw angles. Any visible jaw structure or moderate face length means Oval.
  Square vs Oblong → Visible angular jaw corners = Square. Long face with no jaw angle = Oblong.
  Heart vs Oval   → Heart needs the forehead to be clearly and obviously the widest zone. If the forehead is only slightly wider, choose Oval.
  Diamond vs Oval → Diamond needs cheekbones to clearly exceed both forehead and jaw. If cheekbones are only moderately prominent, choose Oval.

STEP 4 — ACCOUNT FOR SELFIE DISTORTION
Wide-angle selfies taken at arm's length make faces appear wider and rounder than they are in person. If the face looks round but has any visible jaw angle or non-trivial face length, lean toward Oval or Square rather than Round.

STEP 5 — WRITE REASONING
Before the JSON write exactly one line:
FACE_REASONING: [name the 3–4 features you relied on most and explain why they point to your chosen shape]

MANDATORY VALIDATION: If the image has no visible human face, return only:
{"error": "no_face", "reason": "brief explanation"}

Otherwise return ONLY this JSON (no markdown):
{
  "imageValidation": {
    "containsHumanFace": true,
    "faceVisibility": "clear" | "partially_obscured",
    "reason": "what face cues you used"
  },
  "faceShape": {
    "shape": "Oval" | "Round" | "Square" | "Heart" | "Diamond" | "Oblong",
    "confidence": 0.0 to 1.0,
    "features": {
      "foreheadWidth": "Wide" | "Medium" | "Narrow",
      "cheekboneWidth": "one phrase comparing to forehead and jaw — e.g. 'prominent, clearly widest point of face'",
      "jawlineAngle": "one phrase — e.g. 'strongly squared with angular corners' or 'softly rounded' or 'tapered toward chin'",
      "faceLengthRatio": "approximate ratio — e.g. '1.4:1, noticeably elongated' or '1.1:1, nearly square'",
      "chinShape": "Pointed" | "Rounded" | "Wide" | "Flat"
    }
  }
}`;


// Pass 2B: Color and depth ONLY — dedicated to undertone, skin, hair.
const COLOR_ANALYSIS_PROMPT = (observations) => `You are a precision color and depth analyst. Your ONLY task in this pass is skin undertone, skin depth, hair color, contrast, and lighting quality. Do not analyze face shape or geometry.

--- YOUR PRIOR OBSERVATIONS ---
${observations}
--- END OBSERVATIONS ---

Look at the photo again. Work through these steps:

STEP 1 — EXAMINE SKIN IN THREE ZONES
Zone A: Cheeks (away from any blush or redness)
Zone B: Forehead (center, away from hairline shadows)
Zone C: Jawline and neck (if visible)

For each visible zone, note: is the cast golden/peachy, pink/rosy, olive/neutral, or balanced beige?

STEP 2 — DETERMINE UNDERTONE
  Warm  = consistent golden, peachy, or yellow-warm cast across zones. Skin has a honey or golden quality.
  Cool  = consistent pink, rosy, or bluish-pink cast across zones. Skin may look porcelain or slightly ashen.
  Neutral = no dominant warm or cool cast. Balanced beige, olive, or mixed signals.

CRITICAL ANTI-BIAS RULES:
  ✗ Do NOT classify as Warm just because the room lighting is warm/yellow — that is lighting, not skin.
  ✗ Do NOT default to Neutral when you are uncertain — look harder at the specific zones above.
  ✗ If zones show consistent warmth that is not explained by lighting, classify Warm even if subtle.
  ✗ Score warm/cool/neutral on 0–10 honestly: if evidence leans Warm, warm score should be 6+.

STEP 3 — SCORE UNDERTONE STRENGTH
Give each undertone a score from 0 to 10 based on how strongly you see it in the skin.
These must sum to roughly 15–20 (they are independent evidence scores, not probabilities).
Example: warm:7, cool:3, neutral:5 means clear warm lean with some neutral balance.

STEP 4 — HAIR COLOR
Look at the hair in the photo. Pick the closest hex from this reference list — do NOT invent a hex:
  Jet Black        #1a1a1a   Blue Black      #1C1C2E   Soft Black      #2C2C2C
  Dark Brown       #3B2314   Chocolate Brown #4A2C2A   Chestnut Brown  #6F4E37
  Medium Brown     #7B4F2E   Warm Brown      #8B5E3C   Golden Brown    #8B6914
  Medium Golden Brown #A0722A  Caramel Brown  #C68642   Light Brown     #A0785A
  Dark Blonde      #C9A96E   Dirty Blonde    #B8860B   Golden Blonde   #DAA520
  Honey Blonde     #D4A76A   Light Blonde    #E8D5A3   Platinum Blonde #E5E4E2
  Strawberry Blonde #E8956D  Copper Red      #B87333   Auburn          #922B1C
  Bright Red       #CC2200   Dark Red        #8B1A1A   Grey            #9E9E9E
  Silver           #C0C0C0   White           #F5F5F5

Pick the closest match. The hex you return MUST look like the actual hair color in the photo.

STEP 5 — SKIN DEPTH SCALE
Match the skin to this scale:
  Fair        = paper-white to porcelain, very pale
  Light       = light beige, minimal pigment
  Light-Medium = light tan, warm light beige
  Medium      = tan, medium beige, neither light nor dark
  Medium-Deep = deep tan, warm brown
  Deep        = rich brown
  Very Deep   = deep espresso to near-black

STEP 7 — WRITE REASONING
Before the JSON, write one line: COLOR_REASONING: [zone-by-zone observations and why you chose this undertone]

MANDATORY VALIDATION: If the image has no visible human face, return only:
{"error": "no_face", "reason": "brief explanation"}

Otherwise return ONLY this JSON (no markdown):
{
  "imageValidation": {
    "containsHumanFace": true,
    "faceVisibility": "clear" | "partially_obscured",
    "reason": "what face cues you used"
  },
  "undertone": {
    "result": "Warm" | "Cool" | "Neutral",
    "confidence": 0.0 to 1.0,
    "details": "2-3 sentences using 'you/your' — describe what you see in the skin that led to this. Reference specific zones (cheeks, jawline, neck).",
    "indicators": ["4 specific visual cues you actually observed — no vein mentions unless clearly visible"],
    "scores": {
      "warm": 0 to 10,
      "cool": 0 to 10,
      "neutral": 0 to 10
    }
  },
  "hairColor": {
    "current": {
      "color": "descriptive name like 'Dark Chocolate Brown' or 'Warm Auburn'",
      "hex": "pick from the reference list in STEP 4 — must visually match the hair in the photo"
    },
    "category": "Black" | "Dark Brown" | "Medium Brown" | "Light Brown" | "Dark Blonde" | "Light Blonde" | "Red" | "Auburn" | "Grey" | "Other"
  },
  "skinDepth": "Fair" | "Light" | "Light-Medium" | "Medium" | "Medium-Deep" | "Deep" | "Very Deep",
  "contrastLevel": "Low" | "Medium" | "High",
  "lightingQuality": "GOOD" | "ACCEPTABLE" | "POOR"
}`;


const STYLE_PERSONALIZATION_PROMPT = (context) => `You are a certified color analyst and personal stylist. Based on the person's analysis context, generate a fully personalized color palette with REAL HEX CODES calibrated to their specific profile — not a generic season palette shared with everyone else.

IMPORTANT FORMATTING RULES:
- palette, accentColors, neutrals, colorsToAvoid → use #RRGGBB hex codes.
- makeup.blush, makeup.lips, makeup.eyeshadow → use SHORT DESCRIPTIVE TEXT NAMES ONLY (e.g. "warm peach", "cool rose"). NEVER put hex codes in makeup fields.

Calibration rules:
- Undertone scores show how strongly the undertone expresses: warm:8, cool:2 deserves richer, more saturated warm colors than warm:6, cool:4.
- Skin depth controls brightness: Fair/Light skin → lighter, cleaner tints. Medium-Deep/Deep/Very Deep → fuller, more saturated shades that hold against the complexion.
- Contrast level shapes pairing strength: High contrast → sharper color combinations allowed. Low contrast → softer tonal blends, avoid strong jumps.
- currentHair.hex gives the actual hair color — pick palette colors that harmonize with it.
- colorsToAvoid must include accurate hex codes of shades that actively clash with this specific person.
- All hex values must be in #RRGGBB format (exactly 7 characters including the #).

Analysis context:
${JSON.stringify(context, null, 2)}

Return ONLY this JSON (no markdown fences, no extra text):
{
  "paletteSummary": "2-3 sentences specific to this person's undertone, depth, and contrast together — not a generic season description",
  "palette": [
    { "hex": "#RRGGBB", "name": "Color Name", "category": "Warm neutral|Cool neutral|Earth tone|Statement|Jewel tone|Warm accent|Soft accent" },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "category": "..." }
  ],
  "accentColors": [
    { "hex": "#RRGGBB", "name": "Color Name" },
    { "hex": "#RRGGBB", "name": "Color Name" },
    { "hex": "#RRGGBB", "name": "Color Name" }
  ],
  "neutrals": [
    { "hex": "#RRGGBB", "name": "Color Name" },
    { "hex": "#RRGGBB", "name": "Color Name" },
    { "hex": "#RRGGBB", "name": "Color Name" },
    { "hex": "#RRGGBB", "name": "Color Name" }
  ],
  "makeup": {
    "foundationTips": "2-3 sentences",
    "blush": ["shade name only — e.g. 'warm peach', 'soft terracotta', 'cool rose' — NO hex codes, 4 items"],
    "lips": ["shade name only — e.g. 'brick nude', 'berry', 'warm coral' — NO hex codes, 4 items"],
    "eyeshadow": ["shade name only — e.g. 'bronze', 'cool taupe', 'champagne' — NO hex codes, 4 items"]
  },
  "colorsToAvoid": [
    { "hex": "#RRGGBB", "name": "Color Name", "reason": "one sentence why this clashes with their specific profile" },
    { "hex": "#RRGGBB", "name": "Color Name", "reason": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "reason": "..." },
    { "hex": "#RRGGBB", "name": "Color Name", "reason": "..." }
  ]
}`;

module.exports = {
  OBSERVATION_PROMPT,
  FACE_GEOMETRY_PROMPT,
  COLOR_ANALYSIS_PROMPT,
  STYLE_PERSONALIZATION_PROMPT,
  // Keep for backward compatibility / fallback
  CLASSIFICATION_PROMPT: COLOR_ANALYSIS_PROMPT,
};
