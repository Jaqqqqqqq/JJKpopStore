
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const adminOnly = require("../middleware/adminOnly");

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
