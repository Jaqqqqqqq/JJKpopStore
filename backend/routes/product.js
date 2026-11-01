const express = require("express");
const productController = require("../controllers/productController");
const adminOnly = require("../middleware/adminOnly");
const protect = require("../middleware/auth");
const upload = require("../utils/multer");

const router = express.Router();

router.get("/products", productController.getProducts);
router.get("/product/:id", productController.getSingleProduct);
router.post("/product/:id/reviews", protect, productController.createProductReview);
router.delete("/admin/product/:id/reviews/:reviewId", protect, adminOnly, productController.deleteProductReview);
router.get("/admin/products", adminOnly, productController.getAdminProducts);
router.post("/admin/product/new", adminOnly, upload.array("images", 5), productController.newProduct);
router.put("/admin/product/:id", adminOnly, upload.array("images", 5), productController.updateProduct);
router.delete("/admin/product/:id/images", adminOnly, productController.deleteProductImages);
router.delete("/admin/product/:id", adminOnly, productController.deleteProduct);
router.delete("/admin/products/bulk-delete", adminOnly, productController.bulkDeleteProducts);

module.exports = router;
