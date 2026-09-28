const express = require("express");

const {
  createEmployee,
  getEmployees,
  adjustLeaveBalance,
  getDashboardStats,
} = require("../controllers/adminController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard statistics
router.get(
  "/stats",
  protect,
  adminOnly,
  getDashboardStats
);

// Add employee
router.post(
  "/employees",
  protect,
  adminOnly,
  createEmployee
);

// View employees
router.get(
  "/employees",
  protect,
  adminOnly,
  getEmployees
);

// Credit / Debit leave balance
router.put(
  "/employees/:id/balance",
  protect,
  adminOnly,
  adjustLeaveBalance
);

module.exports = router;