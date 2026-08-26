import { useEffect, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

// Must match the GrievanceCategory enum in prisma/schema.prisma exactly.
const CATEGORIES = ["Water", "Electrical", "Plumbing", "Transport", "Internet", "Cleaning", "Food", "Other"];

function statusTone(grievance) {
  if (grievance.studentStatus === "DISPUTED") return "open";
  if (grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "CONFIRMED") return "resolved";
  if (grievance.staffStatus === "RESOLVED") return "progress"; // resolved by staff, awaiting student confirmation
  if (grievance.staffStatus === "IN_PROGRESS") return "progress";
  return "open";
}

function statusLabel(grievance) {
  if (grievance.studentStatus === "DISPUTED") return "Disputed";
  if (grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "CONFIRMED") return "Resolved";
  if (grievance.staffStatus === "RESOLVED") return "Awaiting your confirmation";
  if (grievance.staffStatus === "IN_PROGRESS") return "In progress";
  return "Open";
}

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadGrievances() {
    try {
      const res = await api.get("/grievance/my-grievances");
      setGrievances(res.data.grievances);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your grievances.");
    }
  }

  useEffect(() => {
    loadGrievances();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setError("Please fill in title, category, and description.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/grievance/create", form);
      setMessage("Grievance filed successfully.");
      setForm({ title: "", category: "", description: "" });
      setShowForm(false);
      loadGrievances(); // refresh the list so the new one shows up immediately
    } catch (err) {
      setError(err.response?.data?.message || "Could not file grievance.");
    } finally {
      setSubmitting(false);
    }
  }

  async function respond(id, response) {
    setError("");
    try {
      await api.patch(`/grievance/${id}/respond`, { response });
      loadGrievances();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your response.");
    }
  }

  return (
    <StudentShell title="Grievances" backTo="/dashboard/student">
      <button
        type="button"
        className="student-primary-button"
        style={{ marginBottom: "14px" }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : "+ Raise a complaint"}
      </button>

      {message ? <p className="student-note" style={{ color: "#2d8b53" }}>{message}</p> : null}
      {error ? <p className="student-note" style={{ color: "#d34c3f" }}>{error}</p> : null}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <section className="student-surface student-list-card">
            <div className="student-list-subtle" style={{ marginBottom: "14px", fontWeight: 700 }}>
              New grievance
            </div>
            <div className="student-form-grid">
              <input
                className="student-input"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <select
                className="student-select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="" disabled>Category *</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea
                className="student-input student-full-width"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button type="submit" className="student-primary-button" style={{ marginTop: "12px" }} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit grievance"}
            </button>
          </section>
        </form>
      )}

      <div className="student-subsection-label">MY GRIEVANCES</div>

      <section className="student-grievance-list">
        {grievances.map((item) => (
          <article key={item.id} className="student-row-card">
            <div>
              <h3>{item.title}</h3>
              <p>{item.category} · {new Date(item.createdAt).toLocaleDateString()}</p>
              {/* Only shown once staff has resolved it — this is the
                  dual-confirmation step described in schema.prisma:
                  staff says fixed, but the STUDENT has final say. */}
              {item.staffStatus === "RESOLVED" && item.studentStatus === "PENDING" && (
                <div className="student-action-row" style={{ marginTop: "8px" }}>
                  <button type="button" className="student-secondary-button" onClick={() => respond(item.id, "CONFIRMED")}>
                    Confirm it's fixed
                  </button>
                  <button type="button" className="student-secondary-button" onClick={() => respond(item.id, "DISPUTED")}>
                    Not actually fixed
                  </button>
                </div>
              )}
            </div>
            <span className={`student-status-pill is-${statusTone(item)}`}>{statusLabel(item)}</span>
          </article>
        ))}

        {!grievances.length ? (
          <section className="student-surface student-list-card">
            <p className="student-note">You haven't filed any grievances yet.</p>
          </section>
        ) : null}
      </section>
    </StudentShell>
  );
}