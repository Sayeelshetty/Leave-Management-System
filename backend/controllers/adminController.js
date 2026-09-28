const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ===============================
// ADD EMPLOYEE
// ===============================
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, leaveBalance } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingEmployee = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const initialBalance =
      leaveBalance === undefined || leaveBalance === ""
        ? 20
        : Number(leaveBalance);

    if (
      Number.isNaN(initialBalance) ||
      initialBalance < 0 ||
      !Number.isInteger(initialBalance)
    ) {
      return res.status(400).json({
        success: false,
        message: "Leave balance must be a non-negative whole number.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "employee",
      leaveBalance: initialBalance,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        leaveBalance: employee.leaveBalance,
        createdAt: employee.createdAt,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create employee.",
    });
  }
};

// ===============================
// GET ALL EMPLOYEES
// ===============================
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees.",
    });
  }
};

// ===============================
// CREDIT / DEBIT LEAVE BALANCE
// ===============================
const adjustLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount, reason } = req.body;

    if (!["credit", "debit"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either credit or debit.",
      });
    }

    const adjustmentAmount = Number(amount);

    if (
      Number.isNaN(adjustmentAmount) ||
      adjustmentAmount <= 0 ||
      !Number.isInteger(adjustmentAmount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive whole number.",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for balance adjustment.",
      });
    }

    const employee = await User.findOne({
      _id: id,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (
      action === "debit" &&
      employee.leaveBalance < adjustmentAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee does not have enough leave balance.",
      });
    }

    if (action === "credit") {
      employee.leaveBalance += adjustmentAmount;
    } else {
      employee.leaveBalance -= adjustmentAmount;
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: `Leave balance ${action}ed successfully.`,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        leaveBalance: employee.leaveBalance,
      },
      adjustment: {
        action,
        amount: adjustmentAmount,
        reason: reason.trim(),
      },
    });
  } catch (error) {
    console.error("Adjust leave balance error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to adjust leave balance.",
    });
  }
};

// ===============================
// ADMIN DASHBOARD STATISTICS
// ===============================
const getDashboardStats = async (req, res) => {
  try {
    const Leave = require("../models/Leave");

    const [
      totalEmployees,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    ] = await Promise.all([
      User.countDocuments({ role: "employee" }),
      Leave.countDocuments({ status: "pending" }),
      Leave.countDocuments({ status: "approved" }),
      Leave.countDocuments({ status: "rejected" }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  adjustLeaveBalance,
  getDashboardStats,
};