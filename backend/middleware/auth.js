
const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function protect(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue",
    });
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "jj-kpop-development-secret-change-before-deploy"
    );

    const user = await User.findById(decoded.id).select("_id role isActive");

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Your account is unavailable. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

module.exports = protect;
