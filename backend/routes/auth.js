// ===========================================
// routes/auth.js - Authentication Routes
// ===========================================
// Defines the URL endpoints for OTP signup, login, and profile.

const express = require("express");
const { body } = require("express-validator");
const {
  requestSignupOtp,
  verifySignupOtp,
  login,
  getMe,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const signupValidators = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .customSanitizer(normalizeEmail),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must include at least one letter")
    .matches(/\d/)
    .withMessage("Password must include at least one number"),
];

// --- POST /api/auth/signup/request-otp ---
// Validates signup data and emails a one-time verification code.
router.post("/signup/request-otp", signupValidators, requestSignupOtp);

// --- POST /api/auth/signup/verify ---
// Creates the account only after the emailed OTP is confirmed.
router.post(
  "/signup/verify",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .customSanitizer(normalizeEmail),
    body("otp")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Verification code must be 6 digits"),
  ],
  verifySignupOtp
);

// --- POST /api/auth/login ---
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .customSanitizer(normalizeEmail),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

// --- GET /api/auth/me ---
// Protected route - requires valid JWT token
router.get("/me", protect, getMe);

// --- DELETE /api/auth/me ---
// Protected route - verifies password before permanently deleting the account
router.delete(
  "/me",
  protect,
  [body("password").notEmpty().withMessage("Password is required")],
  deleteAccount
);

module.exports = router;
