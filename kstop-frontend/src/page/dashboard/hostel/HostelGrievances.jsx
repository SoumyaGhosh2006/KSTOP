import { useEffect, useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

/**
 * Determines the display label and visual tone for a grievance's resolution status.
 * @param {Object} grievance - The grievance with staff and student status values.
 * @return {{text: string, tone: string}} The status label text and visual tone.
 */
function getGrievanceLabel(grievance) {
  switch (grievance.resolutionStatus) {
    case "RESOLVED":
      return { text: "Resolved", tone: "ok" };
    case "CLASHED":
      return { text: "Clashed", tone: "alert" };
    case "UNRESOLVED":
      return { text: "Unresolved", tone: "alert" };
    default:
      return { text: "In progress", tone: "alert" };
  }
}

/**
 * Display and manage student grievances for the hostel.
 */
export default function HostelGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [view, setView] = useState("active");
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  async function loadGrievances() {
    try {
      const response = await api.get("/hostel/grievances", { params: { view } });
      setGrievances(response.data.grievances);
    } catch {
      setError("Could not load hostel grievances.");
    }
  }

  useEffect(() => {
    loadGrievances();
    setOpenId(null);
  }, [view]);

  async function updateStatus(grievanceId, status) {
    try {
      setError("");
      await api.patch(`/hostel/grievances/${grievanceId}/status`, { status });
      await loadGrievances();
    } catch (statusError) {
      setError(statusError.response?.data?.message || "Could not update grievance status.");
    }
  }

  return (
    <HostelShell title="Student Grievances" eyebrow="Residents of this hostel">
      {error ? <p className="hostel-error">{error}</p> : null}

      <div className="hostel-filter-row">
        {[
          ["active", "Active"],
          ["recent", "Recently Resolved"],
          ["history", "History"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`hostel-filter-pill${view === key ? " is-active" : ""}`}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="hostel-grievance-list">
        {grievances.map((grievance) => {
          const label = getGrievanceLabel(grievance);
          const isOpen = openId === grievance.id;

          return (
            <article key={grievance.id} className="hostel-card hostel-grievance-card">
              <div className="hostel-meta">
                <span className={`hostel-pill is-${label.tone}`}>{label.text}</span>
                <span className="hostel-pill">{grievance.category}</span>
                <span className="hostel-pill">Priority {grievance.priorityScore}</span>
              </div>

              <h3>{grievance.title}</h3>
              <p>{grievance.description}</p>
              <p>
                {grievance.student?.name || "Student"} | Roll no:{" "}
                {grievance.student?.rollNumber || "Not provided"}
              </p>

              {view === "active" ? (
                <button
                  type="button"
                  className="hostel-button-muted"
                  onClick={() => setOpenId(isOpen ? null : grievance.id)}
                >
                  {isOpen ? "Hide Options" : "Update Status"}
                </button>
              ) : null}

              {view === "active" && isOpen ? (
                <div className="hostel-dropdown">
                  <div className="hostel-actions">
                    <button
                      type="button"
                      className="hostel-button"
                      onClick={() => updateStatus(grievance.id, "RESOLVED")}
                    >
                      Resolved
                    </button>
                    <button
                      type="button"
                      className="hostel-button-muted"
                      onClick={() => updateStatus(grievance.id, "OPEN")}
                    >
                      Unresolved
                    </button>
                  </div>
                  {grievance.resolutionStatus === "CLASHED" ? (
                    <p className="hostel-error">The hostel and student decisions do not match.</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      {!grievances.length ? (
        <section className="hostel-panel">
          <p className="hostel-note">No grievances are currently linked to this hostel.</p>
        </section>
      ) : null}
    </HostelShell>
  );
}
