const express = require("express");
const categoryController = require("../controllers/categoryController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/categories", categoryController.getCategories);
router.get("/admin/categories", protect, adminOnly, categoryController.getCategories);
router.post("/admin/categories", protect, adminOnly, categoryController.createCategory);
router.put("/admin/categories/:id", protect, adminOnly, categoryController.updateCategory);
router.delete("/admin/categories/:id", protect, adminOnly, categoryController.deleteCategory);

module.exports = router;
