const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName:  { type: String },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ productId: 1, user: 1 }, { unique: true }); // one review per user per product

module.exports = mongoose.model("Review", reviewSchema);
