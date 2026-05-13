# Diagrams

These diagrams describe the current Lumiere React frontend, Express backend, and MongoDB data model.

## Use Case Diagram

```mermaid
flowchart LR
  visitor["Visitor"]
  user["Registered User"]
  admin["Admin"]
  ai["Groq AI Service"]
  email["Email Service"]

  visitor --> browse["Browse necklace catalogue"]
  visitor --> tryon["Use virtual necklace try-on"]
  visitor --> analyze["Analyze style from selfie"]
  visitor --> signup["Sign up with OTP"]
  visitor --> login["Log in"]

  signup --> email
  analyze --> ai

  user --> browse
  user --> tryon
  user --> analyze
  user --> followup["Ask style follow-up questions"]
  user --> saveAnalysis["Save style analysis to profile"]
  user --> viewProfile["View saved style profile"]
  user --> deleteAnalysis["Delete saved style analysis"]
  user --> wishlist["Manage wishlist"]
  user --> customUpload["Upload custom necklace for try-on"]
  user --> deleteCustom["Delete own custom necklace"]
  user --> deleteAccount["Delete account"]

  followup --> ai

  admin --> browse
  admin --> tryon
  admin --> analyze
  admin --> uploadCatalogue["Upload necklace to catalogue"]
  admin --> deleteCatalogue["Delete any catalogue necklace"]
```

## E-R Diagram

```mermaid
erDiagram
  USER {
    objectid _id PK
    string name
    string email UK
    string password
    string role "enum: user, admin"
    objectid[] wishlist FK
    object aiAnalysis
    date aiAnalysisSavedAt
    date createdAt
    date updatedAt
  }

  NECKLACE {
    objectid _id PK
    string name
    string description
    number price
    string currency
    string category "enum"
    string style "enum"
    string metal "enum"
    string image
    string tryOnImage
    number tryOnScale
    number tryOnOffsetY
    number tryOnWidthRatio
    boolean isCustom
    objectid uploadedBy FK
    boolean inStock
    boolean featured
    string[] tags
    date createdAt
    date updatedAt
  }

  EMAIL_VERIFICATION {
    objectid _id PK
    string name
    string email UK
    string passwordHash
    string otpHash
    number attempts
    date expiresAt
    date createdAt
    date updatedAt
  }

  USER }o--o{ NECKLACE : wishlist
  USER ||--o{ NECKLACE : uploads_custom
```

## Class Diagram

```mermaid
classDiagram
  class User {
    ObjectId _id
    String name
    String email
    String password
    ObjectId[] wishlist
    String role
    Mixed aiAnalysis
    Date aiAnalysisSavedAt
    Date createdAt
    Date updatedAt
    comparePassword(candidatePassword)
  }

  class Necklace {
    ObjectId _id
    String name
    String description
    Number price
    String currency
    String category
    String style
    String metal
    String image
    String tryOnImage
    TryOnSettings tryOnSettings
    Boolean isCustom
    ObjectId uploadedBy
    Boolean inStock
    Boolean featured
    String[] tags
    Date createdAt
    Date updatedAt
  }

  class TryOnSettings {
    Number scale
    Number offsetY
    Number widthRatio
  }

  class EmailVerification {
    ObjectId _id
    String name
    String email
    String passwordHash
    String otpHash
    Number attempts
    Date expiresAt
    Date createdAt
    Date updatedAt
  }

  class AuthController {
    requestSignupOtp(req, res)
    verifySignupOtp(req, res)
    login(req, res)
    getMe(req, res)
    deleteAccount(req, res)
  }

  class NecklaceController {
    getAllNecklaces(req, res)
    getNecklaceById(req, res)
    adminCreateNecklace(req, res)
    uploadCustomNecklace(req, res)
    getMyUploads(req, res)
    deleteNecklace(req, res)
  }

  class WishlistController {
    getWishlist(req, res)
    addToWishlist(req, res)
    removeFromWishlist(req, res)
  }

  class StyleAnalysisController {
    styleAnalysisHandler(req, res)
    normalizeUndertone()
    derivePersonalSubtype()
    buildPersonalizedInfo()
    sanitizeUndertoneEvidence()
    scoreColorForProfile()
    mergeStylingContent()
  }

  class ResponseValidator {
    parseClassification()
    parsePersonalization()
    isGenericResponse()
    validateFaceObservations()
  }

  class GroqClient {
    getObservations()
    getClassification()
    getStylePersonalization()
  }

  class StyleFollowUpController {
    styleFollowUpHandler(req, res)
    isStyleRelatedQuestion()
    hasUsableAnalysis()
  }

  class StyleFollowUpClient {
    askStyleFollowUp()
    compactAnalysis()
    compactHistory()
    stripMarkdown()
  }

  class ImageProcessor {
    preprocessImage()
  }

  class AuthMiddleware {
    protect(req, res, next)
    optionalProtect(req, res, next)
    adminOnly(req, res, next)
  }

  User "1" --> "0..*" Necklace : wishlist
  User "1" --> "0..*" Necklace : uploads custom
  Necklace *-- TryOnSettings
  AuthController --> User
  AuthController --> EmailVerification
  AuthController --> Necklace
  NecklaceController --> Necklace
  NecklaceController --> User
  WishlistController --> User
  WishlistController --> Necklace
  StyleAnalysisController --> GroqClient
  StyleAnalysisController --> ResponseValidator
  StyleAnalysisController --> ImageProcessor
  StyleAnalysisController --> User : saves result
  StyleFollowUpController --> StyleFollowUpClient
  StyleFollowUpClient --> GroqClient
  AuthMiddleware --> User
```

