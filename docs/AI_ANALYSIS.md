# Lumière — AI Style Analysis: Complete Documentation

---

## 1. All Files Involved

### Backend
| File | Role |
|---|---|
| `backend/routes/styleanalysisroute.js` | Re-exports the controller into server.js — one line |
| `backend/server.js` | Registers `POST /api/style-analysis` + inline save/get/delete routes |
| `backend/controllers/styleAnalysisController.js` | Main pipeline orchestrator — all 5 stages + every helper function |
| `backend/controllers/styleFollowUpController.js` | Follow-up chat endpoint — off-topic guard, delegates to client |
| `backend/services/groqClient.js` | Makes all Groq API calls — observation, classification, personalization |
| `backend/services/styleFollowUpClient.js` | Groq call for follow-up chat — compacts analysis, manages history |
| `backend/services/imageProcessor.js` | Sharp preprocessing — resize, normalize, sharpen, quality flags |
| `backend/prompts/styleAnalysisPrompts.js` | All prompt strings sent to the models |
| `backend/data/styleRecommendations.js` | Hand-curated lookup tables — palettes, metals, makeup, face shape recs |
| `backend/utils/responseValidator.js` | Parses and validates AI JSON output |

### Frontend
| File | Role |
|---|---|
| `frontend/src/utils/styleAnalysis.js` | Resizes photo to base64, sends POST, returns raw JSON |
| `frontend/src/pages/FindYourStyle.jsx` | Manages phases (hero → upload → loading → results), holds `results` state |
| `frontend/src/pages/MyStyle.jsx` | Loads saved analysis from MongoDB, same display as live results |
| `frontend/src/components/style/analysis/StyleResults.jsx` | Tab switcher — routes each tab to the correct card component |
| `frontend/src/components/style/analysis/StyleResultCards.jsx` | Five card components — each reads its slice of the JSON |
| `frontend/src/components/style/analysis/StyleAnalysisIntro.jsx` | Upload UI and loading progress screen |
| `frontend/src/components/style/analysis/styleAnalysisUtils.js` | `normalizeHex()`, `getLuminance()`, `formatLabel()` helpers |
| `frontend/src/components/style/StyleFollowUpChat.jsx` | Chat UI — sends `analysis` + question to follow-up endpoint |
| `frontend/src/data/analysisTypes.js` | The 5 tab definitions (id + label) |
| `frontend/src/api.js` | `saveAiAnalysis`, `getSavedAiAnalysis`, `deleteSavedAiAnalysis` |

---

## 2. The Pipeline — Stage by Stage

### Stage 0 — Image Preprocessing (`imageProcessor.js` via Sharp)

The frontend resizes the photo to max 1024px using Canvas API and encodes it as JPEG at 85% quality before sending. On the backend, Sharp does a second pass:
- Resize to max 1024px (ensures consistent input regardless of device)
- Histogram normalization — compensates for yellow indoor light or screen glow, which are the single biggest source of undertone misclassification
- Unsharp mask (sigma 0.8) — helps the model resolve facial features
- Computes brightness + standard deviation to generate quality flags

If the image is flagged as **both** `very_dark` AND `low_contrast`, the request is rejected immediately — no API call is made, saving cost and avoiding a result that would be wrong anyway.

---

### Stage 1 — Observation Pass (`getObservations`)

**Model:** LLaMA 4 Scout | **Tokens:** 1,500 | **Temperature:** 0.2

Sends the preprocessed image with `OBSERVATION_PROMPT`. The model writes a structured natural-language description of what it sees: skin tone appearance, hair color and texture, face proportions, lighting quality, and a `FACE_VALIDATION: FACE_VISIBLE` or `FACE_VALIDATION: NO_FACE` marker.

Low temperature (0.2) keeps the description consistent across runs — this is a descriptive pass, not an analytical one, so creativity is not wanted.

`validateFaceObservations()` in `responseValidator.js` reads the `FACE_VALIDATION` marker. If `NO_FACE` — reject with a user-friendly message. This catches product photos, objects, covered faces, and heavily cropped images before wasting the more expensive Stage 2 calls.

The observation text is passed to Stage 2 as context so the classification model doesn't have to re-derive what it already described.

---

### Stage 2 — Classification (`getClassification`) — Two Parallel Sub-passes

**Model:** LLaMA 4 Maverick | **Tokens:** 900 each | **Temperature:** 0.15

