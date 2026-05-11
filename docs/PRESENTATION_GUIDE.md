# Lumière — Presentation Guide

---

## 1. Starting the App

**Terminal 1 — Backend**
```
cd backend
npm run dev
```
Runs on `http://localhost:5000`

**Terminal 2 — Frontend**
```
cd frontend
npm run dev
```
Runs on `https://localhost:5173`  
The browser will show a certificate warning because the HTTPS cert is self-signed. Click **Advanced → Proceed to localhost**.

**Before starting:** Make sure MongoDB is running.  
`Win + R → services.msc → MongoDB Server → Start`  
Or in an admin terminal: `net start MongoDB`

---

## 2. Tech Stack at a Glance

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Component-based UI, fast HMR in dev |
| Styling | Tailwind CSS | Utility-first, no separate CSS files |
| Backend | Node.js + Express | Minimal, JS throughout, easy Mongoose integration |
| Database | MongoDB + Mongoose | Flexible schema fits evolving AI output shape |
| AI | Groq API (LLaMA 4 Scout + Maverick) | Low latency, pay-per-token, vision support |
| Image prep | Sharp | Native C++ bindings, fast resize + normalize |
| Face tracking | MediaPipe FaceMesh | Runs in-browser via WebAssembly, no server upload |
| Auth | JWT + bcrypt + Node crypto | Stateless, secure, no third-party identity provider |
| Email | Nodemailer + Gmail SMTP | Lightweight OTP delivery |

---

## 3. Database

**Connection string:** `mongodb://localhost:27017/lumiere` (in `backend/.env`)  
**Connection code:** `backend/config/db.js`, called before any routes register in `server.js`

### Collections

**`users`**
- `name`, `email` (unique, lowercase), `password` (bcrypt hash, `select: false` — excluded from all queries by default)
- `role`: `'user'` or `'admin'` (default `'user'`)
- `wishlist`: array of `ObjectId` references to the `necklaces` collection
- `aiAnalysis`: `Mixed` type — stores the full AI result object
- `aiAnalysisSavedAt`: `Date` — when it was saved

**`necklaces`**
- Stores both catalogue items and custom user uploads in one collection, separated by `isCustom: Boolean`
- `image` + `tryOnImage`: URL paths (files live in `backend/uploads/`)
- `tryOnSettings`: `{ scale, offsetY }` — per-item rendering calibration stored in DB
- `uploadedBy`: `ObjectId` ref to the user who uploaded it (null for catalogue items)
- Indexes: `{ category, style }`, `{ featured }`, `{ uploadedBy }`

**`emailverifications`**
- Temporary records during OTP signup: stores `name`, `email`, `passwordHash`, `otpHash`, `attempts`
- TTL index on `expiresAt` — MongoDB auto-deletes records after 10 minutes, no manual cleanup needed

---

## 4. Backend Flow

### Entry point: `server.js`
1. Load `.env`
2. Connect to MongoDB
3. Register global middleware (CORS, JSON body parser, static file serving for `/uploads`)
4. Mount route files
5. Register inline routes for `/api/style-analysis/*`
6. Start listening on port 5000

### Route map
| Endpoint prefix | File | Controller |
|---|---|---|
| `POST /api/auth/signup/request-otp` | `routes/auth.js` | `authController.requestSignupOtp` |
| `POST /api/auth/signup/verify` | `routes/auth.js` | `authController.verifySignupOtp` |
| `POST /api/auth/login` | `routes/auth.js` | `authController.login` |
| `GET /api/auth/me` | `routes/auth.js` | `authController.getMe` |
| `DELETE /api/auth/me` | `routes/auth.js` | `authController.deleteAccount` |
| `GET /api/necklaces` | `routes/necklaces.js` | `necklaceController.getAllNecklaces` |
| `POST /api/necklaces/admin-upload` | `routes/necklaces.js` | `necklaceController.adminCreateNecklace` |
| `POST /api/necklaces/upload` | `routes/necklaces.js` | `necklaceController.uploadCustomNecklace` |
| `GET /api/necklaces/my-uploads` | `routes/necklaces.js` | `necklaceController.getMyUploads` |
| `DELETE /api/necklaces/:id` | `routes/necklaces.js` | `necklaceController.deleteNecklace` |
| `GET/POST/DELETE /api/wishlist` | `routes/wishlist.js` | `wishlistController` |
| `POST /api/style-analysis` | inline `server.js` | `styleAnalysisController` |
| `POST/GET/DELETE /api/style-analysis/save(d)` | inline `server.js` | direct DB calls |

