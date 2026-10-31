
const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");
const sendEmail = require("../utils/sendEmail");
const createOrderReceiptPdf = require("../utils/createOrderReceiptPdf");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}[character]));

const formatCurrency = (value) => `PHP ${Number(value || 0).toFixed(2)}`;

// Create a new order
exports.newOrder = async (req, res) => {
  let session;

  try {
        const { shippingInfo, items, paymentMethod, paymentAmount } = req.body;

    const allowedPaymentMethods = ["Card", "E-payment", "COD"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid payment method.",
      });
    }

    // Validate shipping information.
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

    // Validate cart items.
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

    // Authentication middleware must provide the logged-in user.
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in before placing an order",
      });
    }

    // Start a database transaction.
    session = await mongoose.startSession();

    let createdOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      let itemsPrice = 0;

      // Fetch each product and verify its stock.
      for (const [productId, quantity] of quantities) {
        const product = await Product.findOne({
          _id: productId,
          isAvailable: true,
        }).session(session);

        if (!product) {
          throw new Error(`Product ${productId} is unavailable`);
        }

        // Reduce stock only when enough units are available.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            isAvailable: true,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            returnDocument: "after",
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error(
            `Insufficient stock for ${product.name}`
          );
        }

        // Calculate the price using the database product price.
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

      // Tax and shipping are zero until store policies are defined.
      const taxPrice = 0;
      const shippingPrice = 0;
      const totalPrice = itemsPrice + taxPrice + shippingPrice;

      if (paymentMethod === "E-payment") {
        const enteredAmount = Number(paymentAmount);
        if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
          throw new Error("Please enter a valid e-wallet payment amount.");
        }
        if (Math.abs(enteredAmount - totalPrice) > 0.01) {
          throw new Error("E-wallet amount must match the order total.");
        }
      }

      // Save the order and stock changes in the same transaction.
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
            paymentMethod,
            ...(paymentMethod === "E-payment" ? { paymentAmount: Number(paymentAmount) } : {}),
            ...(paymentMethod === "Card" ? { paymentInfo: { id: "demo-card-payment", status: "Pending" } } : {}),
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
    // Print the real error in the backend terminal for debugging.
    console.error("Create order failed:", error);

    const message = String(error?.message || "");

    const isClientError =
      message.startsWith("Product ") ||
      message.startsWith("Insufficient stock") ||
      message === "Invalid product price" ||
      message.startsWith("Please enter a valid e-wallet") ||
      message.startsWith("E-wallet amount");

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.code === 20 ||
      message.includes("Transaction numbers are only allowed")
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Order processing requires MongoDB transaction support. Check the MongoDB connection configuration.",
      });
    }

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError
        ? message
        : "Unable to create order",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Daily completed-order sales for the admin dashboard chart.
exports.salesChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { orderStatus: "Completed" };
    const dateRange = {};
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00.000+08:00`);
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start date." });
      }
      dateRange.$gte = start;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999+08:00`);
      if (Number.isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end date." });
      }
      dateRange.$lte = end;
    }
    if (startDate && endDate && dateRange.$gte > dateRange.$lte) {
      return res.status(400).json({ success: false, message: "Start date must be before end date." });
    }
    if (Object.keys(dateRange).length) match.createdAt = dateRange;

    const sales = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Manila" } },
          total: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", total: 1, orders: 1 } },
    ]);

    return res.status(200).json({ success: true, sales });
  } catch (error) {
    console.error("Sales chart error:", error);
    return res.status(500).json({ success: false, message: "Unable to load sales data." });
  }
};

// Get a single order.
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
      String(order.user?._id) === String(req.user?._id);
    const isAdmin = req.user?.role === "admin";

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
    console.error("Get single order failed:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }
};

// Get orders for the logged-in user.
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my orders failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your orders",
    });
  }
};

// Get all orders for the admin.
exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get admin orders failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
};

