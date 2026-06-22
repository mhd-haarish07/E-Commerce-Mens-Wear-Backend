const express = require("express");
const router  = express.Router();
const crypto  = require("crypto");
const { protect } = require("../middleware/auth");

const KEY_ID     = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Razorpay is "live" only when both test keys are present in .env.
// Without keys the whole flow still works in SIMULATION mode so the
// project runs end-to-end before you sign up for Razorpay.
const isConfigured = () => Boolean(KEY_ID && KEY_SECRET);

let razorpay = null;
if (isConfigured()) {
  try {
    const Razorpay = require("razorpay");
    razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
    console.log("💳 Razorpay configured (live test mode)");
  } catch (e) {
    console.warn("⚠️  razorpay package not installed — run `npm install` in backend. Falling back to simulation.");
  }
}

// GET /api/payment/config — public; tells the frontend which mode we're in
router.get("/config", (_req, res) => {
  res.json({ configured: isConfigured() && !!razorpay, keyId: KEY_ID || null });
});

// POST /api/payment/create-order — create a Razorpay order (amount in rupees)
router.post("/create-order", protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const amountPaise = Math.round(amount * 100);

    // Simulation mode — no keys: return a fake order so the UI flow continues
    if (!razorpay) {
      return res.json({
        configured: false,
        order: { id: "sim_" + Date.now(), amount: amountPaise, currency: "INR" },
      });
    }

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: "INR",
      receipt:  "rcpt_" + Date.now(),
    });
    res.json({ configured: true, keyId: KEY_ID, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payment/verify — verify the signature returned by Razorpay checkout
router.post("/verify", protect, (req, res) => {
  try {
    // Simulation mode — nothing to verify
    if (!razorpay) return res.json({ verified: true, simulated: true });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, message: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ verified: false, message: "Signature verification failed" });
    }
    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
