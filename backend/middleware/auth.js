
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Extract the token (everything after "Bearer ")
    token = req.headers.authorization.split(" ")[1];
  }

  // No token found? User isn't logged in
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — please log in",
    });
  }

  try {
    // Verify the token using our secret key
    // This returns the payload we put in when we created the token (user id)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID and attach to the request object
    // Now any route handler after this can access req.user
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    next(); // All good — move to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Like protect, but doesn't reject the request if no token is present.
// Used on routes that work for both guests and logged-in users —
// req.user will be set when a valid token is provided, null otherwise.
const optionalProtect = async (req, res, next) => {
  req.user = null;
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch {
    // invalid / expired token — treat as guest
  }
  next();
};

// Rejects the request with 403 if the authenticated user is not an admin.
// Must be used AFTER protect (relies on req.user being set).
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = { protect, optionalProtect, adminOnly };