## AI Style Analysis Sequence

```mermaid
sequenceDiagram
  actor U as User
  participant FE as React Frontend
  participant API as Express API
  participant Img as Sharp Image Processor
  participant Val as Response Validator
  participant AI as Groq AI Service
  participant Recs as Style Recommendations
  participant DB as MongoDB

  U->>FE: Upload selfie
  FE->>FE: Resize to 1024px via Canvas API
  FE->>API: POST /api/style-analysis (base64 image)
  note over API: optionalProtect sets req.user if JWT present

  API->>Img: preprocessImage()
  note over Img: Resize, normalize lighting, unsharp mask, quality flags
  Img-->>API: Processed image + quality flags

  alt Very dark and low contrast
    API-->>FE: 400 image too dark
  else Image usable
    API->>AI: Stage 1 — Observation pass (Scout, temp 0.2)
    AI-->>API: Natural language face description
    API->>Val: validateFaceObservations()

    alt No face detected
      API-->>FE: 400 no face detected
    else Face confirmed
      par Stage 2A — Face geometry (Maverick, temp 0.15)
        API->>AI: FACE_GEOMETRY_PROMPT + observations
        AI-->>API: Face shape, confidence, feature measurements
      and Stage 2B — Color analysis (Maverick, temp 0.15)
        API->>AI: COLOR_ANALYSIS_PROMPT + observations
        AI-->>API: Undertone scores, skin depth, hair, contrast
      end

      API->>Val: parseClassification()
      API->>Val: isGenericResponse()

      alt Generic or invalid response
        note over API: Retry up to 2 times
        API->>AI: Retry classification
        AI-->>API: Revised classification
      end

      API->>API: normalizeUndertone()
      API->>API: derivePersonalSubtype()
      API->>API: sanitizeUndertoneEvidence()
      API->>Recs: Look up UNDERTONE_INFO + SUBTYPE_PALETTES + FACE_SHAPE_RECS + DEPTH_MAKEUP
      Recs-->>API: Curated palette, metal, makeup, hair, face shape recs
      API->>API: buildPersonalizedInfo() + scoreColorForProfile()

      API->>AI: Stage 4 — Style personalization (Scout, temp 0.7)
      AI-->>API: Personalized palette and summary JSON
      API->>Val: parsePersonalization()
      API->>API: mergeStylingContent() — AI palette if valid, else curated

      API-->>FE: Final style analysis JSON
      FE-->>U: Display results in tabbed cards

      opt User saves result
        FE->>API: POST /api/style-analysis/save
        API->>DB: User.aiAnalysis and aiAnalysisSavedAt updated
        API-->>FE: success
      end
    end
  end
```

## Data Flow Diagram

```mermaid
flowchart LR
  userNode["User"]
  frontend["React Frontend"]
  api["Express API"]
  authCtrl["Auth Controller"]
  necklaceCtrl["Necklace Controller"]
  wishlistCtrl["Wishlist Controller"]
  analysisCtrl["Style Analysis Controller"]
  followupCtrl["Follow-up Controller"]
  imgProc["Sharp Image Processor"]
  upload["Multer Upload Middleware"]
  db[("MongoDB")]
  files[("backend/uploads")]
  groq["Groq AI Service"]
  emailSvc["Nodemailer / SMTP"]

  userNode --> frontend
  frontend -->|"REST requests"| api

  api --> authCtrl
  api --> necklaceCtrl
  api --> wishlistCtrl
  api --> analysisCtrl
  api --> followupCtrl

  authCtrl -->|"OTP records and users"| db
  authCtrl -->|"Send OTP"| emailSvc
  emailSvc --> userNode

  necklaceCtrl -->|"Catalogue and custom uploads"| db
  necklaceCtrl --> upload
  upload --> files

  wishlistCtrl -->|"User wishlist refs"| db

  analysisCtrl --> imgProc
  imgProc -->|"Preprocessed image"| analysisCtrl
  analysisCtrl -->|"Observation, classification, personalization prompts"| groq
  groq -->|"AI responses"| analysisCtrl
  analysisCtrl -->|"Saved analysis"| db

  followupCtrl -->|"Compacted analysis context + question"| groq
  groq -->|"Follow-up answer"| followupCtrl

  api -->|"JSON responses"| frontend
  frontend --> userNode
```

