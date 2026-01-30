require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

/* --------------------
   Middleware
-------------------- */
app.use(cors());
app.use(express.json());

/* --------------------
   MongoDB Connection
-------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB connection error ❌", err.message));

/* --------------------
   Stock Schema & Model
-------------------- */
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },

  totalStock: { type: Number, required: true },
  currentStock: { type: Number, required: true },

  price: { type: Number, required: true },

  arrivalDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },

  // Computed fields (stored for reference)
  marketValue: Number,
  finalPrice: Number,
  status: String,
  route: String
});

const Stock = mongoose.model("Stock", stockSchema);

/* --------------------
   Dynamic Pricing Logic
-------------------- */
function calculateStockIntelligence(stock) {
  const today = new Date();
  const expiry = new Date(stock.expiryDate);
  const arrival = new Date(stock.arrivalDate);

  const daysToExpiry = Math.ceil((expiry - today) / 86400000);
  const daysInStore = Math.ceil((today - arrival) / 86400000);
  const unsoldRatio = stock.currentStock / stock.totalStock;

  let discountRate = 0;
  let status = "Normal";
  let route = "Warehouse";

  if (daysToExpiry <= 1) {
    discountRate = 0.7;
    status = "Near Expiry";
  } else if (daysToExpiry <= 3) {
    discountRate = 0.5;
    status = "High Discount";
  } else if (daysToExpiry <= 7) {
    discountRate = 0.3;
    status = "Discounted";
  }

  if (daysInStore > 7 && unsoldRatio > 0.6) {
    discountRate += 0.1;
    status = "Slow Moving";
  }

  discountRate = Math.min(discountRate, 0.8);

  const finalPrice = Math.round(stock.price * (1 - discountRate));
  const marketValue = stock.currentStock * finalPrice;

  if (daysToExpiry <= 0 || finalPrice <= stock.price * 0.2) {
    status = "Donate";
    route = "NGO";
  } else if (discountRate > 0) {
    route = "Marketplace";
  }

  return {
    daysToExpiry,
    daysInStore,
    marketValue,
    finalPrice,
    status,
    route
  };
}

/* --------------------
   Routes
-------------------- */

// Health check
app.get("/", (req, res) => {
  res.send("Server + DB running 🚀");
});

// Add stock
app.post("/api/stock", async (req, res) => {
  try {
    const intelligence = calculateStockIntelligence(req.body);
    const stock = new Stock({ ...req.body, ...intelligence });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all stock
app.get("/api/stock", async (req, res) => {
  try {
    const stocks = await Stock.find();

    const updatedStocks = stocks.map(stock => ({
      ...stock.toObject(),
      ...calculateStockIntelligence(stock)
    }));

    res.json(updatedStocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stock
app.delete("/api/stock/:id", async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ message: "Stock deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* --------------------
   Start Server (LAST LINE)
-------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
