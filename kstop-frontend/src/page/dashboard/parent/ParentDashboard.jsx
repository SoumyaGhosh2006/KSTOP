import { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

export default function ParentDashboard() {
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
    return <ParentShell title="Dashboard"><div className="parent-surface parent-panel-card parent-loading-card"><span className="parent-spinner" /><p>Loading your student's overview...</p></div></ParentShell>;
  }

  return (
    <ParentShell title="Parent Dashboard">
      <div className="parent-dashboard-v2">
        <section className="parent-child-hero">
          <div><span className="parent-eyebrow">Linked student</span><h2>{child?.name || "Unknown student"}</h2><p>Roll {child?.rollNumber || "—"} · {child?.hostel?.name || "Hostel not assigned"}</p></div>
          <div className="parent-child-meta"><span>Mentor</span><strong>{child?.mentor?.name || "Not assigned"}</strong></div>
        </section>

        <section className="parent-overview-grid">
          <article className="parent-overview-card is-actionable"><span className="parent-eyebrow">Needs your attention</span><strong>{pendingCount}</strong><p>leave requests waiting for your approval</p><small>Open Pending Approvals from the sidebar.</small></article>
          <article className="parent-overview-card"><span className="parent-eyebrow">Leave history</span><strong>{historyCount}</strong><p>requests recorded for your student</p><small>Use Leave History for the complete record.</small></article>
          <article className="parent-overview-card parent-overview-card--profile"><span className="parent-eyebrow">Student connection</span><strong>{child?.mentor?.name ? "Connected" : "Pending"}</strong><p>{child?.mentor?.name ? "A mentor is assigned to this student." : "A mentor has not been assigned yet."}</p><small>Messages and grievances stay in their dedicated views.</small></article>
        </section>

        <section className="parent-dashboard-columns">
          <article className="parent-surface parent-dashboard-info-panel">
            <div className="parent-panel-heading"><div><span className="parent-eyebrow">Student profile</span><h3>At a glance</h3></div></div>
            <div className="parent-profile-grid">
              <div><span>Name</span><strong>{child?.name || "—"}</strong></div>
              <div><span>Roll number</span><strong>{child?.rollNumber || "—"}</strong></div>
              <div><span>Hostel</span><strong>{child?.hostel?.name || "—"}</strong></div>
              <div><span>Mentor</span><strong>{child?.mentor?.name || "—"}</strong></div>
            </div>
          </article>

          <article className="parent-surface parent-dashboard-info-panel parent-guidance-panel">
            <span className="parent-eyebrow">How this home works</span>
            <h3>One place to understand, separate places to act.</h3>
            <p>This screen is intentionally a summary. Approval, leave history, grievances, mentor messages and notifications remain in the sidebar so the home page does not become a wall of buttons.</p>
          </article>
        </section>

        <p className="parent-dashboard-note">Dashboard information is read-only. Use the navigation for actions and full records.</p>
      </div>
    </ParentShell>
  );
}
