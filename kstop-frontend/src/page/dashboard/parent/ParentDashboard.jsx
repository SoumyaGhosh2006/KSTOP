import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [infoRes, pendingRes, historyRes] = await Promise.all([
          api.get("/parent/child-info"),
          api.get("/parent/pending-leaves"),
          api.get("/parent/leave-history"),
        ]);
        setChild(infoRes.data.child);
        setPendingCount(pendingRes.data.leaves?.length || 0);
        setHistoryCount(historyRes.data.leaves?.length || 0);
      } catch (err) {
        console.error("Failed to load parent dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <ParentShell title="Dashboard">
        <div className="parent-surface parent-panel-card">
          <p style={{ color: "#8c857c" }}>Loading...</p>
        </div>
      </ParentShell>
    );
  }

  return (
    <ParentShell title="Parent Dashboard">
      <div className="parent-dashboard-stack">
        {/* Child info hero card */}
        <section className="parent-surface parent-hero-card">
          <div>
            <span className="parent-eyebrow">Linked Student</span>
            <h2>{child?.name || "Unknown"}</h2>
            <p>
              Roll: {child?.rollNumber || "—"} | Hostel: {child?.hostel?.name || "Not assigned"}
              {child?.mentor?.name ? ` | Mentor: ${child.mentor.name}` : ""}
            </p>
          </div>
        </section>

        {/* Quick stat tiles */}
        <section className="parent-three-grid">
          <article className="parent-surface parent-tile">
            <span className="parent-eyebrow" style={{ color: "#7d7469" }}>
              Pending Approvals
            </span>
            <h3>{pendingCount}</h3>
            <p>Awaiting your review</p>
          </article>

          <article className="parent-surface parent-tile">
            <span className="parent-eyebrow" style={{ color: "#7d7469" }}>
              Total Leaves
            </span>
            <h3>{historyCount}</h3>
            <p>All time requests</p>
          </article>

          <article className="parent-surface parent-tile">
            <span className="parent-eyebrow" style={{ color: "#7d7469" }}>
              Mentor
            </span>
            <h3 style={{ fontSize: "18px" }}>{child?.mentor?.name || "Not assigned"}</h3>
            <p>Direct message available</p>
          </article>
        </section>

        {/* Quick actions */}
        <section className="parent-surface parent-panel-card">
          <span className="parent-eyebrow" style={{ color: "#7d7469" }}>
            Quick Actions
          </span>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            <button
              className="parent-secondary-button"
              onClick={() => navigate("/dashboard/parent/pending-leaves")}
            >
              Review Pending Leaves
            </button>
            <button
              className="parent-primary-button"
              style={{ background: "#252422", color: "#fffcf2" }}
              onClick={() => navigate("/dashboard/parent/leave-history")}
            >
              View Leave History
            </button>
            <button
              className="parent-primary-button"
              style={{ background: "#252422", color: "#fffcf2" }}
              onClick={() => navigate("/dashboard/parent/message-mentor")}
            >
              Message Mentor
            </button>
          </div>
        </section>
      </div>
    </ParentShell>
  );
}