const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items:     [{
    productId: Number,
    name:      String,
    price:     Number,
    qty:       Number,
    size:      String,
    image:     String,
  }],
  total:     { type: Number, required: true },
  discount:  { type: Number, default: 0 },
  shipping:  { type: Number, default: 0 },
  status:    { type: String, enum: ["pending","processing","shipped","delivered","cancelled"], default: "pending" },
  paymentMethod:     { type: String, enum: ["card","upi","netbanking","cod"], default: "cod" },
  paymentStatus:     { type: String, enum: ["pending","paid","failed"], default: "pending" },
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  address:   {
    name:    String,
    phone:   String,
    street:  String,
    city:    String,
    state:   String,
    pincode: String,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
