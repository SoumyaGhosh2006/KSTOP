import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menteeCount, setMenteeCount] = useState(0);
  const [hostelCount, setHostelCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [menteesRes, queueRes, grievancesRes, messagesRes, notifRes] = await Promise.all([
          api.get("/mentor/mentees"),
          api.get("/mentor/leave-queue"),
          api.get("/mentor/grievances"),
          api.get("/mentor/messages"),
          api.get("/mentor/notifications"),
        ]);
        const mentees = menteesRes.data.mentees || [];
        setMenteeCount(mentees.length);
        setHostelCount(new Set(mentees.map((m) => m.hostel?.name).filter(Boolean)).size);
        setPendingLeaves(queueRes.data.leaves || []);
        setGrievances(grievancesRes.data.grievances || []);
        setMessageCount(messagesRes.data.messages?.length || 0);
        setUnreadNotifs(notifRes.data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to load mentor dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <MentorShell title="Mentor Dashboard"><div className="mentor-surface mentor-panel-card mentor-loading-row"><span className="mentor-spinner" />Loading your dashboard...</div></MentorShell>;
  }

  const urgentLeaves = pendingLeaves.filter((leave) => {
    const attendance = leave.student?.attendancePercentage;
    return leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);
  });
  const disputedCount = grievances.filter((g) => g.studentStatus === "DISPUTED").length;
  const openGrievanceCount = grievances.filter((g) => g.staffStatus !== "RESOLVED").length;

  return (
    <MentorShell title="Mentor Dashboard">
      <div className="mentor-dashboard-v2">
        <section className="mentor-command-header">
          <div><span className="mentor-eyebrow">Mentor command center</span><h2>Your students, distilled into today's signals.</h2><p>Review what needs attention here. Full approvals, mentees, grievances and conversations remain in their dedicated pages.</p></div>
          <div className="mentor-command-metrics"><div><strong>{menteeCount}</strong><span>Mentees</span></div><div><strong>{hostelCount}</strong><span>Hostels</span></div></div>
        </section>

        <section className="mentor-focus-grid">
          <article className="mentor-focus-card is-urgent" onClick={() => navigate("/dashboard/mentor/leave-queue")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && navigate("/dashboard/mentor/leave-queue")}><span className="mentor-eyebrow">Leave queue</span><strong>{pendingLeaves.length}</strong><p>requests waiting for your decision</p><small>{urgentLeaves.length} need priority attention</small></article>
          <article className="mentor-focus-card" onClick={() => navigate("/dashboard/mentor/grievances")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && navigate("/dashboard/mentor/grievances")}><span className="mentor-eyebrow">Grievances</span><strong>{openGrievanceCount}</strong><p>open issues across your mentees</p><small>{disputedCount} currently disputed</small></article>
          <article className="mentor-focus-card" onClick={() => navigate("/dashboard/mentor/messages")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && navigate("/dashboard/mentor/messages")}><span className="mentor-eyebrow">Messages</span><strong>{messageCount}</strong><p>messages in your mentor inbox</p><small>Open the conversation page to respond</small></article>
          <article className="mentor-focus-card" onClick={() => navigate("/dashboard/mentor/notifications")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && navigate("/dashboard/mentor/notifications")}><span className="mentor-eyebrow">Notifications</span><strong>{unreadNotifs}</strong><p>unread updates</p><small>Notifications refresh automatically</small></article>
        </section>

        <section className="mentor-dashboard-columns">
          <article className="mentor-surface mentor-dashboard-list-panel">
            <div className="mentor-panel-heading"><div><span className="mentor-eyebrow">Attention queue</span><h3>Latest leave requests</h3></div><span className="mentor-panel-caption">Top {Math.min(3, pendingLeaves.length)}</span></div>
            {pendingLeaves.length ? (
              <div className="mentor-signal-list">
                {pendingLeaves.slice(0, 3).map((leave) => {
                  const attendance = leave.student?.attendancePercentage;
                  const urgent = leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);
                  return <div className="mentor-signal-item" key={leave.id}><div><strong>{leave.student?.name || "Student"}</strong><span>{leave.type} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span></div><em className={urgent ? "is-urgent" : ""}>{urgent ? "Priority" : "Review"}</em></div>;
                })}
              </div>
            ) : <div className="mentor-mini-empty"><strong>All caught up.</strong><span>No leave requests are waiting for review.</span></div>}
          </article>

          <article className="mentor-surface mentor-dashboard-list-panel">
            <div className="mentor-panel-heading"><div><span className="mentor-eyebrow">Student issues</span><h3>Grievance pulse</h3></div><span className="mentor-panel-caption">Live summary</span></div>
            {grievances.length ? (
              <div className="mentor-signal-list">
                {grievances.slice(0, 3).map((grievance) => (
                  <div className="mentor-signal-item" key={grievance.id}><div><strong>{grievance.title || grievance.category || "Grievance"}</strong><span>{grievance.student?.name || "Mentee"} · Priority {grievance.priorityScore ?? "—"}</span></div><em>{grievance.studentStatus === "DISPUTED" ? "Disputed" : "Active"}</em></div>
                ))}
              </div>
            ) : <div className="mentor-mini-empty"><strong>No active grievance signals.</strong><span>Your mentee issue queue is clear.</span></div>}
          </article>
        </section>

        <p className="mentor-dashboard-note">Click a summary card to open the full operational page. The dashboard itself stays read-only so decisions happen only in the dedicated workflows.</p>
      </div>
    </MentorShell>
  );
}
