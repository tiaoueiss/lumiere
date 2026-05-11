// ===========================================
// seed.js — Populate Database with Catalogue Data
// ===========================================
// Copies necklace images from frontend assets into backend/uploads/necklaces/
// then inserts the catalogue into MongoDB.
// Usage: node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const Necklace = require("./models/Necklace");

// --- Resolve paths ---
const ASSETS_DIR = path.join(__dirname, "../frontend/src/assets/necklaces");
const UPLOADS_DIR = path.join(__dirname, "uploads/necklaces");

// --- Catalogue data (mirrors sillhouette/src/data/necklaces.js) ---
const catalogue = [
  {
    slug:        "choker",
    name:        "Ruby Choker",
    description: "A sleek, close-fitting collar that sits at the base of the throat. Crafted in 18k gold vermeil with a delicate pavé center stone.",
    price:       285,
    category:    "choker",
    style:       "classic",
    metal:       "gold",
    featured:    true,
    tags:        ["everyday", "elegant"],
    tryOnSettings: { scale: 1.10, offsetY: -0.01, widthRatio: 0.82 },
  },
  {
    slug:        "pendant",
    name:        "Lumière Pendant",
    description: "Our signature pendant featuring a hand-set rose-cut diamond suspended from a fine trace chain. The defining piece of the atelier.",
    price:       420,
    category:    "pendant",
    style:       "minimalist",
    metal:       "silver",
    featured:    true,
    tags:        ["everyday", "gift", "delicate"],
    tryOnSettings: { scale: 0.95, offsetY: 0.06, widthRatio: 0.95 },
  },
  {
    slug:        "layered",
    name:        "Cascade Layers",
    description: "Two chains worn together, each set with a diamond piece. Effortlessly stacks with other pieces.",
    price:       560,
    category:    "layered",
    style:       "modern",
    metal:       "gold",
    featured:    false,
    tags:        ["casual", "layered", "modern"],
    tryOnSettings: { scale: 1.35, offsetY: 0.06, widthRatio: 0.60 },
  },
  {
    slug:        "diamond",
    name:        "Diamonds in Bloom",
    description: "A stunning diamond necklace with many stones. A modern take on the classic tennis necklace, with clusters of diamonds in varying sizes for a blooming effect.",
    price:       5600,
    category:    "pendant",
    style:       "luxury",
    metal:       "gold",
    featured:    true,
    tags:        ["luxury", "formal", "wedding"],
    tryOnSettings: { scale: 1.30, offsetY: -0.03, widthRatio: 0.60 },
  },
  {
    slug:        "tennis",
    name:        "Éclat Tennis",
    description: "Forty-two brilliant-cut diamonds in a seamless prong setting. The tennis necklace, perfected. Available in white, yellow, and rose gold.",
    price:       1240,
    category:    "chain",
    style:       "luxury",
    metal:       "gold",
    featured:    true,
    tags:        ["luxury", "wedding", "formal"],
    tryOnSettings: { scale: 1.25, offsetY: 0.01, widthRatio: 0.65 },
  },
  {
    slug:        "opera",
    name:        "Opéra Grande",
    description: "A dramatic opera necklace, with white and yellow gems. Perfect to make a statement and turn heads at your next soirée.",
    price:       740,
    category:    "chain",
    style:       "classic",
    metal:       "gold",
    featured:    false,
    tags:        ["formal", "elegant", "statement"],
    tryOnSettings: { scale: 1.35, offsetY: -0.11, widthRatio: 0.70 },
  },
  {
    slug:        "floral",
    name:        "Floral Fantasy",
    description: "A beautiful floral-inspired layered necklace with delicate pink details and a romantic feel.",
    price:       670,
    category:    "layered",
    style:       "vintage",
    metal:       "rose-gold",
    featured:    false,
    tags:        ["romantic", "vintage", "gift"],
    tryOnSettings: { scale: 1.15, offsetY: 0.03, widthRatio: 0.60 },
  },
];

// --- Copy images to uploads directory ---
const copyImages = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log("📁 Created uploads/necklaces directory");
  }

  catalogue.forEach(({ slug }) => {
    const src = path.join(ASSETS_DIR, `${slug}.png`);
    const dest = path.join(UPLOADS_DIR, `${slug}.png`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   ✓ Copied ${slug}.png`);
    } else {
      console.warn(`   ⚠️  Missing asset: ${slug}.png (skipping)`);
    }
  });
};

// --- Build DB documents ---
const buildDocuments = () =>
  catalogue.map(({ slug, ...rest }) => ({
    ...rest,
    image:      `/uploads/necklaces/${slug}.png`,
    tryOnImage: `/uploads/necklaces/${slug}.png`,
    isCustom:   false,
  }));

// --- Seed Function ---
const seedDB = async () => {
  try {
    await connectDB();

    console.log("\n📋 Copying images...");
    copyImages();

    console.log("\n🌱 Seeding necklaces...");
    await Necklace.deleteMany({ isCustom: false });
    console.log("🗑️  Cleared existing catalogue necklaces");

    const created = await Necklace.insertMany(buildDocuments());
    console.log(`✅ Seeded ${created.length} necklaces into the database\n`);
    created.forEach((n) => {
      console.log(`   → ${n.name} (${n.category}, ${n.style}, $${n.price})`);
    });

    mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedDB();
