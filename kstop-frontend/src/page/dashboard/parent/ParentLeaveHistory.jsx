import { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

const STATUS_MAP = {
  PENDING_PARENT: { label: "Pending Parent", className: "is-pending_parent" },
  PENDING_MENTOR: { label: "Pending Mentor", className: "is-pending_mentor" },
  APPROVED: { label: "Approved", className: "is-approved" },
  REJECTED: { label: "Rejected", className: "is-rejected" },
};

export default function ParentLeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/parent/leave-history")
      .then((res) => setLeaves(res.data.leaves || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ParentShell title="Leave History" backTo="/dashboard/parent">
        <div className="parent-surface parent-panel-card">
          <p style={{ color: "#8c857c" }}>Loading...</p>
        </div>
      </ParentShell>
    );
  }

  if (leaves.length === 0) {
    return (
      <ParentShell title="Leave History" backTo="/dashboard/parent">
        <div className="parent-surface parent-empty-state">
          <h3>No Leave History</h3>
          <p>No leave records found for your child.</p>
        </div>
      </ParentShell>
    );
  }

  return (
    <ParentShell title="Leave History" backTo="/dashboard/parent">
      <div className="parent-surface parent-table-wrap">
        <table className="parent-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Purpose</th>
              <th>Place</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => {
              const status = STATUS_MAP[leave.status] || {
                label: leave.status,
                className: "",
              };
              return (
                <tr key={leave.id}>
                  <td>{leave.type}</td>
                  <td>
                    {new Date(leave.startDate).toLocaleDateString("en-IN")}
                  </td>
                  <td>
                    {new Date(leave.endDate).toLocaleDateString("en-IN")}
                  </td>
                  <td>{leave.purpose || "—"}</td>
                  <td>{leave.place || "—"}</td>
                  <td>
                    <span
                      className={`parent-status-pill ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ParentShell>
  );
}