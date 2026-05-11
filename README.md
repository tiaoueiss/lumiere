# Lumiere

An AI-powered jewelry styling and virtual try-on web application. Users upload a photo to receive a personalised style analysis covering skin undertone, face shape, skin depth, hair colour, and seasonal colour subtype, alongside a virtual try-on feature that overlays necklaces in real time through the webcam.

---

## Features

- AI style analysis — undertone, face shape, skin depth, contrast level, seasonal subtype, colour palette, jewelry metal recommendation, makeup direction, and hair colour suggestions
- Virtual try-on — real-time necklace overlay using MediaPipe FaceMesh and the Canvas API
- Necklace catalogue with category, style, and metal filtering
- Wishlist management per user account
- Custom necklace upload for try-on
- Saved style profile stored to account, accessible across devices
- Follow-up chat powered by AI, contextualised to the user's analysis results
- Admin panel for catalogue management
- OTP-based email verification on signup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| AI inference | Groq API — LLaMA 4 Scout and Maverick |
| Image preprocessing | Sharp |
| Face tracking | MediaPipe FaceMesh (in-browser) |
| Authentication | JWT, bcrypt, Node crypto |
| Email | Nodemailer via Gmail SMTP |

---

## Prerequisites

- Node.js v18 or higher
- MongoDB running locally on port 27017
- A Groq API key (free tier available at console.groq.com)
- A Gmail account with an App Password for SMTP

---

## Setup

### 1. Clone the repository

```
git clone <repo-url>
cd lumiere
```

### 2. Install backend dependencies

```
cd backend
npm install
```

### 3. Install frontend dependencies

```
cd frontend
npm install
```

### 4. Configure environment variables

Create `backend/.env` with the following:

```
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/lumiere

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=5242880

GROQ_API_KEY=your_groq_api_key_here

CLIENT_URL=https://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Your Name <your_gmail@gmail.com>"
EMAIL_FALLBACK_TO_CONSOLE=false
```

> For SMTP_PASS, use a Gmail App Password, not your regular Gmail password. Generate one at myaccount.google.com/apppasswords.

### 5. Generate HTTPS certificates for the frontend

The frontend runs on HTTPS because webcam access requires a secure context. Generate a self-signed certificate:

```
cd frontend
mkdir cert
cd cert
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 6. Seed the database

From the `backend` directory:

```
node seed.js
```

This copies necklace images from the frontend assets into `backend/uploads/necklaces/` and inserts the catalogue into MongoDB.

### 7. Create an admin account (optional)

Register a user account through the app first, then run:

```
cd backend
node makeAdmin.js
```

Enter the email address of the account to promote. That user will have access to the admin panel at `/admin`.

---

## Running the App

Start MongoDB if it is not already running:

```
net start MongoDB
```

Start the backend (from the `backend` directory):

```
npm run dev
```

Start the frontend (from the `frontend` directory):

```
npm run dev
```

The app will be available at `https://localhost:5173`.

The browser will show a certificate warning on first load because the HTTPS certificate is self-signed. Click Advanced and proceed to localhost.

---

## Project Structure

```
lumiere/
  backend/
    config/         Database connection
    controllers/    Route handlers (auth, necklaces, wishlist, style analysis)
    data/           Curated style recommendations and palettes
    middleware/     Auth (protect, optionalProtect, adminOnly), file upload
    models/         Mongoose schemas (User, Necklace, EmailVerification)
    prompts/        AI prompt strings
    routes/         Express route definitions
    services/       Groq API client, image processor, email service
    utils/          AI response validator
    uploads/        Uploaded necklace images (generated at runtime)
    seed.js         Database seeder
    makeAdmin.js    Admin role promotion script
    server.js       Entry point
  frontend/
    src/
      api.js                Central API module
      App.jsx               Routes and layout
      components/           Reusable UI components
        layout/             Navbar, Footer
        style/analysis/     Style result cards and analysis UI
        tryon/              Virtual try-on canvas, controls, upload
        auth/               Auth modal
      context/              AuthContext (global auth state)
      data/                 Static type definitions
      pages/                Page components
      utils/                Frontend helpers
    cert/                   HTTPS certificates (not committed)
  docs/
    PRESENTATION_GUIDE.md   Startup guide and professor Q&A
    AI_ANALYSIS.md          Full AI pipeline documentation
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup/request-otp | None | Send OTP to email |
| POST | /api/auth/signup/verify | None | Verify OTP and create account |
| POST | /api/auth/login | None | Login and receive JWT |
| GET | /api/auth/me | Required | Get current user profile |
| DELETE | /api/auth/me | Required | Delete account |
| GET | /api/necklaces | None | Get catalogue with optional filters |
| POST | /api/necklaces/admin-upload | Admin | Upload new catalogue necklace |
| POST | /api/necklaces/upload | Required | Upload custom necklace |
| GET | /api/necklaces/my-uploads | Required | Get user's custom uploads |
| DELETE | /api/necklaces/:id | Required | Delete necklace |
| GET | /api/wishlist | Required | Get wishlist |
| POST | /api/wishlist/:id | Required | Add to wishlist |
| DELETE | /api/wishlist/:id | Required | Remove from wishlist |
| POST | /api/style-analysis | None | Run AI style analysis |
| POST | /api/style-analysis/follow-up | None | Follow-up chat |
| POST | /api/style-analysis/save | Required | Save analysis to profile |
| GET | /api/style-analysis/saved | Required | Get saved analysis |
| DELETE | /api/style-analysis/saved | Required | Clear saved analysis |

---

## Notes

- The style analysis feature requires an internet connection and a valid Groq API key.
- Uploaded files are stored on the local filesystem in `backend/uploads/`. They will not persist across server redeployments.
- The `.env` file and `cert/` directory are excluded from version control and must be created manually on each machine.
