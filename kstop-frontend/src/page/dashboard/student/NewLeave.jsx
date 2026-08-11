import StudentShell from "../../../components/student/StudentShell";
import "./student-dashboard.css";

const STEPS = [
  "1 - You submit",
  "2 - Parent approves",
  "3 - Mentor approves",
  "4 - QR gate pass",
];

export default function NewLeave() {
  return (
    <StudentShell title="Apply for Leave" backTo="/dashboard/student">
      <section className="student-progress-row" aria-label="Leave approval flow">
        {STEPS.map((step, index) => (
          <div key={step} className={`student-progress-chip${index === 0 ? " is-active" : ""}`}>
            {step}
          </div>
        ))}
      </section>

      <section className="student-form-card">
        <div className="student-form-grid" style={{ padding: "16px" }}>
          <input className="student-input" placeholder="Leave type *  (Medical / Vacation / Family / Other)" />
          <input className="student-input" placeholder="Start date" />
          <input className="student-input" placeholder="End date" />
          <input className="student-input" placeholder="Contact number" />
          <input className="student-input student-full-width" placeholder="Place" />
          <textarea className="student-textarea student-full-width" placeholder="Purpose - short text area" />
          <textarea className="student-textarea student-full-width" placeholder="Arrival details (optional) - text area" />
        </div>
      </section>

      <div className="student-action-row">
        <button type="button" className="student-primary-button">
          Review & Confirm
        </button>
        <button type="button" className="student-secondary-button">
          Cancel
        </button>
      </div>

      <p className="student-note">
        Note - submit routes to a confirmation summary screen before it actually sends.
      </p>
    </StudentShell>
  );
}
