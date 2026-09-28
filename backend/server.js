const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

// Protected user route
app.get("/api/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Leave Management System API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});