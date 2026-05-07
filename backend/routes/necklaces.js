// ===========================================
// routes/necklaces.js — Necklace Routes
// ===========================================

const express = require("express");
const { body } = require("express-validator");
const {
  getAllNecklaces,
  getNecklaceById,
  createNecklace,
  uploadCustomNecklace,
  getMyUploads,
  deleteNecklace,
} = require("../controllers/necklaceController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// --- PUBLIC ROUTES (no login required) ---

// GET /api/necklaces — Get all necklaces (with optional filters)
router.get("/", getAllNecklaces);

// --- PROTECTED ROUTES (login required) ---
// NOTE: Specific string paths (/upload, /my-uploads) must come BEFORE /:id
// otherwise Express matches "upload" / "my-uploads" as the :id parameter.

// POST /api/necklaces — Create a catalogue necklace (admin only)
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("image").notEmpty().withMessage("Image URL is required"),
    body("tryOnImage").notEmpty().withMessage("Try-on image is required"),
  ],
  createNecklace
);

// POST /api/necklaces/upload — Upload a custom necklace
// upload.single("image") processes a single file from the "image" form field
router.post("/upload", protect, upload.single("image"), uploadCustomNecklace);

// GET /api/necklaces/my-uploads — Get current user's custom necklaces
router.get("/my-uploads", protect, getMyUploads);

// GET /api/necklaces/:id — Get a single necklace (must come AFTER specific paths)
router.get("/:id", getNecklaceById);

// DELETE /api/necklaces/:id — Delete a necklace
router.delete("/:id", protect, deleteNecklace);

module.exports = router;
