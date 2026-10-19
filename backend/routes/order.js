
const express = require("express");
const router = express.Router();

const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAdminOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/order");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// Customer or admin must be authenticated to create an order.
// The controller must still validate products and prices server-side.
router.post("/order/new", protect, newOrder);

// Customers can only access their own order history.
router.get("/myorders", protect, myOrders);

// Admin order management.
router.get("/admin/orders", protect, adminOnly, getAdminOrders);
router.put("/admin/order/:id", protect, adminOnly, updateOrder);
router.delete("/admin/order/:id", protect, adminOnly, deleteOrder);

// Authenticated users may access only their own order.
// The controller must enforce ownership.
router.get("/order/:id", protect, getSingleOrder);

module.exports = router;
