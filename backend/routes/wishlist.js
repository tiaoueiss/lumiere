
// All wishlist routes require authentication (protect middleware).

const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All wishlist routes need login
router.use(protect);

// GET /api/wishlist — Get user's wishlist
router.get("/", getWishlist);

// POST /api/wishlist/:necklaceId — Add to wishlist
router.post("/:necklaceId", addToWishlist);

// DELETE /api/wishlist/:necklaceId — Remove from wishlist
router.delete("/:necklaceId", removeFromWishlist);

module.exports = router;