Both calls are fired at the same time with `Promise.allSettled`:

**Sub-pass 2A — Face geometry** (`FACE_GEOMETRY_PROMPT`)
Given the Stage 1 observations, Maverick classifies:
- Face shape: Oval, Round, Square, Heart, Diamond, or Oblong
- Confidence score (0–1)
- 5 feature measurements: forehead width, cheekbone width, jaw width, face length ratio, chin shape

**Sub-pass 2B — Color analysis** (`COLOR_ANALYSIS_PROMPT`)
Given the Stage 1 observations, Maverick classifies:
- Skin undertone: Warm, Cool, or Neutral — with **numeric scores** for each (0–10), not just a label
- Skin depth on a 7-point scale: Fair, Light, Light-Medium, Medium, Medium-Deep, Deep, Very Deep
- Hair color: current color description + category
- Contrast level: Low, Medium, or High (skin-to-hair contrast)
- Lighting quality: GOOD, ACCEPTABLE, or POOR

**Why parallel?** They're independent tasks. Running them concurrently reduces latency by ~40–50% vs sequential. Each gets its own full context window focused on one job.

**Why Maverick here?** It's the more capable model. Classification is the high-stakes step — an undertone error cascades into a wrong seasonal subtype, wrong palette, wrong metal. Scout is used for everything else.

#### The Fallback Chain (inside `getClassification`)

```
Both 2A and 2B succeed → merge and return ✅

2B fails → retry 2B with Scout, merge with 2A result
2A fails → retry 2A with Scout, merge with 2B result

Both fail → single combined Scout call ⚠️
```

`Promise.allSettled` is used (not `Promise.all`) so one failure doesn't cancel the other. The chain means the user gets a result even in degraded conditions, though potentially with slightly lower accuracy.

---

### Stage 3 — Normalization + Seasonal Subtype (pure JS, no API call)

#### `normalizeUndertone(undertone, lightingQuality)`

The model returns numeric scores e.g. `{ warm: 6.2, cool: 4.1, neutral: 5.8 }`. A naive "highest wins" approach would commit to a direction even when the evidence is genuinely borderline. This function applies calibrated thresholds:

- **Strong evidence** (top score ≥ 7, spread ≥ 1) → trust it unconditionally
- **Warm result + poor lighting + small spread** → collapse to Neutral (yellow light biases toward Warm)
- **Low confidence + small spread + Neutral close to top** → collapse to Neutral
- **Top score < 5.5 + Neutral close** → Neutral

The goal is to prevent the Neutral label from absorbing every borderline result (which would make it useless) while also preventing false Warm/Cool commits when lighting has clearly corrupted the signal.

#### `derivePersonalSubtype(undertone, skinDepth, hairCategory, contrastLevel)`

Maps the four attributes to one of 10 seasonal subtypes using a decision tree:

| Undertone | Conditions | Subtype |
|---|---|---|
| Warm | Light skin OR low contrast + light hair | Light Spring |
| Warm | Deep skin OR high contrast OR dark hair | Deep Autumn |
| Warm | Everything else | Warm Autumn |
| Cool | Light skin OR low contrast + light hair | Light Summer |
| Cool | Deep skin OR high contrast OR dark hair | Deep Winter |
| Cool | Low contrast | Cool Summer |
| Cool | Everything else | Cool Winter |
| Neutral | Deep skin OR high contrast | Deep Neutral |
| Neutral | Low contrast OR light skin OR light hair | Soft Summer |
| Neutral | Everything else | Soft Spring |

Each subtype maps to its own distinct color pool in `styleRecommendations.js` — not a reordering of the same 12 colors. A Light Spring gets peach, coral, creamy warm neutrals. A Deep Autumn gets espresso, olive, burgundy, rust.

---

### Stage 4 — Building the Result (`buildPersonalizedInfo`)

No more API calls. This assembles everything using the normalized results + the curated data file.

1. Looks up `UNDERTONE_INFO[undertoneResult]` → base palette, metal, hair, makeup for that undertone
2. Looks up `SUBTYPE_PALETTES[subtype]` → if found, **overrides** the base palette with subtype-specific colors
3. Calls `pickProfileColors()` to rank and select the best colors from the pool for this specific profile
4. Looks up `DEPTH_MAKEUP[depthGroup][undertone]` → skin-depth-aware blush/lip/eyeshadow (Fair skin gets different shades than Deep skin, not the same list)
5. Builds personalized summary text for palette, metal reasoning, hair notes using `buildDepthNote()` and `buildContrastNote()`

