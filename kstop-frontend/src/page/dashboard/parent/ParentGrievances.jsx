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
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGrievances() {
      try {
        const response = await api.get("/parent/grievances", { params: { view } });
        setGrievances(response.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load grievances.");
      } finally {
        setLoading(false);
      }
    }

    loadGrievances();
  }, [view]);

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

      {!loading && !error ? (
        <>
          <div className="parent-filter-row">
            {[
              ["active", "Active"],
              ["recent", "Recently Resolved"],
              ["history", "History"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`parent-filter-pill${view === key ? " is-active" : ""}`}
                onClick={() => setView(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {grievances.length === 0 ? (
            <section className="parent-surface parent-panel-card">
              <h3>Nothing here</h3>
              <p style={{ color: "#8c857c" }}>
                No grievances are in this view.
              </p>
            </section>
          ) : null}

          {grievances.length > 0 ? (
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
                <strong
                  style={{
                    color: grievance.resolutionStatus === "RESOLVED" ? "#2d8b53" : "#2f2924",
                  }}
                >
                  {grievance.resolutionStatus?.replace("_", " ") || "In progress"}
                </strong>
              </div>

              <p style={{ marginTop: "14px" }}>{grievance.description}</p>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", color: "#8c857c", fontSize: "14px" }}>
                <span>Priority: {grievance.priorityScore}/100</span>
                <span>Hostel: {grievance.hostel?.name || "—"}</span>
                <span>Mentor: {grievance.mentor?.name || "—"}</span>
              </div>
              {view !== "active" && grievance.resolvedAt ? (
                <p style={{ color: "#8c857c", marginTop: "10px" }}>
                  Resolved on {formatDate(grievance.resolvedAt)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
        </>
      ) : null}
    </ParentShell>
  );
}
