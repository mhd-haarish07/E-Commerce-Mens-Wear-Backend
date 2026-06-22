const express = require("express");
const router  = express.Router();
const Stock   = require("../models/Stock");
const { protect, admin } = require("../middleware/auth");

// GET /api/stock — public; returns a map { productId: stock } of all DB records.
// Products without a record fall back to their static value on the frontend.
router.get("/", async (_req, res) => {
  try {
    const docs = await Stock.find();
    const map = {};
    docs.forEach((d) => { map[d.productId] = d.stock; });
    res.json({ stock: map });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/stock/:productId — admin; set stock for one product (upsert)
router.put("/:productId", protect, admin, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    let stock = Number(req.body.stock);
    if (Number.isNaN(productId)) return res.status(400).json({ message: "Invalid product id" });
    if (Number.isNaN(stock) || stock < 0) return res.status(400).json({ message: "Stock must be 0 or more" });
    stock = Math.floor(stock);

    const doc = await Stock.findOneAndUpdate(
      { productId },
      { stock, updatedAt: Date.now() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ stock: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/stock/seed — admin; bulk import initial stock from the catalog.
// Body: { items: [{ productId, stock }], overwrite?: boolean }
// By default only inserts products not already in the DB (won't clobber edits).
router.post("/seed", protect, admin, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const overwrite = !!req.body.overwrite;
    if (!items.length) return res.status(400).json({ message: "No items provided" });

    const ops = items
      .filter((i) => i && !Number.isNaN(Number(i.productId)))
      .map((i) => ({
        updateOne: {
          filter: { productId: Number(i.productId) },
          update: overwrite
            ? { $set: { stock: Math.max(0, Math.floor(Number(i.stock) || 0)), updatedAt: Date.now() } }
            : { $setOnInsert: { stock: Math.max(0, Math.floor(Number(i.stock) || 0)), updatedAt: Date.now() } },
          upsert: true,
        },
      }));

    await Stock.bulkWrite(ops);
    const docs = await Stock.find();
    const map = {};
    docs.forEach((d) => { map[d.productId] = d.stock; });
    res.json({ stock: map, count: docs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
