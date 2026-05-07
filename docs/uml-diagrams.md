# UML Modeling Diagrams

These diagrams describe the Lumiere jewelry styling application based on the current React frontend and Express/MongoDB backend.

## Use Case Diagram

```mermaid
flowchart LR
  visitor["Visitor"]
  user["Registered User"]
  admin["Admin"]
  ai["AI Style Analysis Service"]
  email["Email Service"]

  visitor --> browse["Browse necklace catalogue"]
  visitor --> filter["Filter necklaces by category, style, metal, stock, or featured"]
  visitor --> tryon["Use virtual necklace try-on"]
  visitor --> analyze["Analyze style from selfie"]
  visitor --> signupOtp["Request signup verification code"]
  visitor --> verifySignup["Verify OTP and create account"]
  visitor --> login["Log in"]

  signupOtp --> email
  analyze --> ai

  user --> browse
  user --> tryon
  user --> analyze
  user --> followup["Ask style follow-up questions"]
  user --> saveAnalysis["Save AI style analysis"]
  user --> viewSaved["View saved style analysis"]
  user --> deleteSaved["Delete saved style analysis"]
  user --> wishlistAdd["Add necklace to wishlist"]
  user --> wishlistView["View wishlist"]
  user --> wishlistRemove["Remove necklace from wishlist"]
  user --> uploadCustom["Upload custom necklace"]
  user --> viewUploads["View custom necklace uploads"]
  user --> deleteCustom["Delete own custom necklace"]
  user --> viewProfile["View profile"]
  user --> deleteAccount["Delete account"]

  followup --> ai

  admin --> createCatalogue["Create catalogue necklace"]
```

# Data Modeling

## E-R Diagram

```mermaid
erDiagram
  USER {
    objectid _id PK
    string name
    string email UK
    string password
    boolean isAdmin
    object aiAnalysis
    date aiAnalysisSavedAt
    date createdAt
    date updatedAt
  }

  STYLE_PROFILE {
    string preferredStyles
    string preferredMetals
    string occasions
    number budgetMin
    number budgetMax
  }

  NECKLACE {
    objectid _id PK
    string name
    string description
    number price
    string currency
    string category
    string style
    string metal
    string image
    string tryOnImage
    number tryOnScale
    number tryOnOffsetY
    boolean isCustom
    objectid uploadedBy FK
    boolean inStock
    boolean featured
    string tags
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

  USER ||--|| STYLE_PROFILE : has
  USER }o--o{ NECKLACE : wishlist
  USER ||--o{ NECKLACE : uploads
  USER ||--o| EMAIL_VERIFICATION : verifies_signup_with
```

## Data Flow Diagram

```mermaid
flowchart LR
  user[User]
  frontend[React Frontend]
  api[Express API]
  auth[Authentication Controller]
  necklace[Necklace Controller]
  wishlist[Wishlist Controller]
  style[Style Analysis Controller]
  upload[Upload Middleware]
  db[(MongoDB Database)]
  files[(Uploads Folder)]
  ai[Groq AI Service]
  email[Email Service]

  user -->|Signup, login, browse, try-on, style requests| frontend
  frontend -->|HTTP requests| api

  api --> auth
  api --> necklace
  api --> wishlist
  api --> style

  auth -->|Create pending OTP, create user, read profile| db
  auth -->|Send verification code| email
  email -->|OTP email| user

  necklace -->|Read catalogue and custom necklaces| db
  necklace -->|Upload custom necklace image| upload
  upload -->|Store image file| files
  upload -->|File path / filename| necklace
  necklace -->|Save uploaded necklace metadata| db

  wishlist -->|Read / update user wishlist| db

  style -->|Preprocessed selfie and prompts| ai
  ai -->|Observations, classification, personalization| style
  style -->|Save / read / delete AI analysis| db

  api -->|JSON responses| frontend
  frontend -->|Rendered pages and results| user
```

## Database Implementation

The project uses MongoDB with Mongoose in the Express backend. The connection is created in `backend/config/db.js` and initialized from `backend/server.js` before the API routes are registered.

Main collections:

| Collection | Mongoose Model | Purpose |
|---|---|---|
| `users` | `User` | Stores registered users, hashed passwords, wishlist references, legacy style profile data, admin flag, and saved AI analysis results. |
| `necklaces` | `Necklace` | Stores catalogue necklaces and user-uploaded custom necklaces, including try-on image paths and display metadata. |
| `emailverifications` | `EmailVerification` | Temporarily stores signup OTP details until the user verifies their email. Expired records are removed through a TTL index. |

Important implementation details:

- User passwords are hashed with `bcryptjs` before saving.
- Authentication uses JWT tokens; protected routes use the `protect` middleware.
- `User.wishlist` stores an array of `ObjectId` references to `Necklace`.
- Custom necklaces are linked to their owner through `Necklace.uploadedBy`.
- Uploaded necklace files are saved in `backend/uploads`, while the database stores their URL paths.
- AI style analysis results are stored directly on the user document in `User.aiAnalysis`.
- The `Necklace` model defines indexes for category/style filtering, featured items, and uploaded necklaces.
- The `EmailVerification.expiresAt` field has a TTL index so pending signup records expire automatically.

## Class Diagram

