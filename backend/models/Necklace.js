const mongoose = require("mongoose");

const necklaceSchema = new mongoose.Schema(
  {
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

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["pendant", "chain", "choker", "statement", "layered", "pearl", "custom"],
    },

    style: {
      type: String,
      enum: ["minimalist", "vintage", "bold", "classic", "modern", "bohemian", "luxury"],
    },

    metal: {
      type: String,
      enum: ["gold", "silver", "rose-gold", "platinum", "mixed", "other"],
    },

    image: {
      type: String,
      required: [true, "Product image is required"],
    },

    // Transparent PNG overlaid on the webcam canvas during try-on
    tryOnImage: {
      type: String,
      required: [true, "Try-on image is required"],
    },

    tryOnSettings: {
      scale:      { type: Number, default: 1.0 },
      offsetY:    { type: Number, default: 0 },
      widthRatio: { type: Number, default: 1.0 },
    },

    isCustom: {
      type: Boolean,
      default: false,
    },

    // Set only for custom uploads — identifies which user owns this necklace
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    tags: [String],
  },
  {
    timestamps: true,
  }
);

necklaceSchema.index({ category: 1, style: 1 });
necklaceSchema.index({ featured: 1 });
necklaceSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("Necklace", necklaceSchema);