### Auth middleware (3 variants in `middleware/auth.js`)
- **`protect`** — reads `Authorization: Bearer <token>`, verifies JWT, attaches `req.user`. Returns 401 if missing or invalid.
- **`optionalProtect`** — same but sets `req.user = null` instead of rejecting. Used on `/api/style-analysis` so guests can run analyses.
- **`adminOnly`** — checks `req.user.role === 'admin'`, returns 403 if not. Must be used after `protect`.

### JWT flow
1. On login/signup: server calls `jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })`
2. Token is returned to the frontend and stored in `localStorage`
3. Every API call attaches it via `Authorization: Bearer <token>`
4. `protect` middleware calls `jwt.verify(token, JWT_SECRET)` to decode it and look up the user

---

## 5. Frontend Flow

### Entry: `main.jsx` → `App.jsx`
`App.jsx` wraps everything in `AuthProvider` (React context), then a `BrowserRouter` with all routes.

### Auth context (`src/context/AuthContext.jsx`)
Stores `user` and `token` in component state + syncs to `localStorage`. Any component can call `useAuth()` to read the current user or call `login()` / `logout()`.

### API module (`src/api.js`)
All HTTP calls go through one central file. Every call uses `authHeaders()` which reads the token from `localStorage` on demand. This means if the user logs in mid-session, the next API call automatically picks up the new token.

### Vite proxy (`vite.config.js`)
```js
proxy: {
  '/api':     { target: 'http://localhost:5000' },
  '/uploads': { target: 'http://localhost:5000' },
}
```
This means the frontend never hardcodes `localhost:5000`. All `/api/...` and `/uploads/...` requests are silently forwarded to the Express server. In production you'd configure nginx or a reverse proxy to do the same thing.

### HTTPS in dev
Vite is configured to serve over HTTPS using a self-signed certificate in `frontend/cert/`. This is needed because `getUserMedia()` (webcam access) requires a secure context — browsers block it on plain HTTP except for `localhost`.

---

## 6. OTP Signup Flow — Step by Step

**Why OTP?** To verify that users own the email they register with, preventing fake accounts from accumulating saved style profiles.

### Phase 1 — Request OTP (`POST /api/auth/signup/request-otp`)
1. `express-validator` checks name, email format, password strength (min 8 chars, letter + number)
2. `crypto.randomInt(100000, 1000000)` generates a cryptographically uniform 6-digit OTP
3. Password is hashed immediately with `bcrypt.hash(password, 12)` — NOT stored raw
4. A SHA-256 hash is computed: `hash(email + ":" + otp + ":" + JWT_SECRET)` — OTP itself is never persisted
5. An `EmailVerification` document is upserted with: `name`, `email`, `passwordHash`, `otpHash`, `attempts: 0`, `expiresAt: now + 10 min`
6. The raw OTP is emailed via Nodemailer

### Phase 2 — Verify OTP (`POST /api/auth/signup/verify`)
1. Look up the `EmailVerification` document by email
2. Check it hasn't expired (`expiresAt > now`)
3. Check `attempts < 5` — if exceeded, delete the record (force restart)
4. Hash the submitted OTP the same way and compare hashes — never compare raw strings
5. On match: create `User` document from stored `name`, `email`, `passwordHash`. Delete the `EmailVerification` record. Return a 7-day JWT.
6. On mismatch: increment `attempts` counter

**Why hash the OTP?** If the `emailverifications` collection is breached, an attacker cannot recover the OTP or the original password from the stored hashes.

**Why not just store the OTP in plaintext?** The OTP is short (6 digits, only 900,000 combinations). Plaintext storage would allow anyone with DB read access to trivially brute-force it.

---

## 7. AI Style Analysis Pipeline — Deep Dive

**File:** `backend/controllers/styleAnalysisController.js`

The pipeline runs entirely server-side. The frontend sends a base64-encoded JPEG (max 1024px).

### Stage 0 — Image preprocessing (Sharp)
- Resize to max 1024px on longest side (keeps API payload manageable)
- Histogram normalization — compensates for yellow indoor light or screen glow, which are the biggest sources of undertone misclassification
- Unsharp mask (sigma 0.8) — helps the model resolve facial features
- Compute brightness + standard deviation. If `very_dark` AND `low_contrast` → reject before any API call