// Update order status.
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

    const order = await Order.findById(req.params.id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const statusChanged = order.orderStatus !== status;

    if (statusChanged && !transitions[order.orderStatus]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message:
          order.orderStatus === "Completed" ||
          order.orderStatus === "Cancelled"
            ? `Orders with status ${order.orderStatus} cannot be changed`
            : `Cannot change order status from ${order.orderStatus} to ${status}`,
      });
    }

    if (!statusChanged && order.statusEmailSentAt) {
      return res.status(409).json({
        success: false,
        message: "This order status notification has already been sent.",
      });
    }

    if (statusChanged) {
      order.orderStatus = status;

      if (status === "Completed") {
        order.deliveredAt = new Date();
      }

      await order.save();
    }

    let emailSent = false;
    let emailMessage = "";
    try {
      await order.populate("user", "name email");
      if (!order.user?.email) {
        throw new Error("Customer email address is unavailable.");
      }

      const productRows = order.orderItems.map((item, index) => `
        <tr style="background-color:${index % 2 ? "#fffafd" : "#ffffff"}">
          <td style="padding:13px 12px;border-bottom:1px solid #f3e5ec;color:#352536;font-size:14px;line-height:1.45">${escapeHtml(item.name)}</td>
          <td style="padding:13px 8px;border-bottom:1px solid #f3e5ec;text-align:center;color:#645564;font-size:13px">${Number(item.quantity)}</td>
          <td style="padding:13px 8px;border-bottom:1px solid #f3e5ec;text-align:right;color:#645564;font-size:13px;white-space:nowrap">${formatCurrency(item.price)}</td>
          <td style="padding:13px 12px;border-bottom:1px solid #f3e5ec;text-align:right;color:#352536;font-size:13px;font-weight:700;white-space:nowrap">${formatCurrency(Number(item.price) * Number(item.quantity))}</td>
        </tr>`).join("");
      const statusColors = {
        Pending: ["#fff3d6", "#805400"],
        Processing: ["#f1eaff", "#6941a5"],
        Shipped: ["#e9f2ff", "#315d9a"],
        Completed: ["#e5f6ec", "#267044"],
        Cancelled: ["#ffebed", "#a13a4a"],
      };
      const [statusBackground, statusForeground] = statusColors[order.orderStatus] || ["#fce8f1", "#a13f68"];

      const html = `
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Your J&amp;J K-POP order status has been updated. Your itemized receipt is attached.</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:28px 12px;background-color:#fff6fa;font-family:Arial,Helvetica,sans-serif;color:#352536">
          <tr><td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;background:#ffffff;border:1px solid #f0dce5;border-radius:18px;overflow:hidden">
              <tr><td style="padding:26px 32px;background-color:#321d32;border-bottom:5px solid #ed5791">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="font-size:22px;line-height:1.2;font-weight:800;color:#ffffff">J&amp;J <span style="color:#ff79ad">K-POP</span> <span style="color:#ff79ad">&#9825;</span><div style="padding-top:6px;font-size:11px;letter-spacing:2px;font-weight:600;color:#f8dce8">MERCHANDISE STORE</div></td>
                  <td align="right" style="font-size:11px;line-height:1.5;letter-spacing:1px;color:#f8dce8">ORDER UPDATE<br><span style="font-size:13px;font-weight:700;color:#ffffff">#${escapeHtml(String(order._id).slice(-8).toUpperCase())}</span></td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:30px 32px 18px">
                <p style="margin:0 0 8px;font-size:14px;color:#786879">Hello ${escapeHtml(order.user.name || "Customer")},</p>
                <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25;color:#352536">Your order has been updated</h1>
                <p style="margin:0;color:#786879;font-size:14px;line-height:1.65">Here is the latest update for your J&amp;J K-POP purchase.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px"><tr><td style="padding:8px 14px;border-radius:20px;background:${statusBackground};color:${statusForeground};font-size:13px;font-weight:700">${escapeHtml(order.orderStatus)}</td><td style="padding-left:12px;color:#786879;font-size:12px">Order #${escapeHtml(String(order._id))}</td></tr></table>
              </td></tr>
              <tr><td style="padding:8px 32px 8px">
                <h2 style="margin:0 0 12px;font-size:16px;color:#352536">Products / Services</h2>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #f0e3e9;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden">
                  <thead><tr style="background:#fff0f6"><th align="left" style="padding:11px 12px;color:#914363;font-size:11px;text-transform:uppercase;letter-spacing:.5px">Item</th><th style="padding:11px 8px;color:#914363;font-size:11px;text-transform:uppercase">Qty</th><th align="right" style="padding:11px 8px;color:#914363;font-size:11px;text-transform:uppercase">Unit price</th><th align="right" style="padding:11px 12px;color:#914363;font-size:11px;text-transform:uppercase">Subtotal</th></tr></thead>
                  <tbody>${productRows}</tbody>
                </table>
              </td></tr>
              <tr><td style="padding:18px 32px 28px">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td></td><td width="270">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;color:#786879">
                    <tr><td style="padding:6px 0">Subtotal</td><td align="right" style="padding:6px 0;color:#352536;font-weight:700">${formatCurrency(order.itemsPrice)}</td></tr>
                    <tr><td style="padding:6px 0">Tax</td><td align="right" style="padding:6px 0">${formatCurrency(order.taxPrice)}</td></tr>
                    <tr><td style="padding:6px 0 12px">Shipping</td><td align="right" style="padding:6px 0 12px">${formatCurrency(order.shippingPrice)}</td></tr>
                    <tr><td colspan="2" style="border-top:1px solid #ecdce4"></td></tr>
                    <tr><td style="padding:13px 0 0;font-size:15px;color:#352536;font-weight:800">Grand total</td><td align="right" style="padding:13px 0 0;color:#d84480;font-size:17px;font-weight:800;white-space:nowrap">${formatCurrency(order.totalPrice)}</td></tr>
                  </table>
                </td></tr></table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;background:#fff6fa;border:1px solid #f4e1e9;border-radius:10px"><tr><td style="padding:14px 16px;color:#665769;font-size:13px;line-height:1.6"><strong style="color:#352536">Your receipt is attached</strong><br>Keep the PDF receipt for your transaction records.</td><td align="right" style="padding:14px 16px;font-size:22px;color:#ed5791">&#128196;</td></tr></table>
              </td></tr>
              <tr><td align="center" style="padding:18px 24px;background:#321d32;color:#e8d9e4;font-size:11px;line-height:1.6">Thank you for shopping with J&amp;J K-POP &#9825;<br><span style="color:#cbb8c8">This is an automated order update.</span></td></tr>
            </table>
          </td></tr>
        </table>`;

      await sendEmail({
        email: order.user.email,
        subject: `Order ${String(order._id).slice(-8).toUpperCase()} status: ${order.orderStatus}`,
        html,
        attachments: [{
          filename: `receipt-${order._id}.pdf`,
          content: createOrderReceiptPdf(order),
          contentType: "application/pdf",
        }],
      });
      emailSent = true;
      order.statusEmailSentAt = new Date();
      await order.save();
      emailMessage = " Customer email and PDF receipt sent.";
    } catch (emailError) {
      console.error("Order status email failed:", emailError.message);
      emailMessage = " Status was updated, but the customer email could not be sent. Check the SMTP settings and customer email address.";
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated successfully.${emailMessage}`,
      emailSent,
      order,
    });
  } catch (error) {
    console.error("Update order failed:", error);

    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "CastError"
          ? "Invalid order ID"
          : "Failed to update order status",
    });
  }
};

// Delete an order.
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order failed:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to delete order",
    });
  }
};
