import StudentShell from "../../../components/student/StudentShell";
import "./student-dashboard.css";

export default function StudentDashboard() {
  return (
    <StudentShell title="Good afternoon, Soumya">
      {/* Top-to-bottom layout keeps the most urgent leave status visible first. */}
      <div className="student-dashboard-stack">
        {/* Primary leave status card shown first so the most urgent info is easy to spot. */}
        <section className="student-surface student-hero-card">
          <div>
            <span className="student-eyebrow">Gate pass ready</span>
            <h2>Home visit | 14 Aug - 18 Aug</h2>
            <p>Approved by mentor | valid until 18 Aug</p>
          </div>
          <button type="button" className="student-hero-qr">
            QR / DL
          </button>
        </section>

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
