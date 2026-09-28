import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });

  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    leaveBalance: 20,
  });

  const [balanceForm, setBalanceForm] = useState({
    action: "credit",
    amount: 1,
    reason: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== "admin") {
        navigate("/employee");
        return;
      }

      setUser(parsedUser);

      loadDashboard();
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  // ===============================
  // LOAD DASHBOARD
  // ===============================
  const loadDashboard = async () => {
    await Promise.all([
      fetchPendingLeaves(),
      fetchEmployees(),
      fetchDashboardStats(),
    ]);
  };

  // ===============================
  // FETCH PENDING LEAVES
  // ===============================
  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/leaves/admin/pending");

      setLeaves(response.data.leaves || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      if (requestError.response?.status === 403) {
        setError("You do not have admin access.");
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load pending leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FETCH EMPLOYEES
  // ===============================
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);

      const response = await api.get("/admin/employees");

      setEmployees(response.data.employees || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load employees."
      );
    } finally {
      setEmployeesLoading(false);
    }
  };

  // ===============================
  // FETCH DASHBOARD STATS
  // ===============================
  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/admin/stats");

      setDashboardStats(
        response.data.stats || {
          totalEmployees: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
        }
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load dashboard statistics."
      );
    }
  };

  // ===============================
  // APPROVE LEAVE
  // ===============================
  const handleApprove = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      setError("");
      setMessage("");

      const response = await api.put(
        `/leaves/admin/${leaveId}/approve`,
        {
          adminComment: "Approved",
        }
      );

      setMessage(
        response.data.message ||
          "Leave approved successfully."
      );

      await loadDashboard();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to approve this leave."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ===============================
  // REJECT LEAVE
  // ===============================
  const handleReject = async (leaveId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(leaveId);
      setError("");
      setMessage("");

      const response = await api.put(
        `/leaves/admin/${leaveId}/reject`,
        {
          adminComment: "Rejected by admin",
        }
      );

      setMessage(
        response.data.message ||
          "Leave rejected successfully."
      );

      await loadDashboard();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to reject this leave."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ===============================
  // ADD EMPLOYEE
  // ===============================
  const handleAddEmployee = async (event) => {
    event.preventDefault();

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      const response = await api.post(
        "/admin/employees",
        {
          name: employeeForm.name,
          email: employeeForm.email,
          password: employeeForm.password,
          leaveBalance: Number(
            employeeForm.leaveBalance
          ),
        }
      );

      setMessage(
        response.data.message ||
          "Employee created successfully."
      );

      setEmployeeForm({
        name: "",
        email: "",
        password: "",
        leaveBalance: 20,
      });

      setShowAddEmployee(false);

      await Promise.all([
        fetchEmployees(),
        fetchDashboardStats(),
      ]);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to create employee."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ===============================
  // OPEN BALANCE MODAL
  // ===============================
  const openBalanceModal = (employee) => {
    setSelectedEmployee(employee);

    setBalanceForm({
      action: "credit",
      amount: 1,
      reason: "",
    });

    setShowBalanceModal(true);
  };

  // ===============================
  // UPDATE BALANCE
  // ===============================
  const handleBalanceUpdate = async (event) => {
    event.preventDefault();

    if (!selectedEmployee) {
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      setMessage("");

      const response = await api.put(
        `/admin/employees/${selectedEmployee._id}/balance`,
        {
          action: balanceForm.action,
          amount: Number(balanceForm.amount),
          reason: balanceForm.reason,
        }
      );

      setMessage(
        response.data.message ||
          "Leave balance updated successfully."
      );

      setShowBalanceModal(false);
      setSelectedEmployee(null);

      await fetchEmployees();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update leave balance."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ===============================
  // LOGOUT
  // ===============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // ===============================
  // PENDING STATS
  // ===============================
  const pendingStats = useMemo(() => {
    const totalDays = leaves.reduce(
      (total, leave) =>
        total + leave.numberOfDays,
      0
    );

    return {
      pending: leaves.length,
      totalDays,
    };
  }, [leaves]);

  // ===============================
  // FORMAT DATE
  // ===============================
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="admin-dashboard">
      {/* ===============================
          HEADER
      =============================== */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7 3V6M17 3V6M4 9H20M6 5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4 5 6 5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 13H8.01M12 13H12.01M16 13H16.01"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <span>LeaveFlow</span>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

            <div className="admin-user-info">
              <strong>
                {user?.name || "Administrator"}
              </strong>

              <span>Administrator</span>
            </div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {/* ===============================
            WELCOME
        =============================== */}
        <section className="admin-welcome">
          <div>
            <span className="admin-eyebrow">
              ADMINISTRATION
            </span>

            <h1>Leave management</h1>

            <p>
              Manage employees and review leave
              requests from one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            Refresh
          </button>
        </section>

        {/* ===============================
            ALERTS
        =============================== */}
        {error && (
          <div className="admin-alert admin-alert-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="admin-alert admin-alert-success">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* ===============================
            DASHBOARD STATISTICS
        =============================== */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card admin-stat-primary">
            <div className="admin-stat-label">
              Total employees
            </div>

            <strong>
              {dashboardStats.totalEmployees}
            </strong>

            <span>Registered employees</span>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">
              Pending requests
            </div>

            <strong>
              {dashboardStats.pendingRequests}
            </strong>

            <span>Waiting for review</span>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">
              Approved
            </div>

            <strong>
              {dashboardStats.approvedRequests}
            </strong>

            <span>Approved leave requests</span>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">
              Rejected
            </div>

            <strong>
              {dashboardStats.rejectedRequests}
            </strong>

            <span>Rejected leave requests</span>
          </div>
        </section>

        {/* ===============================
            EMPLOYEE MANAGEMENT
        =============================== */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span className="admin-panel-eyebrow">
                EMPLOYEE MANAGEMENT
              </span>

              <h2>Employees</h2>

              <p>
                Add employees and manage their leave
                balances.
              </p>
            </div>

            <button
              type="button"
              className="approve-button"
              onClick={() =>
                setShowAddEmployee(true)
              }
            >
              + Add Employee
            </button>
          </div>

          {employeesLoading ? (
            <div className="admin-empty-state">
              <div className="admin-loader"></div>

              <strong>
                Loading employees...
              </strong>

              <p>
                Fetching employee information.
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No employees found</strong>

              <p>
                Add your first employee to get
                started.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Leave balance</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-table-avatar">
                            {employee.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>

                          <div>
                            <strong>
                              {employee.name}
                            </strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        {employee.email}
                      </td>

                      <td>
                        <span className="balance-value">
                          {employee.leaveBalance} days
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          employee.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-refresh-button"
                          onClick={() =>
                            openBalanceModal(
                              employee
                            )
                          }
                        >
                          Manage Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ===============================
            PENDING LEAVE REQUESTS
        =============================== */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span className="admin-panel-eyebrow">
                REVIEW QUEUE
              </span>

              <h2>Pending leave requests</h2>

              <p>
                Approve or reject employee requests
                after reviewing the details.
              </p>
            </div>

            <div className="pending-count">
              {leaves.length} pending
            </div>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <div className="admin-loader"></div>

              <strong>
                Loading requests...
              </strong>

              <p>
                Fetching the latest pending leave
                requests.
              </p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12.5L9.5 17L19 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <strong>All caught up</strong>

              <p>
                There are currently no pending leave
                requests.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-table-avatar">
                            {leave.employee?.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div>
                            <strong>
                              {leave.employee?.name ||
                                "Unknown"}
                            </strong>

                            <span>
                              {leave.employee?.email ||
                                "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-leave-type">
                          {leave.leaveType}
                        </span>
                      </td>

                      <td>
                        <div className="admin-date-cell">
                          <strong>
                            {formatDate(
                              leave.startDate
                            )}
                          </strong>

                          <span>to</span>

                          <strong>
                            {formatDate(
                              leave.endDate
                            )}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {leave.numberOfDays}
                        </strong>
                      </td>

                      <td>
                        <span className="admin-reason">
                          {leave.reason}
                        </span>
                      </td>

                      <td>
                        <span className="balance-value">
                          {leave.employee
                            ?.leaveBalance ??
                            "-"}{" "}
                          days
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="approve-button"
                            onClick={() =>
                              handleApprove(
                                leave._id
                              )
                            }
                            disabled={
                              processingId ===
                              leave._id
                            }
                          >
                            {processingId ===
                            leave._id
                              ? "..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="reject-button"
                            onClick={() =>
                              handleReject(
                                leave._id
                              )
                            }
                            disabled={
                              processingId ===
                              leave._id
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {leaves.length > 0 && (
            <div
              style={{
                padding: "16px 20px",
                borderTop:
                  "1px solid rgba(0, 0, 0, 0.06)",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              Total requested days in pending
              requests:{" "}
              <strong>
                {pendingStats.totalDays}
              </strong>
            </div>
          )}
        </section>
      </main>

      {/* ===============================
          ADD EMPLOYEE MODAL
      =============================== */}
      {showAddEmployee && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <span className="admin-panel-eyebrow">
                  EMPLOYEE MANAGEMENT
                </span>

                <h2>Add Employee</h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setShowAddEmployee(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddEmployee}
              className="admin-form"
            >
              <label>
                Name
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter employee name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="employee@company.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={employeeForm.password}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      password:
                        event.target.value,
                    })
                  }
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </label>

              <label>
                Initial leave balance
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={employeeForm.leaveBalance}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      leaveBalance:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="reject-button"
                  onClick={() =>
                    setShowAddEmployee(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="approve-button"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Creating..."
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===============================
          BALANCE MODAL
      =============================== */}
      {showBalanceModal &&
        selectedEmployee && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <div>
                  <span className="admin-panel-eyebrow">
                    LEAVE BALANCE
                  </span>

                  <h2>
                    {selectedEmployee.name}
                  </h2>

                  <p>
                    Current balance:{" "}
                    <strong>
                      {
                        selectedEmployee.leaveBalance
                      }{" "}
                      days
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setShowBalanceModal(false)
                  }
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleBalanceUpdate}
                className="admin-form"
              >
                <label>
                  Action
                  <select
                    value={balanceForm.action}
                    onChange={(event) =>
                      setBalanceForm({
                        ...balanceForm,
                        action: event.target.value,
                      })
                    }
                  >
                    <option value="credit">
                      Credit days
                    </option>

                    <option value="debit">
                      Debit days
                    </option>
                  </select>
                </label>

                <label>
                  Number of days
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={balanceForm.amount}
                    onChange={(event) =>
                      setBalanceForm({
                        ...balanceForm,
                        amount:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Reason for adjustment
                  <textarea
                    value={balanceForm.reason}
                    onChange={(event) =>
                      setBalanceForm({
                        ...balanceForm,
                        reason:
                          event.target.value,
                      })
                    }
                    placeholder="Enter reason for this adjustment"
                    rows="4"
                    required
                  />
                </label>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="reject-button"
                    onClick={() =>
                      setShowBalanceModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="approve-button"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Updating..."
                      : "Update Balance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminDashboard;