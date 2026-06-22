const express = require("express");
const router  = express.Router();
const Order   = require("../models/Order");
const { protect, admin } = require("../middleware/auth");

// POST /api/orders
router.post("/", protect, async (req, res) => {
  try {
    const { items, total, discount, shipping, address,
            paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId } = req.body;
    const order = await Order.create({
      user: req.user._id, items, total, discount, shipping, address,
      paymentMethod:     paymentMethod     || "cod",
      paymentStatus:     paymentStatus     || "pending",
      razorpayOrderId:   razorpayOrderId   || "",
      razorpayPaymentId: razorpayPaymentId || "",
    });
    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/stats (admin) — dashboard summary numbers
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find();
    const totalRevenue = orders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    const User = require("../models/User");
    const totalUsers = await User.countDocuments();

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalUsers,
      statusCounts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders (admin)
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort("-createdAt");
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/cancel — user can cancel their own order
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: `Order already ${order.status} — cannot cancel` });
    }

    order.status = "cancelled";
    await order.save();
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/orders/:id — user can remove a cancelled/pending order from their list
router.delete("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({ message: "Cannot remove a shipped/delivered order" });
    }

    await order.deleteOne();
    res.json({ message: "Order removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
