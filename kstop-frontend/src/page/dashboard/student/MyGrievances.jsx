import { useEffect, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

// Must match the GrievanceCategory enum in prisma/schema.prisma exactly.
const CATEGORIES = ["Water", "Electrical", "Plumbing", "Transport", "Internet", "Cleaning", "Food", "Other"];

function statusTone(grievance) {
  switch (grievance.resolutionStatus) {
    case "RESOLVED":
      return "resolved";
    case "CLASHED":
      return "open";
    case "UNRESOLVED":
      return "open";
    default:
      return "progress";
  }
}

function statusLabel(grievance) {
  switch (grievance.resolutionStatus) {
    case "RESOLVED":
      return "Resolved";
    case "CLASHED":
      return "Clashed";
    case "UNRESOLVED":
      return "Unresolved";
    default:
      return "In progress";
  }
}

function hostelResponseLabel(grievance) {
  if (!grievance.staffRespondedAt) return "Pending";
  return grievance.staffStatus === "RESOLVED" ? "Resolved" : "Unresolved";
}

function studentResponseLabel(grievance) {
  if (!grievance.studentRespondedAt) return "Pending";
  return grievance.studentStatus === "CONFIRMED" ? "Resolved" : "Unresolved";
}

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [view, setView] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadGrievances() {
    try {
      const res = await api.get("/grievance/my-grievances", { params: { view } });
      setGrievances(res.data.grievances);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your grievances.");
    }
  }

  useEffect(() => {
    loadGrievances();
  }, [view]);

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
      setMessage("Your response was recorded on this grievance.");
      await loadGrievances();
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

      <div className="student-filter-row" style={{ marginBottom: "14px" }}>
        {[
          ["active", "Active"],
          ["recent", "Recently Resolved"],
          ["history", "History"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`student-filter-pill${view === key ? " is-active" : ""}`}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="student-subsection-label">
        {view === "active" ? "ACTIVE GRIEVANCES" : view === "recent" ? "RECENTLY RESOLVED" : "GRIEVANCE HISTORY"}
      </div>

      <section className="student-grievance-list">
        {grievances.map((item) => (
          <article key={item.id} className="student-row-card">
            <div>
              <h3>{item.title}</h3>
              <p>{item.category} · {new Date(item.createdAt).toLocaleDateString()}</p>
              <div className="student-grievance-responses">
                <div className="student-response-row">
                  <span>Hostel response</span>
                  <strong>{hostelResponseLabel(item)}</strong>
                  {item.staffRespondedAt ? (
                    <small>{new Date(item.staffRespondedAt).toLocaleDateString("en-IN")}</small>
                  ) : null}
                </div>
                <div className="student-response-row">
                  <span>Your response</span>
                  <strong>{studentResponseLabel(item)}</strong>
                  {item.studentRespondedAt ? (
                    <small>{new Date(item.studentRespondedAt).toLocaleDateString("en-IN")}</small>
                  ) : null}
                </div>
              </div>
              {view === "active" && item.resolutionStatus !== "RESOLVED" && (
                <div className="student-action-row" style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    className={"student-secondary-button" + (item.studentStatus === "CONFIRMED" ? " is-selected" : "")}
                    onClick={() => respond(item.id, "CONFIRMED")}
                  >
                    {item.studentStatus === "CONFIRMED" ? "✓ Resolved" : "Mark resolved"}
                  </button>
                  <button
                    type="button"
                    className={"student-secondary-button" + (item.studentStatus === "DISPUTED" ? " is-selected is-unresolved" : "")}
                    onClick={() => respond(item.id, "DISPUTED")}
                  >
                    {item.studentStatus === "DISPUTED" ? "✓ Unresolved" : "Mark unresolved"}
                  </button>
                </div>
              )}
              {view !== "active" && item.resolvedAt ? (
                <p className="student-note" style={{ marginTop: "8px" }}>
                  Resolved on {new Date(item.resolvedAt).toLocaleDateString("en-IN")}
                </p>
              ) : null}
            </div>
            <span className={`student-status-pill is-${statusTone(item)}`}>{statusLabel(item)}</span>
          </article>
        ))}

        {!grievances.length ? (
          <section className="student-surface student-list-card">
            <p className="student-note">
              {view === "active"
                ? "No active grievances. New grievances stay here until the hostel and student have both responded."
                : view === "recent"
                  ? "No grievances were fully resolved in the last 30 days."
                  : "No resolved grievances are in your history yet. Resolved grievances are kept here permanently."}
            </p>
          </section>
        ) : null}
      </section>
    </StudentShell>
  );
}