```mermaid
classDiagram
  class User {
    ObjectId _id
    String name
    String email
    String password
    ObjectId[] wishlist
    StyleProfile styleProfile
    Boolean isAdmin
    Mixed aiAnalysis
    Date aiAnalysisSavedAt
    Date createdAt
    Date updatedAt
    comparePassword(candidatePassword)
  }

  class StyleProfile {
    String[] preferredStyles
    String[] preferredMetals
    String[] occasions
    Number budgetMin
    Number budgetMax
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
    preprocessImage()
    getObservations()
    getClassification()
    getStylePersonalization()
    buildPersonalizedInfo()
  }

  class StyleFollowUpController {
    styleFollowUpHandler(req, res)
    askStyleFollowUp()
  }

  class AuthMiddleware {
    protect(req, res, next)
    optionalProtect(req, res, next)
    adminOnly(req, res, next)
  }

  User "1" --> "0..*" Necklace : wishlist
  User "1" --> "0..*" Necklace : uploads custom
  User *-- StyleProfile
  Necklace *-- TryOnSettings
  AuthController --> User
  AuthController --> EmailVerification
  AuthController --> Necklace
  NecklaceController --> Necklace
  NecklaceController --> User
  WishlistController --> User
  WishlistController --> Necklace
  StyleAnalysisController --> User : saves optional result
  StyleFollowUpController --> StyleAnalysisController : uses analysis result
  AuthMiddleware --> User
```

## Sequence Diagram

This sequence shows the main AI style analysis workflow, including optional saving for authenticated users.

```mermaid
sequenceDiagram
  actor U as User
  participant FE as React Frontend
  participant API as Express API
  participant Auth as optionalProtect Middleware
  participant Img as Image Processor
  participant AI as Groq Vision / AI Service
  participant Val as Response Validator
  participant Rec as Recommendation Data
  participant DB as MongoDB

  U->>FE: Upload selfie for style analysis
  FE->>FE: Convert image to base64 and resize if needed
  FE->>API: POST /api/style-analysis
  API->>Auth: Attach user when JWT is valid
  Auth-->>API: Continue request
  API->>API: Validate base64 image format
  API->>Img: preprocessImage(rawBase64, mediaType)
  Img-->>API: Processed image and quality flags

  alt Photo too dark or low quality
    API-->>FE: 400 with improvement message
    FE-->>U: Show error and retry guidance
  else Photo acceptable
    API->>AI: getObservations(processed image)
    AI-->>API: Face and image observations
    API->>Val: validateFaceObservations(observations)

    alt No visible human face
      API-->>FE: 400 with selfie guidance
      FE-->>U: Show correction message
    else Face detected
      loop Up to 3 classification attempts
        API->>AI: getClassification(image, observations)
        AI-->>API: Raw classification JSON/text
        API->>Val: parseClassification(raw response)
      end

      API->>Rec: Load undertone, face-shape, palette, makeup, and hair recommendations
      API->>AI: getStylePersonalization(profile context)
      AI-->>API: Personalized styling content
      API->>Val: parsePersonalization(raw content)
      API-->>FE: Analysis result with undertone, face shape, metals, outfit colors, hair, and metadata
      FE-->>U: Display style results

      opt User chooses save analysis
        FE->>API: POST /api/style-analysis/save
        API->>DB: Update User.aiAnalysis and aiAnalysisSavedAt
        DB-->>API: Save complete
        API-->>FE: success true
      end
    end
  end
```

## Activity Diagram

```mermaid
flowchart TD
  start((Start))
  openApp["Open Lumiere web app"]
  chooseFeature{"Choose feature"}

  catalogue["Browse jewellery catalogue"]
  filters["Apply necklace filters"]
  necklaceDetails["View necklace details"]
  wishlistDecision{"Logged in and wants wishlist?"}
  authForWishlist{"User has account?"}
  addWishlist["Add or remove necklace from wishlist"]

  tryon["Open virtual try-on"]
  selectNecklace["Select catalogue or uploaded necklace"]
  uploadPhoto["Upload user photo"]
  adjustTryon["Adjust scale and vertical offset"]
  previewTryon["Preview necklace on photo"]

  style["Open Find Your Style"]
  uploadSelfie["Upload selfie"]
  analyze["Submit photo for AI analysis"]
  qualityCheck{"Image valid and face visible?"}
  showFix["Show photo improvement message"]
  showResults["Show undertone, face shape, metal, palette, makeup, and hair recommendations"]
  followUp{"Ask follow-up question?"}
  answerFollowUp["Return style-related answer"]
  saveChoice{"Save result?"}
  authForSave{"Logged in?"}
  saveResult["Save result to user profile"]

  authenticateWishlist["Sign up with OTP or log in"]
  authenticateSave["Sign up with OTP or log in"]

  customUpload{"Upload custom necklace?"}
  uploadNecklace["Upload PNG or WebP necklace image"]
  storeCustom["Store custom necklace in MongoDB and uploads folder"]

  end((End))

  start --> openApp --> chooseFeature

  chooseFeature --> catalogue
  catalogue --> filters --> necklaceDetails --> wishlistDecision
  wishlistDecision -->|Yes| authForWishlist
  wishlistDecision -->|No| end
  authForWishlist -->|No| authenticateWishlist
  authForWishlist -->|Yes| addWishlist
  authenticateWishlist --> addWishlist --> customUpload
  customUpload -->|Yes| uploadNecklace --> storeCustom --> end
  customUpload -->|No| end

  chooseFeature --> tryon
  tryon --> selectNecklace --> uploadPhoto --> adjustTryon --> previewTryon --> end

  chooseFeature --> style
  style --> uploadSelfie --> analyze --> qualityCheck
  qualityCheck -->|No| showFix --> uploadSelfie
  qualityCheck -->|Yes| showResults --> followUp
  followUp -->|Yes| answerFollowUp --> saveChoice
  followUp -->|No| saveChoice
  saveChoice -->|Yes| authForSave
  saveChoice -->|No| end
  authForSave -->|No| authenticateSave
  authForSave -->|Yes| saveResult
  authenticateSave --> saveResult --> end
```
