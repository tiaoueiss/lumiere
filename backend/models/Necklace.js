
const mongoose = require("mongoose");

const necklaceSchema = new mongoose.Schema(
  {
    // --- Basic Details ---
    name: {
      type: String,
      required: [true, "Necklace name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "LBP"],
    },

    // --- Categorisation ---
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "pendant",
        "chain",
        "choker",
        "statement",
        "layered",
        "pearl",
        "custom",
      ],
    },

    style: {
      type: String,
      enum: [
        "minimalist",
        "vintage",
        "bold",
        "classic",
        "modern",
        "bohemian",
        "luxury",
      ],
    },

    metal: {
      type: String,
      enum: ["gold", "silver", "rose-gold", "platinum", "mixed","other"],
    },

    // --- Images ---
    // The main product image (shown in catalogue grid)
    image: {
      type: String,
      required: [true, "Product image is required"],
    },

    // The try-on overlay image (transparent PNG used in AR)
    tryOnImage: {
      type: String,
      required: [true, "Try-on image is required"],
    },

    // --- Try-On Settings ---
    // These match what you have in data/necklaces.js
    tryOnSettings: {
      scale:      { type: Number, default: 1.0 },
      offsetY:    { type: Number, default: 0 },
      widthRatio: { type: Number, default: 1.0 },
    },

    // --- Metadata ---
    isCustom: {
      type: Boolean,
      default: false, // true for user-uploaded necklaces
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // which user uploaded this (if custom)
      default: null,
    },

    // --- Stock & Visibility ---
    inStock: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    tags: [String], // e.g. ["wedding", "everyday", "gift"]
  },
  {
    timestamps: true,
  }
);


// using index makes searching by category and style much faster
necklaceSchema.index({ category: 1, style: 1 });
necklaceSchema.index({ featured: 1 });
necklaceSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("Necklace", necklaceSchema);
