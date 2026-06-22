const express = require("express");
const router  = express.Router();
const Review  = require("../models/Review");
const { protect } = require("../middleware/auth");

// GET /api/reviews/:productId
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort("-createdAt");
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    res.json({ reviews, avgRating: parseFloat(avg.toFixed(1)), total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reviews/:productId
router.post("/:productId", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findOne({ productId: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: "You already reviewed this product" });

    const review = await Review.create({
      productId: req.params.productId,
      user:      req.user._id,
      userName:  req.user.name,
      rating,
      comment,
    });
    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/reviews/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorised" });
    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
