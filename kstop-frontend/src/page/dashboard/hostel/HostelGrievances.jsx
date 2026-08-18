import { useEffect, useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

/**
 * Determines the display label and visual tone for a grievance's resolution status.
 * @param {Object} grievance - The grievance with staff and student status values.
 * @return {{text: string, tone: string}} The status label text and visual tone.
 */
function getGrievanceLabel(grievance) {
  if (grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "DISPUTED") {
    return { text: "This grievance hasn't been resolved", tone: "alert" };
  }

  if (grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "CONFIRMED") {
    return { text: "Solved", tone: "ok" };
  }

  if (grievance.staffStatus === "RESOLVED") {
    return { text: "Awaiting student confirmation", tone: "alert" };
  }

  return { text: "Not resolved", tone: "alert" };
}

/**
 * Display and manage student grievances for the hostel.
 */
export default function HostelGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  async function loadGrievances() {
    try {
      const response = await api.get("/hostel/grievances");
      setGrievances(response.data.grievances);
    } catch {
      setError("Could not load hostel grievances.");
    }
  }

  useEffect(() => {
    loadGrievances();
  }, []);

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

              <button
                type="button"
                className="hostel-button-muted"
                onClick={() => setOpenId(isOpen ? null : grievance.id)}
              >
                {isOpen ? "Hide Options" : "Update Status"}
              </button>

              {isOpen ? (
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
                      Not Resolved
                    </button>
                  </div>
                  {grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "DISPUTED" ? (
                    <p className="hostel-error">This grievance hasn't been resolved.</p>
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
