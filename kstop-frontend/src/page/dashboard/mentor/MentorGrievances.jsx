import { useEffect, useMemo, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "DISPUTED", label: "Disputed" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
];

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
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadGrievances() {
      try {
        const res = await api.get("/mentor/grievances");
        setGrievances(res.data.grievances || []);
      } catch (err) {
        console.error("Failed to load grievances:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGrievances();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return grievances;
    if (filter === "DISPUTED") return grievances.filter((g) => g.studentStatus === "DISPUTED");
    return grievances.filter((g) => g.staffStatus === filter);
  }, [grievances, filter]);

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
          <p>Complaints raised by your mentees will show up here, disputed ones first.</p>
        </div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="Grievances" backTo="/dashboard/mentor">
      <div className="mentor-dashboard-stack">
        <div className="mentor-filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`mentor-filter-pill${filter === f.key ? " is-active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mentor-surface mentor-empty-state">
            <h3>Nothing here</h3>
            <p>No grievances match this filter right now.</p>
          </div>
        ) : (
          <div className="mentor-card-list">
            {filtered.map((g) => (
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
                    {g.studentStatus === "DISPUTED" ? (
                      <span className="mentor-status-pill is-disputed">Disputed</span>
                    ) : null}
                    <span className={`mentor-status-pill is-${g.staffStatus?.toLowerCase()}`}>
                      {g.staffStatus?.replace("_", " ")}
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
                    <span className="label">Student's Response</span>
                    <span className="value">{g.studentStatus?.replace("_", " ") || "Pending"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MentorShell>
  );
}