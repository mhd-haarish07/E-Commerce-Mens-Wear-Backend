const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const dotenv     = require("dotenv");

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/orders",  require("./routes/orders"));
app.use("/api/address", require("./routes/address"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/stock",   require("./routes/stock"));

// Health check
app.get("/api/health", (_, res) => res.json({ status: "TN91 API running ✓" }));

// Connect DB & Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });
