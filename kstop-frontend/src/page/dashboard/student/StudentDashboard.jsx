import { useState, useEffect } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

export default function StudentDashboard() {
  // null while loading, false if no active leave, or the leave object
  const [activeLeave, setActiveLeave] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveQr() {
      try {
        const res = await api.get("/leave/active-qr");
        if (!cancelled) setActiveLeave(res.data.activeLeave || false);
      } catch (err) {
        console.error("Failed to load active QR:", err);
        if (!cancelled) setActiveLeave(false);
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }

    loadActiveQr();
    return () => { cancelled = true; };
  }, []);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  return (
    <StudentShell title="Good afternoon, Soumya">
      {/* Top-to-bottom layout keeps the most urgent leave status visible first. */}
      <div className="student-dashboard-stack">
        {/* Gate pass card only renders once an APPROVED leave is
            confirmed to still be within its date range — this
            component doesn't decide that itself, it just displays
            whatever GET /api/leave/active-qr says right now. Once
            that leave's end date passes, the backend stops returning
            it and this card disappears automatically on next load. */}
        {!qrLoading && activeLeave && (
          <section className="student-surface student-hero-card">
            <div>
              <span className="student-eyebrow">Gate pass ready</span>
              <h2>{activeLeave.type} | {formatDate(activeLeave.startDate)} - {formatDate(activeLeave.endDate)}</h2>
              <p>Approved by mentor - valid until {formatDate(activeLeave.endDate)}</p>
            </div>
            <img
              src={activeLeave.qrCode}
              alt="Leave gate pass QR code"
              className="student-hero-qr"
              style={{ width: "140px", height: "140px", borderRadius: "8px" }}
            />
          </section>
        )}

        {/* Recent leave summary keeps the latest approval context visible at a glance. */}
        <section className="student-surface student-panel-card">
          <span className="student-eyebrow" style={{ color: "#7d7469" }}>
            Most recent leave
          </span>
          <h3>Medical leave | 2 Aug - 3 Aug</h3>
          <p>Parent approved - Mentor approved - Gate pass active</p>
        </section>

        {/* Three compact status tiles for quick daily checks. */}
        <section className="student-three-grid">
          <article className="student-surface student-tile">
            <span className="student-eyebrow" style={{ color: "#7d7469" }}>
              Attendance
            </span>
            <h3 style={{ fontSize: "42px" }}>81%</h3>
            <small>4% above minimum</small>
          </article>

          <article className="student-surface student-tile">
            <span className="student-eyebrow" style={{ color: "#7d7469" }}>
              Today&apos;s menu | CV Raman
            </span>
            <p>Rajma chawal, jeera aloo, curd, salad</p>
            <small>Read-only preview</small>
          </article>

          <article className="student-surface student-tile">
            <span className="student-eyebrow" style={{ color: "#7d7469" }}>
              Grievance
            </span>
            <h3>
              <span className="student-status-dot" aria-hidden="true" />
              1 open
            </h3>
            <p>&quot;Water leakage&quot; | In progress</p>
          </article>
        </section>

        {/* Notification feed for recent updates and actions. */}
        <section className="student-surface student-list-card">
          <span className="student-eyebrow" style={{ color: "#7d7469" }}>
            Notifications
          </span>
          <ul className="student-list">
            <li>Leave approved by mentor | 12m ago</li>
            <li>New mess menu uploaded | 2h ago</li>
            <li>Grievance marked In Progress | Yesterday</li>
          </ul>
        </section>
      </div>
    </StudentShell>
  );
}