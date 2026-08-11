import StudentShell from "../../../components/student/StudentShell";
import "./student-dashboard.css";

export default function MessMenu() {
  return (
    <StudentShell title="Mess Menu" backTo="/dashboard/student">
      <div className="student-toolbar">
        <select className="student-input student-hostel-select" defaultValue="CV Raman (yours)">
          <option>CV Raman (yours)</option>
          <option>KP 7</option>
          <option>QC 1</option>
        </select>
        <span className="student-list-subtle">Other hostels: read-only, rating disabled</span>
      </div>

      <section>
        <h2
          style={{
            margin: "8px 0 14px",
            textAlign: "center",
            fontSize: "clamp(34px, 6vw, 54px)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          HOSTEL MENU
        </h2>

        <div className="student-hero-image">
          <div>
            <div>MESS MENU PIC</div>
            <div>(UPLOADED BY THE</div>
            <div>HOSTEL USER)</div>
          </div>
        </div>
      </section>
    </StudentShell>
  );
}
