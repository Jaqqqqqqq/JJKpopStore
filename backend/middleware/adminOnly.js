const jwt = require("jsonwebtoken");

function adminOnly(req, res, next) {
  // When authentication middleware has already loaded the account, use its
  // current database role instead of trusting a possibly stale JWT claim.
  if (req.user) {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    return next();
  }

  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in as an admin",
    });
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "jj-kpop-development-secret-change-before-deploy"
    );

    if (String(decoded.role).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = adminOnly;
