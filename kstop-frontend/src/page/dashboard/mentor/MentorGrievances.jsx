import { useEffect, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";



function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MentorGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");

  useEffect(() => {
    async function loadGrievances() {
      try {
        const res = await api.get("/mentor/grievances", { params: { view } });
        setGrievances(res.data.grievances || []);
      } catch (err) {
        console.error("Failed to load grievances:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGrievances();
  }, [view]);



  if (loading) {
    return (
      <MentorShell title="Grievances" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-panel-card mentor-loading-row">
          <span className="mentor-spinner" />
          Loading grievances...
        </div>
      </MentorShell>
    );
  }

  if (grievances.length === 0) {
    return (
      <MentorShell title="Grievances" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-empty-state">
          <h3>No grievances yet</h3>
          <p>Complaints raised by your mentees will show up here, with active and clashed cases first.</p>
        </div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="Grievances" backTo="/dashboard/mentor">
      <div className="mentor-dashboard-stack">
        <div className="mentor-filter-row">
          {[
            ["active", "Active"],
            ["recent", "Recently Resolved"],
            ["history", "History"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`mentor-filter-pill${view === key ? " is-active" : ""}`}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {grievances.length === 0 ? (
          <div className="mentor-surface mentor-empty-state">
            <h3>Nothing here</h3>
            <p>No grievances match this filter right now.</p>
          </div>
        ) : (
          <div className="mentor-card-list">
            {grievances.map((g) => (
              <article className="mentor-surface mentor-expandable-card" key={g.id}>
                <div className="mentor-expandable-card__top">
                  <div className="mentor-expandable-card__who">
                    <h3>{g.title}</h3>
                    <p>
                      {g.student?.name || "Student"} · Roll No. {g.student?.rollNumber || "—"} ·{" "}
                      {g.hostel?.name || "No hostel"}
                    </p>
                  </div>
                  <div className="mentor-expandable-card__badges">
                    <span className={`mentor-status-pill is-${g.resolutionStatus?.toLowerCase()}`}>
                      {g.resolutionStatus?.replace("_", " ")}
                    </span>
                    <span className="mentor-status-pill is-progress">{g.category}</span>
                  </div>
                </div>

                <div className="mentor-detail-grid">
                  <div className="mentor-detail-row" style={{ gridColumn: "1 / -1" }}>
                    <span className="label">Description</span>
                    <span className="value">{g.description || "No description provided."}</span>
                  </div>
                  <div className="mentor-detail-row">
                    <span className="label">Raised On</span>
                    <span className="value">{formatDate(g.createdAt)}</span>
                  </div>
                  <div className="mentor-detail-row">
                    <span className="label">Status</span>
                    <span className="value">{g.resolutionStatus?.replace("_", " ") || "In progress"}</span>
                  </div>
                  {view !== "active" && g.resolvedAt ? (
                    <div className="mentor-detail-row">
                      <span className="label">Resolved On</span>
                      <span className="value">{formatDate(g.resolvedAt)}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MentorShell>
  );
}