## Activity Diagram

```mermaid
flowchart TD
  startNode((Start)) --> openApp["Open Lumiere"]
  openApp --> choose{"Choose feature"}

  choose --> catalogue["Browse catalogue"]
  catalogue --> wishlistChoice{"Save necklace?"}
  wishlistChoice -->|No| endNode((End))
  wishlistChoice -->|Yes| auth1{"Logged in?"}
  auth1 -->|No| authWish["Sign up with OTP or log in"]
  auth1 -->|Yes| saveWish["Add or remove wishlist item"]
  authWish --> saveWish --> endNode

  choose --> tryon["Open virtual try-on"]
  tryon --> selectNecklace["Select catalogue or custom necklace"]
  selectNecklace --> camera["Start webcam"]
  camera --> adjust["Adjust scale, offset, opacity with sliders"]
  adjust --> previewTryon["Preview necklace overlay on live feed"] --> endNode

  choose --> customUpload["Upload custom necklace"]
  customUpload --> auth2{"Logged in?"}
  auth2 -->|No| tempUpload["Temporary blob URL preview in browser"]
  auth2 -->|Yes| persistUpload["POST to backend, save Necklace document"]
  tempUpload --> endNode
  persistUpload --> endNode

  choose --> runStyle["Run style analysis"]
  runStyle --> selfie["Upload selfie or webcam capture"]
  selfie --> analyze["POST /api/style-analysis"]
  analyze --> imgValid{"Valid image and face?"}
  imgValid -->|No| fix["Show correction message"] --> selfie
  imgValid -->|Yes| showResults["Show style results in tabbed cards"]
  showResults --> followupChoice{"Ask follow-up question?"}
  followupChoice -->|Yes| chatAnswer["Return style answer via follow-up chat"] --> saveChoice{"Save result?"}
  followupChoice -->|No| saveChoice
  saveChoice -->|No| endNode
  saveChoice -->|Yes| auth3{"Logged in?"}
  auth3 -->|No| authSave["Sign up with OTP or log in"]
  auth3 -->|Yes| saveProfile["Save to User.aiAnalysis in MongoDB"] --> endNode
  authSave --> saveProfile

  choose --> myStyle["View saved style profile"]
  myStyle --> auth4{"Logged in?"}
  auth4 -->|No| endNode
  auth4 -->|Yes| loadProfile["GET /api/style-analysis/saved"]
  loadProfile --> profileFound{"Profile found?"}
  profileFound -->|No| emptyState["Show empty state"] --> endNode
  profileFound -->|Yes| displayProfile["Display saved results"] --> endNode

  choose --> adminPanel["Open admin panel"]
  adminPanel --> roleCheck{"role is admin?"}
  roleCheck -->|No| endNode
  roleCheck -->|Yes| manageAction{"Choose action"}
  manageAction -->|Upload| addNecklace["POST /api/necklaces/admin-upload"]
  manageAction -->|Delete| removeNecklace["DELETE /api/necklaces/:id"]
  addNecklace --> endNode
  removeNecklace --> endNode
```

## Database Implementation Notes

| Collection | Model | Purpose |
|---|---|---|
| `users` | `User` | Accounts, hashed passwords, role, wishlist references, and saved AI analysis |
| `necklaces` | `Necklace` | Public catalogue necklaces and user custom uploads in one collection |
| `emailverifications` | `EmailVerification` | Temporary OTP signup records, auto-deleted by TTL index after 10 minutes |

- `User.role` is either `'user'` (default) or `'admin'`. Admin role is assigned via `node backend/makeAdmin.js`.
- `User.wishlist` stores an array of `ObjectId` references to `Necklace` documents.
- `User.aiAnalysis` is `Mixed` type — stores the full AI result object without a rigid schema.
- Custom uploads use `isCustom: true` and `uploadedBy` (ObjectId ref to the uploader). Public catalogue records use `isCustom: false` and no `uploadedBy`.
- `Necklace.tryOnSettings` embeds `scale`, `offsetY`, and `widthRatio` — the single source of truth for try-on rendering calibration.
- Uploaded image files are stored in `backend/uploads/`. MongoDB stores only the URL path string.
- `EmailVerification` has no foreign key to `User`. It is a standalone temporary document keyed by email. On successful OTP verification, a new `User` document is created and the `EmailVerification` record is immediately deleted.
