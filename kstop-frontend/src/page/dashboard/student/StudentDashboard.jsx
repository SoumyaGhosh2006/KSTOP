import { useEffect, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusLabel(status) {
  return (status || "UNKNOWN").replaceAll("_", " ");
}

export default function StudentDashboard() {
  const [activeLeave, setActiveLeave] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [activeGrievances, setActiveGrievances] = useState([]);
  const [resolvedGrievances, setResolvedGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("kstop_user")) || {}; }
    catch { return {}; }
  })();

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      const results = await Promise.allSettled([
        api.get("/leave/active-qr"),
        api.get("/leave/my-leaves"),
        api.get("/grievance/my-grievances", { params: { view: "active" } }),
        api.get("/grievance/my-grievances", { params: { view: "history" } }),
      ]);
      if (cancelled) return;
      const [activeQr, leaveList, grievanceList, grievanceHistory] = results;
      if (activeQr.status === "fulfilled") setActiveLeave(activeQr.value.data.activeLeave || null);
      if (leaveList.status === "fulfilled") setLeaves(leaveList.value.data.leaves || []);
      if (grievanceList.status === "fulfilled") setActiveGrievances(grievanceList.value.data.grievances || []);
      if (grievanceHistory.status === "fulfilled") setResolvedGrievances(grievanceHistory.value.data.grievances || []);
      setLoading(false);
    }
    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const pendingLeaves = leaves.filter((leave) =>
    ["PENDING_PARENT", "PENDING_MENTOR"].includes(leave.status)
  );

  return (
    <StudentShell title="Student Dashboard">
      <div className="student-dashboard-v2">
        <section className="student-welcome-grid">
          <article className="student-surface student-welcome-card">
            <div>
              <span className="student-eyebrow">Student overview</span>
              <h2>Welcome back{user?.name ? ", " + user.name.split(" ")[0] : ""}.</h2>
              <p>Your important campus activity is collected here. Use the navigation for full records and actions.</p>
            </div>
            <div className="student-identity-strip">
              <div><span>Roll number</span><strong>{user?.rollNumber || "—"}</strong></div>
              <div><span>Hostel</span><strong>{user?.hostelName || "Assigned hostel"}</strong></div>
            </div>
          </article>

          <article className="student-surface student-status-card">
            <span className="student-eyebrow">Current access</span>
            <div className={"student-status-orb" + (activeLeave ? " is-active" : "")}><span>{activeLeave ? "ACTIVE" : "CLEAR"}</span></div>
            <strong>{activeLeave ? "Gate pass active" : "No active gate pass"}</strong>
            <p>{activeLeave ? activeLeave.type + " · " + formatDate(activeLeave.startDate) + " – " + formatDate(activeLeave.endDate) : "Approved leave passes appear here while they are valid."}</p>
          </article>
        </section>

        {activeLeave ? (
          <section className="student-surface student-pass-panel">
            <div>
              <span className="student-eyebrow">Live gate pass</span>
              <h3>{activeLeave.type} leave</h3>
              <p>Valid from {formatDate(activeLeave.startDate)} to {formatDate(activeLeave.endDate)}. Your approved QR pass is ready for hostel verification.</p>
            </div>
            <img src={activeLeave.qrCode} alt="Active leave gate pass QR code" className="student-dashboard-qr" />
          </section>
        ) : null}

        <section className="student-insight-grid">
          <article className="student-surface student-insight-card">
            <span className="student-eyebrow">Leave requests</span>
            <strong>{loading ? "—" : leaves.length}</strong>
            <p>Total requests in your record</p>
            <small>{pendingLeaves.length} currently awaiting approval</small>
          </article>

          <article className="student-surface student-insight-card">
            <span className="student-eyebrow">Active grievances</span>
            <strong>{loading ? "—" : activeGrievances.length}</strong>
            <p>Issues still in your active view</p>
            <small>{resolvedGrievances.length} resolved records in history</small>
          </article>

          <article className="student-surface student-insight-card student-insight-card--wide">
            <span className="student-eyebrow">Academic data</span>
            <strong>{user?.attendancePercentage != null ? user.attendancePercentage + "%" : "Not connected"}</strong>
            <p>{user?.attendancePercentage != null ? "Attendance currently available to your account." : "Attendance analytics are not currently supplied by the student API."}</p>
            <small>This dashboard does not invent academic numbers.</small>
          </article>
        </section>

        <section className="student-dashboard-columns">
          <article className="student-surface student-dashboard-list-panel">
            <div className="student-panel-heading">
              <div><span className="student-eyebrow">Recent activity</span><h3>Leave timeline</h3></div>
              <span className="student-panel-caption">Read-only snapshot</span>
            </div>
            {leaves.slice(0, 3).length ? (
              <div className="student-timeline">
                {leaves.slice(0, 3).map((leave) => (
                  <div className="student-timeline-item" key={leave.id}>
                    <span className="student-timeline-dot" />
                    <div><strong>{leave.type} leave</strong><span>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span></div>
                    <em>{statusLabel(leave.status)}</em>
                  </div>
                ))}
              </div>
            ) : (
              <div className="student-mini-empty"><strong>No leave history yet.</strong><span>Your future requests will appear here.</span></div>
            )}
          </article>

          <article className="student-surface student-dashboard-list-panel">
            <div className="student-panel-heading">
              <div><span className="student-eyebrow">Issue monitor</span><h3>Grievance pulse</h3></div>
              <span className="student-panel-caption">Active only</span>
            </div>
            {activeGrievances.slice(0, 3).length ? (
              <div className="student-pulse-list">
                {activeGrievances.slice(0, 3).map((grievance) => (
                  <div className="student-pulse-item" key={grievance.id}>
                    <div><strong>{grievance.title || grievance.category || "Grievance"}</strong><span>{grievance.category || "General issue"}</span></div>
                    <em>{grievance.priority ?? "—"}</em>
                  </div>
                ))}
              </div>
            ) : (
              <div className="student-mini-empty"><strong>No active grievances.</strong><span>Your issue monitor is clear right now.</span></div>
            )}
          </article>
        </section>

        <p className="student-dashboard-note">Dashboard insights are read-only. Use the sidebar for leave applications, full history, mess menu and grievance actions.</p>
      </div>
    </StudentShell>
  );
}
