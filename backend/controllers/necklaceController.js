
const fs = require("fs/promises");
const path = require("path");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Necklace = require("../models/Necklace");
const User = require("../models/User");

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

const getAllNecklaces = async (req, res) => {
  try {
    // Build a filter object from query parameters
    const filter = {};

    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.style) filter.style = String(req.query.style);
    if (req.query.metal) filter.metal = String(req.query.metal);
    if (req.query.featured) filter.featured = req.query.featured === "true";
    if (req.query.inStock) filter.inStock = req.query.inStock === "true";

    // Only show catalogue items — custom uploads are private to their owner
    // and are fetched via GET /api/necklaces/my-uploads instead.
    filter.isCustom = false;

    const necklaces = await Necklace.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: necklaces.length,
      data: { necklaces },
    });
  } catch (error) {
    console.error("Get necklaces error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching necklaces",
    });
  }
};

const getNecklaceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid necklace ID" });
    }
    const necklace = await Necklace.findById(req.params.id);

    if (!necklace) {
      return res.status(404).json({
        success: false,
        message: "Necklace not found",
      });
    }

    if (
      necklace.isCustom &&
      (!req.user || necklace.uploadedBy?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own custom uploads",
      });
    }

    res.status(200).json({
      success: true,
      data: { necklace },
    });
  } catch (error) {
    console.error("Get necklace error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching necklace",
    });
  }
};


const createNecklace = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const necklace = await Necklace.create(req.body);

    res.status(201).json({
      success: true,
      message: "Necklace created successfully",
      data: { necklace },
    });
  } catch (error) {
    console.error("Create necklace error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating necklace",
    });
  }
};

const adminCreateNecklace = async (req, res) => {
  const uploadPath = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    if (!uploadPath) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const { name, description, price, category, style, metal, scale, offsetY } = req.body;

    let necklace;
    try {
      necklace = await Necklace.create({
        name:        name || 'New Necklace',
        description: description || '',
        price:       parseFloat(price) || 0,
        category:    category || 'pendant',
        style:       style   || 'modern',
        metal:       metal   || 'gold',
        image:       uploadPath,
        tryOnImage:  uploadPath,
        tryOnSettings: {
          scale:   parseFloat(scale)   || 1.0,
          offsetY: parseFloat(offsetY) || 0.04,
        },
        isCustom: false,
        featured: false,
      });
    } catch (dbError) {
      await deleteUploadFile(uploadPath);
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'Catalogue necklace created successfully',
      data: { necklace },
    });
  } catch (error) {
    if (uploadPath) await deleteUploadFile(uploadPath).catch(() => {});
    console.error('Admin create necklace error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }
    res.status(500).json({ success: false, message: 'Server error creating necklace' });
  }
};


const uploadCustomNecklace = async (req, res) => {
  try {
    // Multer attaches the file info to req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file (PNG or WebP)",
      });
    }

    const { name, description, category, style, metal } = req.body;
    const uploadPath = `/uploads/${req.file.filename}`;

    let necklace;
    try {
      necklace = await Necklace.create({
        name: name || "Custom Necklace",
        description: description || "My custom necklace",
        price: 0,
        category: category || "custom",
        style: style || "modern",
        metal: metal || "gold",
        image: uploadPath,
        tryOnImage: uploadPath,
        tryOnSettings: {
          scale: parseFloat(req.body.scale) || 1.0,
          offsetY: parseFloat(req.body.offsetY) || 0,
        },
        isCustom: true,
        uploadedBy: req.user._id,
      });
    } catch (dbError) {
      await deleteUploadFile(uploadPath);
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: "Custom necklace uploaded successfully",
      data: { necklace },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error uploading necklace",
    });
  }
};


const getMyUploads = async (req, res) => {
  try {
    const necklaces = await Necklace.find({
      uploadedBy: req.user._id,
      isCustom: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: necklaces.length,
      data: { necklaces },
    });
  } catch (error) {
    console.error("Get uploads error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching your uploads",
    });
  }
};


const deleteNecklace = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid necklace ID" });
    }
    const necklace = await Necklace.findById(req.params.id);

    if (!necklace) {
      return res.status(404).json({
        success: false,
        message: "Necklace not found",
      });
    }

    // Admins can delete any necklace; regular users can only delete their own custom uploads.
    const isAdmin = req.user.role === 'admin';
    if (!necklace.isCustom && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to delete catalogue necklaces',
      });
    }

    if (necklace.isCustom && !isAdmin &&
        (!necklace.uploadedBy || necklace.uploadedBy.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own custom necklaces',
      });
    }

    await User.updateMany(
      { wishlist: necklace._id },
      { $pull: { wishlist: necklace._id } }
    );
    await necklace.deleteOne();
    await Promise.all([
      deleteUploadFile(necklace.image),
      deleteUploadFile(necklace.tryOnImage),
    ]);

    res.status(200).json({
      success: true,
      message: "Necklace deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting necklace",
    });
  }
};

module.exports = {
  getAllNecklaces,
  getNecklaceById,
  createNecklace,
  adminCreateNecklace,
  uploadCustomNecklace,
  getMyUploads,
  deleteNecklace,
};
