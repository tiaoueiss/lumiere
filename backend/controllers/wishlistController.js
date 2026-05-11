const mongoose = require("mongoose");
const User = require("../models/User");
const Necklace = require("../models/Necklace");

const getWishlist = async (req, res) => {
  try {
    // populate() replaces the ObjectId references with actual necklace data
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name image tryOnImage description price category style metal inStock isCustom uploadedBy tryOnSettings",
    );

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      data: { wishlist: user.wishlist },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching wishlist",
    });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { necklaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(necklaceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid necklace ID" });
    }

    // Make sure the necklace actually exists
    const necklace = await Necklace.findById(necklaceId);
    if (!necklace) {
      return res.status(404).json({
        success: false,
        message: "Necklace not found",
      });
    }

    if (
      necklace.isCustom &&
      necklace.uploadedBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only wishlist your own custom uploads",
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already in wishlist (avoid duplicates)
    if (user.wishlist.some((id) => id.toString() === necklaceId)) {
      return res.status(400).json({
        success: false,
        message: "This necklace is already in your wishlist",
      });
    }

    // Add to wishlist and save
    user.wishlist.push(necklaceId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `${necklace.name} added to your wishlist`,
      data: { wishlistCount: user.wishlist.length },
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding to wishlist",
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { necklaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(necklaceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid necklace ID" });
    }

    const user = await User.findById(req.user._id);

    // Check if it's actually in the wishlist
    if (!user.wishlist.some((id) => id.toString() === necklaceId)) {
      return res.status(400).json({
        success: false,
        message: "This necklace is not in your wishlist",
      });
    }

    // Remove it using Mongoose's pull method
    user.wishlist.pull(necklaceId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Removed from your wishlist",
      data: { wishlistCount: user.wishlist.length },
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing from wishlist",
    });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
