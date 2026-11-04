const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/password/forgot", authController.forgotPassword);
router.put("/password/reset", authController.resetPassword);
router.post("/auth/google", authController.googleLogin);

module.exports = router;
