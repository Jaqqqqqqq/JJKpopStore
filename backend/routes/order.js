
const express = require("express");
const router = express.Router();

const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAdminOrders,
  updateOrder,
  deleteOrder
} = require("../controllers/order");

// Create an order
router.post("/order/new", newOrder);

// Get a specific order
router.get("/order/:id", getSingleOrder);

// Get logged-in user's orders
router.get("/myorders", myOrders);

// Admin: get all orders
router.get("/admin/orders", getAdminOrders);

// Admin: update order status
router.put("/admin/order/:id", updateOrder);

// Admin: delete an order
router.delete("/admin/order/:id", deleteOrder);

module.exports = router;
