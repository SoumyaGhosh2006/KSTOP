import { useEffect, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isUrgent(leave) {
  const attendance = leave.student?.attendancePercentage;
  return leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);
}

export default function LeaveQueue() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  async function loadQueue() {
    try {
      const res = await api.get("/mentor/leave-queue");
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Failed to load leave queue:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  async function handleApprove(id) {
    setActionId(id);
    try {
      await api.patch(`/mentor/leave/${id}/approve`);
      await loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve this leave.");
    } finally {
      setActionId(null);
    }
  }

  function openRejectBox(id) {
    setRejectingId(id);
    setRejectReason("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
  }

  async function confirmReject(id) {
    setActionId(id);
    try {
      await api.patch(`/mentor/leave/${id}/reject`, { reason: rejectReason });
      setRejectingId(null);
      setRejectReason("");
      await loadQueue();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject this leave.");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <MentorShell title="Leave Queue" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-panel-card mentor-loading-row">
          <span className="mentor-spinner" />
          Loading the leave queue...
        </div>
      </MentorShell>
    );
  }

  if (leaves.length === 0) {
    return (
      <MentorShell title="Leave Queue" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-empty-state">
          <h3>Nothing waiting on you</h3>
          <p>Leave requests show up here once a student's parent has approved them.</p>
        </div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="Leave Queue" backTo="/dashboard/mentor">
      <div className="mentor-card-list">
        {leaves.map((leave) => {
          const urgent = isUrgent(leave);
          const isExpanded = expandedId === leave.id;
          const isRejecting = rejectingId === leave.id;
          const isBusy = actionId === leave.id;
          const attendance = leave.student?.attendancePercentage;

          return (
            <article className="mentor-surface mentor-expandable-card" key={leave.id}>
              <div className="mentor-expandable-card__top">
                <div className="mentor-expandable-card__who">
                  <h3>{leave.student?.name || "Student"}</h3>
                  <p>Roll No. {leave.student?.rollNumber || "—"}</p>
                </div>
                <div className="mentor-expandable-card__badges">
                  {urgent ? <span className="mentor-status-pill is-urgent">Urgent</span> : null}
                  <span className="mentor-status-pill is-pending">{leave.type} Leave</span>
                </div>
              </div>

              <div className="mentor-nudge-banner">
                💬 {leave.student?.name || "This student"}'s parent has given their approval. Now it's your turn to decide.
              </div>

              <div className="mentor-detail-grid">
                <div className="mentor-detail-row">
                  <span className="label">From</span>
                  <span className="value">{formatDate(leave.startDate)}</span>
                </div>
                <div className="mentor-detail-row">
                  <span className="label">To</span>
                  <span className="value">{formatDate(leave.endDate)}</span>
                </div>
                <div className="mentor-detail-row">
                  <span className="label">Purpose</span>
                  <span className="value">{leave.purpose || "—"}</span>
                </div>
                <div className="mentor-detail-row">
                  <span className="label">Place</span>
                  <span className="value">{leave.place || "—"}</span>
                </div>
                <div className="mentor-detail-row">
                  <span className="label">Contact</span>
                  <span className="value">{leave.contactNumber || "—"}</span>
                </div>
                <div className="mentor-detail-row">
                  <span className="label">Arrival Details</span>
                  <span className="value">{leave.arrivalDetails || "—"}</span>
                </div>
              </div>

              {!isRejecting ? (
                <div className="mentor-card-actions">
                  <button
                    className="mentor-primary-button"
                    onClick={() => handleApprove(leave.id)}
                    disabled={isBusy}
                  >
                    {isBusy ? "Processing..." : "Approve"}
                  </button>
                  <button
                    className="mentor-danger-button"
                    onClick={() => openRejectBox(leave.id)}
                    disabled={isBusy}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="mentor-reason-box">
                  <label className="label" htmlFor={`reason-${leave.id}`}>
                    Reason for rejection (optional, shared with the student)
                  </label>
                  <textarea
                    id={`reason-${leave.id}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please reapply with a parent contact number"
                  />
                  <div className="mentor-reason-box__actions">
                    <button className="mentor-dark-button" onClick={cancelReject} disabled={isBusy}>
                      Cancel
                    </button>
                    <button
                      className="mentor-danger-button"
                      onClick={() => confirmReject(leave.id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Rejecting..." : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`mentor-dropdown-toggle${isExpanded ? " is-open" : ""}`}
                onClick={() => toggleExpanded(leave.id)}
              >
                {isExpanded ? "Hide attendance & academic details" : "View attendance & academic details"}
                <span className="mentor-dropdown-toggle__chevron">▾</span>
              </button>

              {isExpanded ? (
                <div className="mentor-dropdown-panel">
                  <div className="mentor-mini-grid">
                    <div className="mentor-mini-stat">
                      <span className="label">Attendance</span>
                      <span className={`value${typeof attendance === "number" && attendance < 75 ? " is-low" : ""}`}>
                        {typeof attendance === "number" ? `${attendance}%` : "—"}
                      </span>
                    </div>
                    <div className="mentor-mini-stat">
                      <span className="label">Academic Details</span>
                      <span className="value">{leave.student?.academicDetails || "Not recorded"}</span>
                    </div>
                  </div>

                  <p className="mentor-history-title">Recent Leave History</p>
                  {leave.student?.recentLeaves?.length > 0 ? (
                    <div className="mentor-history-list">
                      {leave.student.recentLeaves.map((h) => (
                        <div className="mentor-history-item" key={h.id}>
                          <span>{h.type}</span>
                          <span className="mentor-history-item__dates">
                            {formatDate(h.startDate)} – {formatDate(h.endDate)}
                          </span>
                          <span className={`mentor-status-pill is-${h.status?.toLowerCase()}`}>
                            {h.status?.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mentor-empty-inline">No previous leave history yet.</p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </MentorShell>
  );
}