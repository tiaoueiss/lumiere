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
  user --> saveAnalysis["Save / view / delete style analysis"]
  user --> wishlist["Manage wishlist"]
  user --> customUpload["Upload / view / delete own custom necklaces"]
  user --> deleteAccount["Delete account"]

  followup --> ai

  admin --> browse
  admin --> tryon
  admin --> analyze
  admin --> manageCatalogue["Upload and delete public catalogue necklaces"]
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
  EMAIL_VERIFICATION }o--|| USER : creates_after_verification
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
    createNecklace(req, res)
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
    buildPersonalizedInfo()
    mergeStylingContent()
  }

  class GroqClient {
    getObservations()
    getClassification()
    getStylePersonalization()
  }

  class StyleFollowUpController {
    styleFollowUpHandler(req, res)
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
  StyleAnalysisController --> User : saves result
  StyleFollowUpController --> GroqClient
  AuthMiddleware --> User
```

## AI Style Analysis Sequence

```mermaid
sequenceDiagram
  actor U as User
  participant FE as React Frontend
  participant API as Express API
  participant Auth as optionalProtect
  participant Img as Image Processor
  participant AI as Groq AI Service
  participant Val as Response Validator
  participant DB as MongoDB

  U->>FE: Upload selfie
  FE->>FE: Convert image to base64
  FE->>API: POST /api/style-analysis
  API->>Auth: Attach user if JWT is valid
  API->>Img: preprocessImage()
  Img-->>API: Processed image + quality flags

  alt Invalid image or no face
    API-->>FE: 400 error message
  else Image usable
    API->>AI: Observation pass
    AI-->>API: Observations
    API->>Val: validateFaceObservations()
    API->>AI: Face geometry + color analysis
    AI-->>API: Classification JSON/text
    API->>Val: parseClassification()
    API->>API: Normalize and enrich with curated data
    API->>AI: Style personalization
    AI-->>API: Personalized styling content
    API-->>FE: Final style analysis result
    FE-->>U: Display results

    opt Save result
      FE->>API: POST /api/style-analysis/save
      API->>DB: Update User.aiAnalysis and aiAnalysisSavedAt
      API-->>FE: success
    end
  end
```

## Data Flow Diagram

```mermaid
flowchart LR
  user["User"]
  frontend["React Frontend"]
  api["Express API"]
  auth["Auth Controller"]
  necklace["Necklace Controller"]
  wishlist["Wishlist Controller"]
  styleanalysis["Style Analysis / Follow-up Controllers"]
  upload["Multer Upload Middleware"]
  db[("MongoDB")]
  files[("backend/uploads")]
  ai["Groq AI Service"]
  email["Nodemailer / SMTP"]

  user --> frontend
  frontend -->|"REST requests"| api

  api --> auth
  api --> necklace
  api --> wishlist
  api --> style

  auth -->|"OTP records and users"| db
  auth -->|"Send OTP"| email
  email --> user

  necklace -->|"Catalogue, custom uploads, admin changes"| db
  necklace --> upload
  upload --> files
  wishlist -->|"User wishlist refs"| db

  styleanalysis -->|"Preprocessed image / prompts"| ai
  ai -->|"Observations, classification, personalization"| style
  styleanalysis -->|"Saved analysis"| db

  api --> frontend
  frontend --> user
```

## Activity Diagram

```mermaid
flowchart TD
  start((Start)) --> openApp["Open Lumiere"]
  openApp --> choose{"Choose feature"}

  choose --> catalogue["Browse catalogue"]
  catalogue --> wishlist{"Save necklace?"}
  wishlist -->|No| endNode((End))
  wishlist -->|Yes| auth1{"Logged in?"}
  auth1 -->|No| authWish["Sign up with OTP or log in"]
  auth1 -->|Yes| saveWish["Add / remove wishlist item"]
  authWish --> saveWish --> endNode

  choose --> tryon["Open virtual try-on"]
  tryon --> select["Select catalogue or uploaded necklace"]
  select --> camera["Start webcam"]
  camera --> adjust["Adjust scale, offset, opacity"]
  adjust --> preview["Preview necklace on live camera"] --> endNode

  choose --> custom["Upload custom necklace"]
  custom --> auth2{"Logged in?"}
  auth2 -->|No| tempUpload["Temporary browser preview"]
  auth2 -->|Yes| persistUpload["Save image and Necklace document"]
  tempUpload --> endNode
  persistUpload --> endNode

  choose --> style["Run style analysis"]
  style --> selfie["Upload selfie"]
  selfie --> analyze["POST /api/style-analysis"]
  analyze --> valid{"Valid image and face?"}
  valid -->|No| fix["Show correction message"] --> selfie
  valid -->|Yes| results["Show style results"]
  results --> followup{"Ask follow-up?"}
  followup -->|Yes| answer["Return style answer"] --> save{"Save result?"}
  followup -->|No| save
  save -->|No| endNode
  save -->|Yes| auth3{"Logged in?"}
  auth3 -->|No| authSave["Sign up with OTP or log in"]
  auth3 -->|Yes| saveProfile["Save to User.aiAnalysis"] --> endNode
  authSave --> saveProfile

  choose --> admin["Open admin panel"]
  admin --> role{"role is admin?"}
  role -->|No| endNode
  role -->|Yes| manage["Upload or delete catalogue necklace"]
  manage --> endNode
```

## Database Implementation Notes

| Collection | Model | Purpose |
|---|---|---|
| `users` | `User` | Accounts, hashed passwords, role, wishlist references, and saved AI analysis |
| `necklaces` | `Necklace` | Public catalogue necklaces and user custom uploads |
| `emailverifications` | `EmailVerification` | Temporary OTP signup records with TTL expiry |

- `User.role` controls regular user versus admin access.
- `User.wishlist` stores `ObjectId` references to `Necklace`.
- Custom uploads are `Necklace` records with `isCustom: true` and `uploadedBy`.
- Public catalogue records use `isCustom: false`.
- Uploaded image files are stored in `backend/uploads`; MongoDB stores URL paths.
- Saved style analysis is stored on `User.aiAnalysis` with `aiAnalysisSavedAt`.
