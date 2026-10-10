
const express = require("express");
const router = express.Router();

const {
  getProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts
} = require("../controllers/product");

// Get all products
router.get("/products", getProducts);

// Get one product
router.get("/product/:id", getSingleProduct);

// Add a product
router.post("/admin/product/new", newProduct);

// Update a product
router.put("/admin/product/:id", updateProduct);

// Delete a product
router.delete("/admin/product/:id", deleteProduct);

// Get products for admin
router.get("/admin/products", getAdminProducts);

module.exports = router;
