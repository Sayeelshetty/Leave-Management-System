import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [leaves, setLeaves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [balanceResponse, leavesResponse] = await Promise.all([
        api.get("/leaves/balance"),
        api.get("/leaves/my-leaves"),
      ]);

      setBalance(balanceResponse.data.leaveBalance);
      setLeaves(leavesResponse.data.leaves || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load your leave information."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.startDate || !formData.endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (formData.endDate < formData.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please provide a reason for your leave.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/leaves", {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });

      setMessage(
        response.data.message || "Leave request submitted successfully."
      );

      setFormData({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: "",
      });

      await fetchDashboardData();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to submit your leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const stats = useMemo(() => {
    return {
      total: leaves.length,
      approved: leaves.filter((leave) => leave.status === "approved").length,
      pending: leaves.filter((leave) => leave.status === "pending").length,
      rejected: leaves.filter((leave) => leave.status === "rejected").length,
    };
  }, [leaves]);

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) {
      return 0;
    }

    const start = new Date(`${formData.startDate}T00:00:00`);
    const end = new Date(`${formData.endDate}T00:00:00`);

    if (end < start) {
      return 0;
    }

    const difference = end.getTime() - start.getTime();

    return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays();

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
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

          <div className="dashboard-user">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <strong>{user?.name || "Employee"}</strong>
              <span>Employee</span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M10 17L15 12L10 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M19 4H20C20.6 4 21 4.4 21 5V19C21 19.6 20.6 20 20 20H19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">EMPLOYEE PORTAL</span>

            <h1>
              Welcome back,{" "}
              {user?.name?.split(" ")[0] || "there"}.
            </h1>

            <p>
              Manage your time off, check your balance, and keep track of
              your leave requests.
            </p>
          </div>
        </section>

        {error && (
          <div className="dashboard-alert dashboard-alert-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="dashboard-alert dashboard-alert-success">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card stat-card-highlight">
            <div className="stat-card-top">
              <span>Available leave</span>

              <div className="stat-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 3V21M3 12H21"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <strong>{loading ? "—" : balance}</strong>

            <span className="stat-description">
              Days currently available
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span>Total requests</span>

              <div className="stat-icon stat-icon-neutral">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8 3V6M16 3V6M4 9H20M6 5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4.9 5 6 5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <strong>{loading ? "—" : stats.total}</strong>

            <span className="stat-description">
              Leave requests submitted
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span>Pending</span>

              <div className="stat-icon stat-icon-warning">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 7V12L15 14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <strong>{loading ? "—" : stats.pending}</strong>

            <span className="stat-description">
              Awaiting admin review
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span>Approved</span>

              <div className="stat-icon stat-icon-success">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12.5L9.5 17L19 7.5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <strong>{loading ? "—" : stats.approved}</strong>

            <span className="stat-description">
              Requests approved
            </span>
          </div>
        </section>

        <section className="dashboard-content-grid">
          <div className="dashboard-panel apply-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">NEW REQUEST</span>
                <h2>Apply for leave</h2>
                <p>
                  Submit a leave request for your manager to review.
                </p>
              </div>

              <div className="panel-heading-icon">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <form
              className="leave-form"
              onSubmit={handleApplyLeave}
            >
              <div className="form-row">
                <div className="dashboard-form-group">
                  <label htmlFor="leaveType">Leave type</label>

                  <select
                    id="leaveType"
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                  >
                    <option value="casual">Casual leave</option>
                    <option value="sick">Sick leave</option>
                    <option value="earned">Earned leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="days-preview">
                  <span>Duration</span>
                  <strong>
                    {requestedDays > 0
                      ? `${requestedDays} ${
                          requestedDays === 1 ? "day" : "days"
                        }`
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="form-row">
                <div className="dashboard-form-group">
                  <label htmlFor="startDate">Start date</label>

                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="dashboard-form-group">
                  <label htmlFor="endDate">End date</label>

                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="dashboard-form-group">
                <label htmlFor="reason">Reason</label>

                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  placeholder="Briefly explain the reason for your leave..."
                  value={formData.reason}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="form-footer">
                <span>
                  Your request will remain pending until reviewed.
                </span>

                <button
                  type="submit"
                  className="submit-leave-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="dashboard-spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit request
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 12H19"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M13 6L19 12L13 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="dashboard-panel quick-panel">
            <div className="panel-heading compact-heading">
              <div>
                <span className="panel-eyebrow">OVERVIEW</span>
                <h2>Leave summary</h2>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-item">
                <div className="summary-item-label">
                  <span className="summary-dot summary-dot-approved"></span>
                  Approved
                </div>

                <strong>{stats.approved}</strong>
              </div>

              <div className="summary-item">
                <div className="summary-item-label">
                  <span className="summary-dot summary-dot-pending"></span>
                  Pending
                </div>

                <strong>{stats.pending}</strong>
              </div>

              <div className="summary-item">
                <div className="summary-item-label">
                  <span className="summary-dot summary-dot-rejected"></span>
                  Rejected
                </div>

                <strong>{stats.rejected}</strong>
              </div>
            </div>

            <div className="balance-note">
              <div className="balance-note-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 11V16"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                </svg>
              </div>

              <p>
                Approved leave is automatically deducted from your
                available balance.
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-panel history-panel">
          <div className="panel-heading history-heading">
            <div>
              <span className="panel-eyebrow">ACTIVITY</span>
              <h2>Leave history</h2>
              <p>Review all your submitted leave requests.</p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M20 11C19.5 7.6 16.6 5 13 5C9.1 5 6 8.1 6 12C6 15.9 9.1 19 13 19C16 19 18.5 17.1 19.5 14.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M20 5V11H14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-history">
              <div className="history-loader"></div>
              <p>Loading your leave history...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="empty-history">
              <div className="empty-history-icon">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M7 3V6M17 3V6M4 9H20M6 5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4.9 5 6 5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <strong>No leave requests yet</strong>
              <p>
                Your submitted requests will appear here.
              </p>
            </div>
          ) : (
            <div className="leave-table-wrapper">
              <table className="leave-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Admin comment</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <span className="leave-type">
                          {leave.leaveType}
                        </span>
                      </td>

                      <td>
                        <div className="date-range">
                          <strong>
                            {formatDate(leave.startDate)}
                          </strong>
                          <span>to</span>
                          <strong>
                            {formatDate(leave.endDate)}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <strong>{leave.numberOfDays}</strong>
                      </td>

                      <td>
                        <span className="reason-cell">
                          {leave.reason}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(leave.status)}>
                          <span className="status-dot"></span>
                          {leave.status}
                        </span>
                      </td>

                      <td>
                        <span className="comment-cell">
                          {leave.adminComment || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default EmployeeDashboard;