### Stage 1 — Observation pass (LLaMA 4 Scout)
- Asks the model to describe the face in structured natural language: skin tone appearance, hair color, face proportions, visible features
- Low temperature (0.2) keeps output consistent across runs
- `validateFaceObservations()` checks whether the description actually describes a human face. Non-face images (products, objects, covered faces) are rejected here with a user-friendly message.

### Stage 2A + 2B — Classification (LLaMA 4 Maverick, run in parallel)
Both calls run concurrently with `Promise.allSettled`:
- **2A — Face geometry:** Given Stage 1 observations, classify face shape (Oval, Round, Square, Heart, Diamond, Oblong) with a confidence score and 5 feature measurements (jaw width, forehead width, face length ratio, cheekbone width, chin shape)
- **2B — Color analysis:** Classify skin undertone (Warm/Cool/Neutral) with numeric scores for each (not just a label), skin depth on a 7-point scale, hair color category, and contrast level (Low/Medium/High)

**Why parallel?** Running 2A and 2B concurrently reduces total latency by ~40–50% compared to sequential calls. They are independent tasks that don't need each other's output.

**Why Maverick here specifically?** Maverick is the more capable (and more expensive) model. It's used only for the high-stakes classification pass. Scout is used for everything else.

**Retry logic:** Up to 2 retries per classification attempt. `isGenericResponse()` detects when the model returned placeholder/evasive answers (e.g., all confidence scores exactly 0.5, or undertone labeled "Medium" which isn't a valid value) and triggers an automatic retry without telling the user.

### Stage 3 — Undertone normalization + seasonal subtype

**`normalizeUndertone(undertone, lightingQuality)`**  
The model returns numeric scores for Warm, Cool, and Neutral (e.g., `{ warm: 6.2, cool: 4.1, neutral: 5.8 }`). Raw highest-score wins would collapse borderline results to Warm or Cool when they're genuinely uncertain. This function applies calibrated thresholds:
- If spread between top and second score is < 1.25 AND confidence is low AND Neutral is close to the top → return `'Neutral'`
- If the image had poor lighting (`lightingQuality !== 'GOOD'`) AND the result is Warm AND spread < 1 → collapse to `'Neutral'` (yellow light biases the model toward Warm)
- Strong evidence (top score ≥ 7, spread ≥ 1) → trust it unconditionally

**`derivePersonalSubtype(undertone, skinDepth, hairCategory, contrastLevel)`**  
Maps the four attributes to one of 10 seasonal subtypes:
- Warm + light skin or low contrast → **Light Spring**
- Warm + deep skin or high contrast → **Deep Autumn**
- Warm + medium → **Warm Autumn**
- Cool + light → **Light Summer**
- Cool + deep or high contrast → **Deep Winter**
- Cool + low contrast → **Cool Summer**
- Cool + medium → **Cool Winter**
- Neutral + deep or high contrast → **Deep Neutral**
- Neutral + light or low contrast → **Soft Summer**
- Neutral + medium → **Soft Spring**

Each subtype maps to a distinct curated palette in `styleRecommendations.js` — not a reordering of the same 12 colors.

### Stage 4 — Style personalization (LLaMA 4 Scout)
Generates palette summary text, makeup direction, and outfit colors as JSON. `mergeStylingContent()` validates the AI output: if it returns fewer than 6 valid hex-coded colors for the main palette, it falls back to the curated palette. The user always gets a complete result.

### `scoreColorForProfile(color, profile)`
Scores each candidate color numerically based on:
- **Skin depth:** light profiles score lighter colors higher (higher luminance), deep profiles score darker colors higher
- **Contrast level:** high-contrast profiles score statement/jewel-tone categories higher; low-contrast profiles score soft neutrals and earth tones higher
- **Season:** Spring and Summer subtypes get a boost for higher-luminance colors; Autumn and Winter for lower
- **Undertone magnitude:** if the undertone is strong (big spread between scores), reward undertone-specific saturated colors; if soft/borderline, reward neutrals

### `sanitizeUndertoneEvidence(undertone, observations)`
The model sometimes cites wrist vein color as undertone evidence even when the wrist isn't in the photo (hallucination). This function checks the Stage 1 observation text for explicit vein visibility using regex patterns. If veins aren't confirmed visible, any sentence referencing veins is stripped from the undertone details and indicators before returning the result to the user.

---

## 8. Virtual Try-On — Deep Dive

**File:** `frontend/src/components/tryon/useTryOn.jsx`

### How MediaPipe FaceMesh works
FaceMesh is a machine learning model that detects 468 facial landmark points in real time. It runs entirely in the browser via WebAssembly — no video frames are ever sent to a server. The app uses only 3 of the 468 landmarks:
- **152** — chin tip (vertical anchor)
- **234** — right jaw edge
- **454** — left jaw edge

### The coordinate mirroring problem
FaceMesh returns coordinates in the **original camera space** (un-flipped). But the canvas renders a **mirrored video feed** (selfie/mirror mode, `ctx.scale(-1, 1)`). Without correction, the necklace drifts to the wrong side of the face when the user turns their head.

**Fix:** Apply `(1 - x) * canvasWidth` to every landmark's x-coordinate before using it for drawing. This mirrors the landmark positions to match the flipped canvas.

### Exponential Moving Average (EMA) smoothing

```js
const smooth = (prevRef, current, alpha = 0.6) => {
  prevRef.current = {
    x: alpha * prevRef.current.x + (1 - alpha) * current.x,
    y: alpha * prevRef.current.y + (1 - alpha) * current.y,
  }
  return prevRef.current
}
```

Each frame, the new landmark position is blended with the previous smoothed position. Alpha = 0.6 means 60% previous, 40% new.
- **Higher alpha (e.g., 0.8):** smoother but laggy — necklace visibly trails behind head movement
- **Lower alpha (e.g., 0.4):** more responsive but jittery
- **0.6** was chosen empirically as the best balance

### Necklace geometry calculation
```
jawWidth = Euclidean distance between landmarks 234 and 454
tiltAngle = atan2(dy, dx) of the jaw vector
necklaceWidth = jawWidth × widthRatio × perItemScale × globalScale
necklaceCenterX = midpoint of jaw
necklaceCenterY = chinY + yOffset × canvasHeight + necklaceHeight/2
```
The necklace image is then drawn with `ctx.translate` + `ctx.rotate(tiltAngle)` so it follows natural head tilts.

### Why useRef for frame-critical values?
React's `setState` triggers a full component re-render. At 30 fps, calling setState every frame would re-render the entire component tree 30 times per second, causing heavy CPU load. Instead:
- `yOffsetRef`, `scaleRef`, `opacityRef`, `activeIdRef`, `catalogueRef` are all `useRef` — they're read directly inside the canvas callback without triggering re-renders
- React `useState` is updated in parallel only for the UI slider display
- This is a standard React performance pattern for animation loops

### Per-necklace calibration persistence
When the user adjusts scale or yOffset for a necklace, the value is written directly into `catalogueRef.current` (the in-memory array item). When switching necklaces, `setActiveId()` reads `item.yOffset` and `item.scale` from the array and restores them. For DB-backed necklaces these defaults come from `tryOnSettings` in MongoDB.

---

## 9. Wishlist & Account Deletion Cascade

### Wishlist
Stored as `User.wishlist = [ObjectId, ObjectId, ...]` — references to necklace documents.  
`getWishlist` calls `.populate('wishlist', 'name image price ...')` to resolve the IDs into full objects in a single query.

### Account deletion cascade (`DELETE /api/auth/me`)
Order of operations:
1. Verify password (prevent accidental deletion)
2. Find all custom necklaces where `uploadedBy === userId`
3. Pull those necklace IDs from every other user's wishlist (`User.updateMany`)
4. Delete the necklace documents
5. Delete the image files from disk (`fs.unlink`)
6. Delete any pending `EmailVerification` records for this email
7. Delete the `User` document

This order matters — if you deleted the user first, you'd lose the `uploadedBy` reference needed to find their necklaces.

---

## 10. Admin Panel

- Admin role is assigned manually: `node backend/makeAdmin.js` (prompts for email)
- `adminOnly` middleware in `middleware/auth.js` checks `req.user.role === 'admin'`
- Admin can upload catalogue necklaces via `POST /api/necklaces/admin-upload` (Multer processes the image, saves to `uploads/`, creates a Necklace document with `isCustom: false`)
- Admin can delete any necklace; regular users can only delete their own custom uploads
- The admin page (`/admin`) is client-side only — the role check happens server-side on every request, so hiding the page from regular users in the UI is just UX, not security

---

## 11. Likely Professor Questions

**Q: Why MongoDB instead of a relational database like PostgreSQL?**  
The AI analysis result is a deeply nested JSON object whose shape evolved throughout development (new fields were added iteratively). With a relational DB, each schema change would require a migration. MongoDB's `Mixed` type let the shape change freely while field validation was handled at the API layer in `responseValidator.js`.

**Q: Why store the wishlist and AI analysis on the User document instead of separate collections?**  
Both are always read together with the user's account, they're private to one user, and they're not shared or queried independently. Embedding them avoids unnecessary joins and keeps queries simple. The trade-off is that the user document grows with each save — acceptable here because the analysis is one object per user, not an unbounded list.

**Q: How does the system handle an incorrect undertone result due to lighting?**  
At two levels. First, Sharp's histogram normalization at preprocessing reduces luminance bias before the image reaches the model. Second, `normalizeUndertone()` applies conservative thresholds — if the model's scores are close (small spread between Warm and Cool), and lighting quality is flagged as poor, the function collapses the result to Neutral rather than committing to a direction without sufficient evidence.

**Q: Why run two classification passes in parallel instead of one combined pass?**  
Asking one model call to classify face geometry AND color simultaneously forces the model to split its attention. Splitting into two focused calls — each with its own dedicated context window and temperature setting — produces more consistent results. Running them concurrently means the user doesn't pay a latency cost for the split.

**Q: What happens if the Groq API fails mid-pipeline?**  
The controller has a three-level fallback chain: first retry the failing sub-pass up to 2 times; if both classification sub-passes fail, attempt a combined single Scout pass; if that fails, return a 500 with a user-facing retry prompt. The personalization pass (Stage 4) is wrapped in its own try/catch — if it fails, the curated palette is used silently and the user still gets a complete result.

**Q: Why does the try-on use only 3 of the 468 FaceMesh landmarks?**  
The necklace placement requires only jaw width (for scaling), jaw midpoint (for horizontal centering), and chin position (for vertical anchoring). Using all 468 points would add complexity without improving accuracy for this specific task. Fewer landmarks also means the geometric calculation is deterministic and computationally cheap.

**Q: How does the OTP system prevent brute-forcing?**  
After 5 failed attempts the `EmailVerification` record is deleted, forcing the user to request a new OTP. Combined with the 10-minute TTL enforced by a MongoDB TTL index, an attacker has at most 5 attempts per 10-minute window against 900,000 possible codes — a negligible attack surface.

**Q: Why is the Groq API key kept on the server and never sent to the browser?**  
If the key were sent to the browser (e.g., as an environment variable prefixed with `VITE_`), it would be visible in the browser's network inspector and JavaScript bundle. Anyone could extract it and use it to make API calls at the project owner's expense. Keeping it server-side means all API calls go through the Express backend, which also allows centralized rate limiting and retry logic.

**Q: What is the purpose of `optionalProtect` middleware?**  
Style analysis is available to both guests and logged-in users. `optionalProtect` sets `req.user` if a valid token is present, or `null` if not — without rejecting the request. The controller then uses `req.user` to decide whether to auto-save the result to MongoDB (logged-in) or just return it (guest).

**Q: Why use Canvas API instead of a WebGL or 3D framework for try-on?**  
The try-on is a 2D image overlay — the necklace is a flat PNG drawn on a 2D canvas. A 3D framework (Three.js, Babylon.js) would add significant bundle size and complexity for no visual benefit in a 2D use case. Canvas is natively supported in all browsers and integrates with React via refs without additional dependencies.

**Q: What does `select: false` do on the password field in the User schema?**  
It tells Mongoose to exclude the `password` field from all queries by default, including `User.findById()`. To access it (e.g., during login), you must explicitly opt in with `.select('+password')`. This prevents the password hash from accidentally being returned in API responses.

---

## 12. Known Limitations (be honest if asked)

- **No automated test suite** — all validation was manual
- **No formal user study** — AI output quality assessed by developer testing only  
- **Local file storage** — uploaded images live on the server's filesystem; lost on redeployment
- **Groq API dependency** — style analysis is unavailable offline or during API outages
- **Single-image analysis** — results are sensitive to the specific photo's lighting, angle, and expression
