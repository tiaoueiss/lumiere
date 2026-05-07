// ===========================================
// server.js — Main Entry Point
// ===========================================
// This is where everything comes together.
// It creates the Express app, connects to MongoDB,
// registers all routes, and starts listening for requests.

// Load environment variables FIRST (before anything else uses them)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// --- Import Route Files ---
const authRoutes = require("./routes/auth");
const necklaceRoutes = require("./routes/necklaces");
const wishlistRoutes = require("./routes/wishlist");
const styleAnalysisHandler = require("./routes/styleanalysisroute");
const styleFollowUpHandler = require("./controllers/styleFollowUpController");
const { protect, optionalProtect } = require("./middleware/auth");
const User = require("./models/User");

// --- Create Express App ---
const app = express();

// --- Connect to MongoDB ---
connectDB();

// ===========================================
// Middleware (runs on EVERY request)
// ===========================================

// CORS: Allow your React frontend to talk to this backend
// In development, your React app runs on port 5173 (Vite default)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allows cookies/auth headers
  })
);

// Parse JSON request bodies (so we can read req.body)
// Limit raised to 10mb to handle base64-encoded images from style analysis
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files as static assets
// This means /uploads/filename.png will serve the actual file
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===========================================
// API Routes
// ===========================================
// Each route file handles a group of related endpoints

app.use("/api/auth", authRoutes);
app.use("/api/necklaces", necklaceRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Run the AI analysis pipeline. optionalProtect attaches req.user if a valid
// token is present so the controller can auto-save to MongoDB for logged-in users.
const analysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests — please wait 15 minutes and try again." },
});
app.post("/api/style-analysis", analysisRateLimit, optionalProtect, styleAnalysisHandler);
app.post("/api/style-analysis/follow-up", styleFollowUpHandler);

// Save the AI analysis result to the logged-in user's MongoDB document.
app.post("/api/style-analysis/save", protect, async (req, res) => {
  try {
    const { results } = req.body;
    if (!results || typeof results !== "object") {
      return res.status(400).json({ error: "No results provided." });
    }
    await User.findByIdAndUpdate(req.user._id, {
      aiAnalysis: results,
      aiAnalysisSavedAt: new Date(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("[save-analysis]", err.message);
    return res.status(500).json({ error: "Failed to save analysis." });
  }
});

// Retrieve the saved AI analysis for the logged-in user.
app.get("/api/style-analysis/saved", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("aiAnalysis aiAnalysisSavedAt");
    if (!user?.aiAnalysis) {
      return res.status(404).json({ error: "No saved analysis found." });
    }
    return res.json({ results: user.aiAnalysis, savedAt: user.aiAnalysisSavedAt });
  } catch (err) {
    console.error("[get-saved-analysis]", err.message);
    return res.status(500).json({ error: "Failed to retrieve saved analysis." });
  }
});

// Clear the saved AI analysis for the logged-in user.
app.delete("/api/style-analysis/saved", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      aiAnalysis: null,
      aiAnalysisSavedAt: null,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("[delete-saved-analysis]", err.message);
    return res.status(500).json({ error: "Failed to clear saved analysis." });
  }
});

// ===========================================
// Health Check Endpoint
// ===========================================
// Quick way to test if the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// 404 Handler — Catch undefined routes
// ===========================================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ===========================================
// Global Error Handler
// ===========================================
// Catches any errors thrown in route handlers
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  // Handle Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB",
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ===========================================
// Start Server
// ===========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  
     Lumiere API Server
     Running on port ${PORT}
     Mode: ${process.env.NODE_ENV || "development"}
  
  `);
});
