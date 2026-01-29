require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("DB error ❌", err.message));

// Stock model
const Stock = mongoose.model("Stock", new mongoose.Schema({
  name: String,
  totalStock: Number,
  currentStock: Number,
  price: Number,
  arrivalDate: Date,
  expiryDate: Date,

  marketValue: Number,
  finalPrice: Number,
  status: String,
  route: String
}));

// Dynamic pricing algorithm
function calculateStockIntelligence(stock) {
  const today = new Date();
  const expiry = new Date(stock.expiryDate);

  const diffTime = expiry - today;
  const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const marketValue = stock.currentStock * stock.price;

  let discountRate = 0;
  let status = "Normal";
  let route = "Warehouse";

  if (daysToExpiry <= 1) {
    discountRate = 0.7;
    status = "Near Expiry";
    route = "Marketplace";
  } else if (daysToExpiry <= 3) {
    discountRate = 0.5;
    status = "High Discount";
    route = "Marketplace";
  } else if (daysToExpiry <= 7) {
    discountRate = 0.3;
    status = "Discounted";
    route = "Marketplace";
  }

  const finalPrice = Math.round(stock.price * (1 - discountRate));

  if (daysToExpiry <= 0 || marketValue < 0.2 * (stock.totalStock * stock.price)) {
    status = "Donate";
    route = "NGO";
  }

  return {
    daysToExpiry,
    marketValue,
    finalPrice,
    status,
    route
  };
}

// Routes
app.get("/", (req, res) => {
  res.send("Server + DB running 🚀");
});

app.post("/api/stock", async (req, res) => {
  try {
    const intelligence = calculateStockIntelligence(req.body);

    const stock = new Stock({
      ...req.body,
      marketValue: intelligence.marketValue,
      finalPrice: intelligence.finalPrice,
      status: intelligence.status,
      route: intelligence.route
    });

    await stock.save();
    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stock", async (req, res) => {
  const stocks = await Stock.find();

  const updatedStocks = stocks.map(stock => {
    const intelligence = calculateStockIntelligence(stock);
    return { ...stock.toObject(), ...intelligence };
  });

  res.json(updatedStocks);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
