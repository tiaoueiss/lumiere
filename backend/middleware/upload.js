
// Uses Multer to handle file uploads (for custom necklace images).
// Validates file type (PNG/WebP only) and limits file size.

// Multer is middleware that processes multipart/form-data,
// which is what browsers send when you upload files via a form.

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Storage Configuration ---
// Tells Multer WHERE to save files and WHAT to name them
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save uploads to backend/uploads regardless of where the server was launched.
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp-originalname
    // This prevents filename collisions
    const uniqueName = `${req.user._id}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

// --- File Filter ---
// Only allow PNG and WebP images (matching your frontend validation)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error("Invalid file type. Only PNG and WebP images are allowed."),
      false
    );
  }
};

// --- Create the Multer instance ---
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
});

module.exports = upload;
