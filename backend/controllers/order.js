
const Order = require("../models/order");
const Product = require("../models/product");

// Create a new order
exports.newOrder = async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      user: req.body.user
    });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner =
      String(order.user._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }
};


// Get orders for the logged-in user
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve your orders"
    });
  }
};

// Get all orders for the admin
exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders"
    });
  }
};

// Update order status (admin only; route is protected)
exports.updateOrder = async (req, res) => {
  try {
    const { status } = req.body;

    const transitions = {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Shipped"],
      Shipped: ["Completed"],
      Completed: [],
      Cancelled: [],
    };

    if (!Object.hasOwn(transitions, status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!transitions[order.orderStatus]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message:
          order.orderStatus === "Completed" || order.orderStatus === "Cancelled"
            ? `Orders with status ${order.orderStatus} cannot be changed`
            : `Cannot change order status from ${order.orderStatus} to ${status}`,
      });
    }

    order.orderStatus = status;

    if (status === "Completed") {
      order.deliveredAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid order ID"
          : "Failed to update order status",
    });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to delete order"
    });
  }
};


exports.newOrder = async (req, res) => {
  const mongoose = require("mongoose");
  const session = await mongoose.startSession();

  try {
    const { shippingInfo, items } = req.body;

    const requiredFields = [
      "address",
      "city",
      "phoneNo",
      "postalCode",
      "country",
    ];

    if (
      !shippingInfo ||
      requiredFields.some(
        (field) =>
          typeof shippingInfo[field] !== "string" ||
          !shippingInfo[field].trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide complete shipping information",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // Validate and combine duplicate product entries.
    const quantities = new Map();

    for (const item of items) {
      const { productId, quantity } = item || {};

      if (
        typeof productId !== "string" ||
        !mongoose.isValidObjectId(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity",
        });
      }

      const id = String(productId);
      const combined = (quantities.get(id) || 0) + quantity;

      if (!Number.isSafeInteger(combined)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity",
        });
      }

      quantities.set(id, combined);
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      let itemsPrice = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findOne({
          _id: productId,
          isAvailable: true,
        }).session(session);

        if (!product) {
          throw new Error(`Product ${productId} is unavailable`);
        }

        // Decrement only if enough stock remains.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            isAvailable: true,
            stock: { $gte: quantity },
          },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const price = Number(product.price);
        const lineTotal = price * quantity;

        if (
          !Number.isFinite(price) ||
          price < 0 ||
          !Number.isFinite(lineTotal) ||
          !Number.isFinite(itemsPrice + lineTotal)
        ) {
          throw new Error("Invalid product price");
        }

        itemsPrice += lineTotal;

        orderItems.push({
          name: product.name,
          quantity,
          image: product.image || product.images?.[0]?.url || "",
          price,
          product: product._id,
        });
      }

      // Tax and shipping remain zero until store policies are defined.
      const taxPrice = 0;
      const shippingPrice = 0;
      const totalPrice = itemsPrice + taxPrice + shippingPrice;

      const orders = await Order.create(
        [
          {
            shippingInfo: Object.fromEntries(
              requiredFields.map((field) => [
                field,
                shippingInfo[field].trim(),
              ])
            ),
            orderItems,
            user: req.user._id,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
          },
        ],
        { session }
      );

      createdOrder = orders[0];
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: createdOrder,
    });
  } catch (error) {
    const clientError =
      error.message.startsWith("Product ") ||
      error.message.startsWith("Insufficient stock") ||
      error.message === "Invalid product price";

    return res.status(clientError ? 400 : 500).json({
      success: false,
      message: clientError
        ? error.message
        : "Unable to create order",
    });
  } finally {
    await session.endSession();
  }
};