#### `scoreColorForProfile(color, profile)`

Every candidate color in the pool is scored numerically:
- **Skin depth:** light profiles score lighter luminance colors higher; deep profiles score darker higher
- **Contrast level:** high contrast → statement/jewel tones boosted; low contrast → soft neutrals boosted, statement colors penalised
- **Season:** Spring/Summer → higher luminance gets a boost; Autumn/Winter → lower luminance
- **Undertone magnitude:** strong (big spread between scores) → saturated undertone colors rewarded; soft/borderline → neutrals rewarded

`pickProfileColors()` sorts all colors by this score and returns the top N.

---

### Stage 5 — Personalization Pass (`getStylePersonalization`)

**Model:** LLaMA 4 Scout | **Tokens:** 1,400 | **Temperature:** 0.7

The model receives the user's full profile as context (undertone scores, skin hex, subtype, hair category, contrast level, the Stage 1 observations) and generates its own palette, accent colors, neutrals, makeup direction, and a personalized summary paragraph — all as JSON with hex codes.

Higher temperature (0.7) is intentional here — this pass should sound personal and specific, not templated.

This is wrapped in a `try/catch`. If it fails for any reason, the curated palette from Stage 4 is used silently. The user always gets a complete result.

#### `mergeStylingContent(info, generated)` — Curated vs AI Colors

After the personalization pass:

```
AI palette has ≥ 6 valid hex colors  → AI palette used, curated discarded
AI palette has < 6 valid hex colors  → curated palette used

AI accents has ≥ 2 valid            → AI accents used
AI neutrals has ≥ 3 valid           → AI neutrals used
AI colorsToAvoid has ≥ 3 valid      → AI avoid list used
```

`isValidHexColor()` checks each item has a proper `#RRGGBB` hex AND a non-empty name. Malformed items are silently dropped before the threshold check.

In practice the AI usually wins because it personalises based on the specific user's skin hex, hair, and contrast. But the curated data is the guarantee underneath — the user never sees an empty or broken palette.

**Face shape recommendations and depth makeup always come from the curated file** — the AI never generates these. They are looked up directly after classification.

---

## 3. `styleRecommendations.js` — The Curated Data File

This file contains no logic — only hand-written data objects. It has 4 exports:

**`UNDERTONE_INFO`** — keyed by `'Warm'`, `'Cool'`, `'Neutral'`
Each entry contains: skin sample hex, best metal + hex, 3 metal alternatives with compatibility scores, metal reasoning text, default season/subtype, base palette (12 colors with categories), accents, neutrals, colors to avoid with reasons, palette summary text, makeup (foundation tips, blush, lips, eyeshadow), and hair recommendations (5 recommended shades, 3 to avoid, seasonal notes).

**`SUBTYPE_PALETTES`** — keyed by subtype name (e.g. `'Light Spring'`, `'Deep Autumn'`)
Overrides the undertone base palette with a more specific color pool. This is why Light Spring and Warm Autumn have genuinely different palettes even though both are Warm — Light Spring draws from a lighter, cleaner pool.

**`FACE_SHAPE_RECS`** — keyed by shape name (e.g. `'Oval'`, `'Square'`)
Contains necklace style recommendations, neckline suggestions, and accessory tips for each face shape. This is what fills `faceShape.recommendations` in the response.

**`DEPTH_MAKEUP`** — keyed by `depthGroup` (`'light'`, `'medium'`, `'deep'`) then undertone
Provides skin-depth-aware blush, lip, and eyeshadow shades. A Fair Cool user gets different shades than a Deep Cool user.

**Why a curated file instead of asking the AI?**
The AI is reliable at classifying (this person is Warm, Deep Autumn, Oval). It's inconsistent at producing the same quality advice every time. Pre-writing the advice and letting the AI only decide which key to look up gives deterministic, quality-controlled results. The AI-generated personalization pass on top adds the personal touch.

---

## 4. `responseValidator.js` — Validating AI Output

The AI returns text. This file turns it into usable, verified data.

