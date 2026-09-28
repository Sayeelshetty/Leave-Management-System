const Leave = require("../models/Leave");
const User = require("../models/User");

// Calculate inclusive number of days
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const difference = end.getTime() - start.getTime();

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
};

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Leave type, start date, end date and reason are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date provided",
      });
    }

    if (end < start) {
  return res.status(400).json({
    success: false,
    message: "End date cannot be before start date",
  });
}

// Prevent employees from applying for leave in the past
const today = new Date();
today.setHours(0, 0, 0, 0);

const requestedStartDate = new Date(start);
requestedStartDate.setHours(0, 0, 0, 0);

if (requestedStartDate < today) {
  return res.status(400).json({
    success: false,
    message: "Leave start date cannot be in the past",
  });
}

    const numberOfDays = calculateDays(startDate, endDate);

    if (numberOfDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave duration",
      });
    }

    // Check for overlapping pending or approved leaves
    const overlappingLeave = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending or approved leave for these dates",
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      status: "pending",
    });

    const populatedLeave = await Leave.findById(leave._id).populate(
      "employee",
      "name email role"
    );

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      leave: populatedLeave,
    });
  } catch (error) {
    console.error("Apply leave error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while applying for leave",
    });
  }
};

// Get current employee's leave history
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.user._id,
    })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error("Get leave history error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching leave history",
    });
  }
};

// Get current employee's leave balance
const getMyLeaveBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email role leaveBalance"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      leaveBalance: user.leaveBalance,
    });
  } catch (error) {
    console.error("Get leave balance error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching leave balance",
    });
  }
};

// Admin: get all pending leaves
const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      status: "pending",
    })
      .populate("employee", "name email role leaveBalance")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error("Get pending leaves error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching pending leaves",
    });
  }
};

// Admin: approve leave
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment = "" } = req.body;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave application not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}`,
      });
    }

    const employee = await User.findById(leave.employee);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.leaveBalance < leave.numberOfDays) {
      return res.status(400).json({
        success: false,
        message: "Employee does not have enough leave balance",
      });
    }

    // Deduct leave only after approval
    employee.leaveBalance -= leave.numberOfDays;
    await employee.save();

    leave.status = "approved";
    leave.adminComment = adminComment;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate("employee", "name email role leaveBalance")
      .populate("reviewedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Leave approved successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    console.error("Approve leave error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while approving leave",
    });
  }
};

// Admin: reject leave
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment = "" } = req.body;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave application not found",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}`,
      });
    }

    leave.status = "rejected";
    leave.adminComment = adminComment;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate("employee", "name email role")
      .populate("reviewedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Leave rejected successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    console.error("Reject leave error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while rejecting leave",
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
};