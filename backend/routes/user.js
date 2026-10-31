
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const adminOnly = require("../middleware/adminOnly");
const protect = require("../middleware/auth");

router.put("/me/update", protect, userController.updateProfile);

router.get(
  "/admin/users",
  adminOnly,
  userController.getAdminUsers
);

router.put(
  "/admin/user/:id/status",
  adminOnly,
  userController.updateUserStatus
);

module.exports = router;