**`parseClassification(rawText)`**
1. Strips markdown code fences (models often wrap JSON in ` ```json `)
2. Extracts the first `{...}` block with regex
3. `JSON.parse()` — if it fails, returns `{ success: false }`
4. Checks `imageValidation.containsHumanFace === true` — if false, returns `isRefusal: true` (not a retry candidate, an explicit rejection)
5. Checks all required fields exist: `undertone.result`, `faceShape.shape`, `hairColor.current`, `undertone.scores`
6. Validates values against allowed enums — undertone must be `'Warm'`/`'Cool'`/`'Neutral'`, shape must be one of 6, etc.
7. Validates undertone scores are numbers between 0–10
8. Returns `{ success: true, data: parsed }` or `{ success: false, error: '...' }`

**`isGenericResponse(analysis)`**
Detects when the model returned placeholder/evasive answers instead of genuinely analysing the photo. Checks for:
- `default_combo`: all three of Neutral undertone + Oval face + Medium skin simultaneously (the most common cop-out combination)
- `overconfident`: both undertone and face shape confidence > 0.9 (suspiciously certain)
- `vague_indicators`: 3+ indicators contain words like "appears", "seems", "general" (model didn't observe specifics)
- `thin_details`: undertone details text under 50 characters
- `flat_undertone_scores`: spread between warm/cool/neutral scores ≤ 1 (model assigned nearly equal scores, indicating it didn't really look)

If 2 or more flags are raised → `isGeneric: true` → the controller retries automatically (up to `MAX_RETRIES = 2`).

**`validateFaceObservations(observations)`**
Reads the `FACE_VALIDATION: FACE_VISIBLE` or `FACE_VALIDATION: NO_FACE` marker the prompt instructs the model to include. Returns `{ hasFace: true/false, reason }`.

**`parsePersonalization(rawText)`**
Similar JSON extraction but looser — drops any color item that doesn't have a valid `#RRGGBB` hex AND a non-empty name. Returns cleaned arrays ready for `mergeStylingContent`.

---

## 5. `groqClient.js` — The API Layer

Wraps all Groq API calls. Three exported functions:

**`getObservations(base64, mediaType)`**
Single call, Scout, temperature 0.2, 1500 tokens. Returns raw text.

**`getClassification(base64, mediaType, observations)`**
Fires 2A and 2B with `Promise.allSettled`. Parses both results with `safeParseJson()`. Merges them into one combined object if both succeed. Falls back through the chain described in Stage 2. Returns a JSON string.

`safeParseJson()` strips code fences and extracts the first `{...}` block — same defensive parsing as `responseValidator.js` but simpler, used internally here.

**`getStylePersonalization(context)`**
Single call, Scout, temperature 0.7, 1400 tokens. Takes the assembled profile context object, not an image. Returns raw text.

---

## 6. Follow-Up Chat

### `styleFollowUpController.js`

The analysis is **not fetched from the database**. The frontend sends the full `results` JSON object it already holds in state with every follow-up request:

```js
// Frontend (StyleFollowUpChat.jsx → styleAnalysis.js)
body: JSON.stringify({ analysis: results, question, history })

// Backend (styleFollowUpController.js)
const { analysis, question, history } = req.body  // reads it directly from the request
```

Before hitting the AI, the controller runs two guards:
1. `hasUsableAnalysis(analysis)` — checks at least one of the 5 analysis fields exists
2. `isStyleRelatedQuestion(question)` — checks the question contains at least one word from a 50-term whitelist (style, color, outfit, metal, jewelry, hair, makeup, occasion, etc.). If not style-related, returns a polite redirect message without making any API call.

### `styleFollowUpClient.js`

**`compactAnalysis(analysis)`**
Before sending to Groq, the full analysis is trimmed down to only the fields the model needs for context. This removes internal metadata, quality flags, hex samples, and verbose fields that add token cost without helping the model answer questions.

**`compactHistory(history)`**
Takes the last 6 messages only and truncates each to 800 characters. This prevents the context window from growing unboundedly across a long chat session.

**`stripMarkdown(text)`**
The model sometimes returns bold text, bullet points, or headings even when instructed not to. This strips all markdown formatting from the response before returning it to the frontend, ensuring plain readable text in the chat UI.

The system prompt explicitly instructs the model: use plain text only, do not re-analyze the image, do not claim to see the user, stay within the provided analysis context, avoid medical or identity claims.

---

## 7. Frontend Consumption

### The flow from JSON to screen

```
analyzePhoto(imageUrl)
  → resize to 1024px via Canvas API
  → POST /api/style-analysis with base64
  → returns full JSON

FindYourStyle.jsx
  → setResults(response)      ← entire JSON stored as-is in state
  → setPhase("results")

StyleResults.jsx
  → renders 5 tabs from analysisTypes.js
  → renderCard(activeTab) switches on tab id:
      "undertone"    → <UndertoneCard    data={results.undertone} />
      "hairColor"    → <HairColorCard    data={results.hairColor} />
      "outfitColors" → <OutfitColorsCard data={results.outfitColors} />
      "jewelryMetal" → <JewelryMetalCard data={results.jewelryMetal} />
      "faceShape"    → <FaceShapeCard    data={results.faceShape} />
  → <StyleFollowUpChat analysis={results} />
```

Each card component reads exactly its slice — no transformation layer, no Redux, no intermediate mapping. The JSON shape from the backend is designed to match exactly what each card expects.

### What each card renders

**`UndertoneCard`** — circular color swatch (`hex_sample`), result label, confidence bar, season/subtype pills, indicators as text pills, skin depth + contrast level, makeup direction (blush/lips/eyeshadow), colors to avoid with swatches

**`HairColorCard`** — current hair color swatch, recommended shades as color swatches with reasons, shades to avoid, seasonal notes

**`OutfitColorsCard`** — season/subtype pills, palette summary text, best colors grouped by category, accent colors, neutrals, colors to avoid

**`JewelryMetalCard`** — best metal with radial gradient swatch, reasoning text, alternatives with compatibility percentage bars

**`FaceShapeCard`** — CSS-shaped div representing the face shape (different border-radius per shape), confidence bar, feature breakdown table, necklace/neckline/accessory recommendations as pills

### Saving and loading

```js
// Save: the entire results object sent as-is
await saveAiAnalysis(results)
// → POST /api/style-analysis/save → stored in user.aiAnalysis (Mixed type in MongoDB)

// Load (MyStyle.jsx):
const { results, savedAt } = await getSavedAiAnalysis()
// → GET /api/style-analysis/saved → reads user.aiAnalysis from MongoDB
// → passes to <StyleResults results={results} /> — identical display to live analysis
```

The `Mixed` type in MongoDB means the shape is never validated at the DB level — it stores whatever JSON the controller produces. Field validation happens at the API response layer in `responseValidator.js`.

---

## 8. Complete Data Flow

```
[Browser]
  Photo selected → Canvas resize to 1024px → base64 JPEG

  POST /api/style-analysis
        │
        ▼
[imageProcessor.js - Sharp]
  Resize → normalize lighting → unsharp mask → quality flags
  Reject if very_dark + low_contrast
        │
        ▼
[groqClient.getObservations - Scout, temp 0.2]
  Describes face, lighting, skin, hair
  Embeds FACE_VALIDATION marker
        │
  validateFaceObservations() → reject if NO_FACE
        │
        ▼
[groqClient.getClassification - Maverick, temp 0.15]
  2A (face geometry) ──┐  Promise.allSettled
  2B (color analysis) ─┘
        │
  Fallback chain if either fails
        │
  parseClassification() → validate fields + enums + score ranges
  isGenericResponse()   → retry if placeholder detected (up to 2x)
        │
        ▼
[styleAnalysisController.js - pure JS]
  sanitizeUndertoneEvidence() → strip hallucinated vein references
  normalizeUndertone()        → calibrated Warm/Cool/Neutral label
  derivePersonalSubtype()     → one of 10 seasonal subtypes
  buildPersonalizedInfo()     → look up UNDERTONE_INFO + SUBTYPE_PALETTES
                                 + DEPTH_MAKEUP + scoreColorForProfile()
  FACE_SHAPE_RECS[shape]      → necklace + neckline tips
        │
        ▼
[groqClient.getStylePersonalization - Scout, temp 0.7]
  Generates personalized palette + summary as JSON
  (wrapped in try/catch — curated used if this fails)
        │
  mergeStylingContent() → AI palette if ≥6 valid hex colors, else curated
        │
        ▼
[Final JSON response]
  undertone / faceShape / jewelryMetal / outfitColors / hairColor / skinDepth / contrastLevel

[Browser]
  setResults(response) → StyleResults tabs → 5 card components
  StyleFollowUpChat sends results back with each question
  Save button → POST /api/style-analysis/save → MongoDB user.aiAnalysis
```
