const express = require("express");

const {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
} = require("../controllers/leaveController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Employee routes
router.post("/", protect, applyLeave);

router.get("/my-leaves", protect, getMyLeaves);

router.get("/balance", protect, getMyLeaveBalance);

// Admin routes
router.get("/admin/pending", protect, adminOnly, getPendingLeaves);

router.put(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveLeave
);

router.put(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectLeave
);

module.exports = router;