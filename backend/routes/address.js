const express = require("express");
const router  = express.Router();
const Address = require("../models/Address");
const { protect } = require("../middleware/auth");

// GET /api/address — get all addresses for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort("-isDefault -createdAt");
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/address — add a new address
router.post("/", protect, async (req, res) => {
  try {
    const { label, name, phone, street, city, state, pincode, isDefault } = req.body;
    if (!name || !phone || !street || !city || !state || !pincode)
      return res.status(400).json({ message: "All address fields are required" });

    // If this is set as default, unset default on others
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    // If user has no addresses yet, make this one default automatically
    const existingCount = await Address.countDocuments({ user: req.user._id });

    const address = await Address.create({
      user: req.user._id, label, name, phone, street, city, state, pincode,
      isDefault: isDefault || existingCount === 0,
    });
    res.status(201).json({ address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/address/:id — update an address
router.put("/:id", protect, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const { label, name, phone, street, city, state, pincode, isDefault } = req.body;
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }
    Object.assign(address, { label, name, phone, street, city, state, pincode, isDefault });
    await address.save();
    res.json({ address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/address/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/address/:id/default — set as default
router.put("/:id/default", protect, async (req, res) => {
  try {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json({ address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
