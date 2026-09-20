import { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ParentGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGrievances() {
      try {
        const response = await api.get("/parent/grievances");
        setGrievances(response.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load grievances.");
      } finally {
        setLoading(false);
      }
    }

    loadGrievances();
  }, []);

  return (
    <ParentShell title="Grievances" eyebrow="Linked student only" backTo="/dashboard/parent">
      {loading ? (
        <section className="parent-surface parent-panel-card">
          <p style={{ color: "#8c857c" }}>Loading grievances...</p>
        </section>
      ) : null}

      {error ? (
        <section className="parent-surface parent-panel-card">
          <p style={{ color: "#c84b3f" }}>{error}</p>
        </section>
      ) : null}

      {!loading && !error && grievances.length === 0 ? (
        <section className="parent-surface parent-panel-card">
          <h3>No grievances yet</h3>
          <p style={{ color: "#8c857c" }}>Your linked student's grievances will appear here.</p>
        </section>
      ) : null}

      {!loading && !error && grievances.length > 0 ? (
        <div className="parent-dashboard-stack">
          {grievances.map((grievance) => (
            <article key={grievance.id} className="parent-surface parent-panel-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{grievance.title}</h3>
                  <p style={{ color: "#8c857c", margin: "6px 0 0" }}>
                    {grievance.category} · {formatDate(grievance.createdAt)}
                  </p>
                </div>
                <strong>{grievance.resolutionStatus?.replace("_", " ") || "In progress"}</strong>
              </div>

              <p style={{ marginTop: "14px" }}>{grievance.description}</p>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", color: "#8c857c", fontSize: "14px" }}>
                <span>Priority: {grievance.priorityScore}/100</span>
                <span>Hostel: {grievance.hostel?.name || "—"}</span>
                <span>Mentor: {grievance.mentor?.name || "—"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </ParentShell>
  );
}
