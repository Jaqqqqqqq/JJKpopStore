const jwt = require("jsonwebtoken");

function adminOnly(req, res, next) {
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
