import { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

export default function ParentPendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  async function loadLeaves() {
    try {
      const res = await api.get("/parent/pending-leaves");
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Failed to load pending leaves:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  async function handleApprove(id) {
    setActionId(id);
    try {
      await api.patch(`/parent/leave/${id}/approve`);
      await loadLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id) {
    setActionId(id);
    try {
      await api.patch(`/parent/leave/${id}/reject`);
      await loadLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject.");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <ParentShell title="Pending Approvals" backTo="/dashboard/parent">
        <div className="parent-surface parent-panel-card">
          <p style={{ color: "#8c857c" }}>Loading...</p>
        </div>
      </ParentShell>
    );
  }

  if (leaves.length === 0) {
    return (
      <ParentShell title="Pending Approvals" backTo="/dashboard/parent">
        <div className="parent-surface parent-empty-state">
          <h3>No Pending Approvals</h3>
          <p>Your child's leave requests will appear here for your review.</p>
        </div>
      </ParentShell>
    );
  }

  return (
    <ParentShell title="Pending Approvals" backTo="/dashboard/parent">
      <div className="parent-leave-list">
        {leaves.map((leave) => (
          <div className="parent-surface parent-leave-card" key={leave.id}>
            <div className="parent-leave-header">
              <span className="parent-leave-type">{leave.type}</span>
              <span className="parent-status-pill is-pending_parent">
                PENDING PARENT
              </span>
            </div>

            <div className="parent-leave-details">
              <div className="parent-detail-row">
                <span className="label">From</span>
                <span className="value">
                  {new Date(leave.startDate).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div className="parent-detail-row">
                <span className="label">To</span>
                <span className="value">
                  {new Date(leave.endDate).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div className="parent-detail-row">
                <span className="label">Purpose</span>
                <span className="value">{leave.purpose || "—"}</span>
              </div>
              <div className="parent-detail-row">
                <span className="label">Place</span>
                <span className="value">{leave.place || "—"}</span>
              </div>
              <div className="parent-detail-row">
                <span className="label">Contact</span>
                <span className="value">{leave.contactNumber || "—"}</span>
              </div>
            </div>

            <div className="parent-leave-actions">
              <button
                className="parent-primary-button"
                onClick={() => handleApprove(leave.id)}
                disabled={actionId === leave.id}
              >
                {actionId === leave.id ? "Processing..." : "Approve"}
              </button>
              <button
                className="parent-danger-button"
                onClick={() => handleReject(leave.id)}
                disabled={actionId === leave.id}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </ParentShell>
  );
}