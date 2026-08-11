import StudentShell from "../../../components/student/StudentShell";
import "./student-dashboard.css";

// Static sample data for the grievance list until live data is connected.
const GRIEVANCES = [
  { title: "Water leakage in bathroom", status: "In progress", tone: "progress" },
  { title: "Wi-Fi not working, 3rd floor", status: "Open", tone: "open" },
  { title: "Broken chair in room", status: "Resolved", tone: "resolved" },
];

export default function MyGrievances() {
  return (
    <StudentShell title="Grievances" backTo="/dashboard/student">
      {/* Primary action keeps the complaint flow easy to find from the top of the page. */}
      <button type="button" className="student-primary-button" style={{ marginBottom: "14px" }}>
        + Raise a complaint
      </button>

      {/* This block is a placeholder for the future grievance form expansion. */}
      <section className="student-surface student-list-card">
        <div className="student-list-subtle" style={{ marginBottom: "14px", fontWeight: 700 }}>
          New grievance form (expands here)
        </div>
        <div className="student-form-grid">
          <input className="student-input" placeholder="Title" />
          <select className="student-select" defaultValue="">
            <option value="" disabled>
              Category *
            </option>
            <option>Maintenance</option>
            <option>Mess</option>
            <option>Safety</option>
          </select>
          <input className="student-input student-full-width" placeholder="Description" />
        </div>
      </section>

      {/* The list below shows each complaint and its current stage. */}
      <div className="student-subsection-label">MY GRIEVANCES</div>

      <section className="student-grievance-list">
        {GRIEVANCES.map((item) => (
          <article key={item.title} className="student-row-card">
            <div>
              <h3>{item.title}</h3>
              <p>Tap to view status history + warden response thread</p>
            </div>
            <span className={`student-status-pill is-${item.tone}`}>{item.status}</span>
          </article>
        ))}
      </section>
    </StudentShell>
  );
}
