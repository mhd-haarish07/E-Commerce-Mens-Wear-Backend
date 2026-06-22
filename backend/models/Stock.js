const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  productId: { type: Number, required: true, unique: true, index: true },
  stock:     { type: Number, required: true, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Stock", stockSchema);
