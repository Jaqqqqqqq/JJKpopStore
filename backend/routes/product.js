const express = require("express");
const productController = require("../controllers/productController");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/products", productController.getProducts);
router.get("/product/:id", productController.getSingleProduct);
router.get("/admin/products", adminOnly, productController.getAdminProducts);
router.post("/admin/product/new", adminOnly, productController.newProduct);
router.put("/admin/product/:id", adminOnly, productController.updateProduct);
router.delete("/admin/product/:id", adminOnly, productController.deleteProduct);

module.exports = router;
