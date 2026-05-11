const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const Necklace = require("../models/Necklace");
const { sendSignupOtpEmail } = require("../services/emailService");

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// crypto is used for secure random numbers and hashing
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const hashOtp = (otp, email) =>
  crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${otp}:${process.env.JWT_SECRET}`)
    .digest("hex");

const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");

const deleteUploadFile = async (uploadUrl) => {
  if (!uploadUrl || !uploadUrl.startsWith("/uploads/")) return;

  const relativePath = uploadUrl.replace(/^\/uploads[\\/]/, "");
  const absolutePath = path.resolve(UPLOADS_DIR, relativePath);

  if (!absolutePath.startsWith(`${UPLOADS_DIR}${path.sep}`)) return;

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not delete upload file ${uploadUrl}:`, error.message);
    }
  }
};


// Validates signup details, stores a short-lived OTP, and emails the code.
const requestSignupOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // temporarily store the OTP and user details in a separate collection until verification
    await EmailVerification.findOneAndUpdate(
      { email },
      {
        name,
        email,
        passwordHash,
        otpHash: hashOtp(otp, email),
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // send email
    const emailResult = await sendSignupOtpEmail({ to: email, name, otp });

    res.status(200).json({
      success: true,
      message: emailResult.sent
        ? "Verification code sent to your email"
        : "Verification code generated. Check the backend console in development.",
      data: {
        email,
        expiresInMinutes: OTP_TTL_MINUTES,
        emailSent: emailResult.sent,
      },
    });
  } catch (error) {
    console.error("Signup OTP request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending verification code",
    });
  }
};


// Verifies the OTP, creates the user, and returns a JWT token.
const verifySignupOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    const pendingSignup = await EmailVerification.findOne({ email });
    if (!pendingSignup) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found or expired. Please request a new code.",
      });
    }

    if (pendingSignup.expiresAt <= new Date()) {
      await EmailVerification.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request a new code.",
      });
    }

    if (pendingSignup.attempts >= MAX_OTP_ATTEMPTS) {
      await EmailVerification.deleteOne({ _id: pendingSignup._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const isValidOtp = pendingSignup.otpHash === hashOtp(otp, email);
    if (!isValidOtp) {
      pendingSignup.attempts += 1;
      await pendingSignup.save();
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await EmailVerification.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: pendingSignup.name,
      email: pendingSignup.email,
      password: pendingSignup.passwordHash,
    });

    // after creating user, we can delete temporary verifiction recrods
    await EmailVerification.deleteOne({ _id: pendingSignup._id });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Email verified and account created successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Signup OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

// ===========================================
// POST /api/auth/login
// ===========================================
// Authenticates a user and returns a JWT token.
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    // Find user AND include the password field (normally excluded via select: false)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare entered password with stored hash
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ===========================================
// GET /api/auth/me
// ===========================================
// Returns the currently logged-in user's profile.
// Requires the protect middleware (user must be authenticated).
const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name image price category"
    );

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
};

// ===========================================
// DELETE /api/auth/me
// ===========================================
// Permanently deletes the authenticated user's account after password check.
const deleteAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    //find all custom necklaces uploaded by the user, delete them, and remove from wishlists
    const customNecklaces = await Necklace.find({
      uploadedBy: user._id,
      isCustom: true,
    }).select("_id image tryOnImage");
    const customNecklaceIds = customNecklaces.map((necklace) => necklace._id);
    const uploadUrls = [
      ...new Set(
        customNecklaces.flatMap((necklace) => [
          necklace.image,
          necklace.tryOnImage,
        ])
      ),
    ];

    if (customNecklaceIds.length > 0) {
      await User.updateMany(
        { wishlist: { $in: customNecklaceIds } },
        { $pull: { wishlist: { $in: customNecklaceIds } } }
      );
      await Necklace.deleteMany({ _id: { $in: customNecklaceIds } });
    }

    await Promise.all(uploadUrls.map(deleteUploadFile));

    await EmailVerification.deleteMany({ email: user.email });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting account",
    });
  }
};

module.exports = {
  requestSignupOtp,
  verifySignupOtp,
  login,
  getMe,
  deleteAccount,
};
