import { useEffect, useMemo, useState } from "react";
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

export default function MenteesList() {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadMentees() {
      try {
        const res = await api.get("/mentor/mentees");
        setMentees(res.data.mentees || []);
      } catch (err) {
        console.error("Failed to load mentees:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMentees();
  }, []);

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return mentees;
    return mentees.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.rollNumber?.toLowerCase().includes(query)
    );
  }, [mentees, search]);

  if (loading) {
    return (
      <MentorShell title="My Mentees" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-panel-card mentor-loading-row">
          <span className="mentor-spinner" />
          Loading your mentees...
        </div>
      </MentorShell>
    );
  }

  if (mentees.length === 0) {
    return (
      <MentorShell title="My Mentees" backTo="/dashboard/mentor">
        <div className="mentor-surface mentor-empty-state">
          <h3>No mentees assigned yet</h3>
          <p>Students you mentor will appear here once they're linked to you.</p>
        </div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="My Mentees" backTo="/dashboard/mentor">
      <div className="mentor-dashboard-stack">
        <input
          type="text"
          className="mentor-search-input"
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mentor-card-list">
          {filtered.length === 0 ? (
            <div className="mentor-surface mentor-empty-state">
              <h3>No matches</h3>
              <p>Try a different name or roll number.</p>
            </div>
          ) : (
            filtered.map((mentee) => {
              const isExpanded = expandedId === mentee.id;
              const attendance = mentee.attendancePercentage;

              return (
                <article className="mentor-surface mentor-expandable-card" key={mentee.id}>
                  <div className="mentor-expandable-card__top">
                    <div className="mentor-expandable-card__who">
                      <h3>{mentee.name}</h3>
                      <p>
                        Roll No. {mentee.rollNumber} · {mentee.hostel?.name || "No hostel assigned"}
                      </p>
                    </div>
                    <div className="mentor-expandable-card__badges">
                      {mentee.gender ? (
                        <span className="mentor-status-pill is-progress">{mentee.gender}</span>
                      ) : null}
                      {typeof attendance === "number" && attendance < 75 ? (
                        <span className="mentor-status-pill is-urgent">Low Attendance</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mentor-detail-grid">
                    <div className="mentor-detail-row">
                      <span className="label">Attendance</span>
                      <span className="value">
                        {typeof attendance === "number" ? `${attendance}%` : "—"}
                      </span>
                    </div>
                    <div className="mentor-detail-row">
                      <span className="label">Total Leaves Taken</span>
                      <span className="value">{mentee._count?.leavesAsStudent ?? 0}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mentor-dropdown-toggle${isExpanded ? " is-open" : ""}`}
                    onClick={() => toggleExpanded(mentee.id)}
                  >
                    {isExpanded ? "Hide academic details & history" : "View academic details & leave history"}
                    <span className="mentor-dropdown-toggle__chevron">▾</span>
                  </button>

                  {isExpanded ? (
                    <div className="mentor-dropdown-panel">
                      <div className="mentor-mini-grid">
                        <div className="mentor-mini-stat">
                          <span className="label">Academic Details</span>
                          <span className="value">{mentee.academicDetails || "Not recorded"}</span>
                        </div>
                        <div className="mentor-mini-stat">
                          <span className="label">Hostel</span>
                          <span className="value">{mentee.hostel?.name || "Not assigned"}</span>
                        </div>
                      </div>

                      <p className="mentor-history-title">Recent Leave History</p>
                      {mentee.recentLeaves?.length > 0 ? (
                        <div className="mentor-history-list">
                          {mentee.recentLeaves.map((h) => (
                            <div className="mentor-history-item" key={h.id}>
                              <span>{h.type}</span>
                              <span className="mentor-history-item__dates">
                                {formatDate(h.startDate)} – {formatDate(h.endDate)}
                              </span>
                              <span className={`mentor-status-pill is-${h.status?.toLowerCase()}`}>
                                {h.status?.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mentor-empty-inline">No leave history yet.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </MentorShell>
  );
}