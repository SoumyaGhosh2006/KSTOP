import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import "./mentor-dashboard.css";

// The home screen is deliberately just a summary — counts, one focus
// callout, quick actions. The actual lists (leave queue, mentees,
// grievances, messages) each live on their own page in the sidebar,
// so we don't repeat that content here.
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
    return (
      <MentorShell title="Mentor Dashboard">
        <div className="mentor-surface mentor-panel-card mentor-loading-row">
          <span className="mentor-spinner" />
          Loading your dashboard...
        </div>
      </MentorShell>
    );
  }

  const urgentCount = pendingLeaves.filter((leave) => {
    const attendance = leave.student?.attendancePercentage;
    return leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);
  }).length;

  const disputedCount = grievances.filter((g) => g.studentStatus === "DISPUTED").length;
  const openGrievanceCount = grievances.filter((g) => g.staffStatus !== "RESOLVED").length;

  return (
    <MentorShell title="Mentor Dashboard">
      <div className="mentor-dashboard-stack">
        {/* Greeting hero */}
        <section className="mentor-surface mentor-hero-card">
          <span className="mentor-eyebrow">Mentor Portal</span>
          <h2>You're mentoring {menteeCount} student{menteeCount === 1 ? "" : "s"}{hostelCount ? ` across ${hostelCount} hostel${hostelCount === 1 ? "" : "s"}` : ""}.</h2>
          <p>Everything you need — leave approvals, grievances, and messages from parents — lives in the menu on the left.</p>
        </section>

        {/* Today's focus — the one thing worth surfacing on the home screen */}
        {pendingLeaves.length > 0 ? (
          <section className={`mentor-surface mentor-alert-card${urgentCount === 0 ? " is-calm" : ""}`}>
            <div className="mentor-alert-card__copy">
              <strong>
                {urgentCount > 0
                  ? `${urgentCount} leave request${urgentCount === 1 ? "" : "s"} need${urgentCount === 1 ? "s" : ""} urgent attention`
                  : `${pendingLeaves.length} leave request${pendingLeaves.length === 1 ? "" : "s"} waiting on you`}
              </strong>
              <span>
                {urgentCount > 0
                  ? "Medical leaves and students below 75% attendance are prioritised at the top of the queue."
                  : "Parents have already approved these — your review is the last step."}
              </span>
            </div>
            <button className="mentor-secondary-button" onClick={() => navigate("/dashboard/mentor/leave-queue")}>
              Review now
            </button>
          </section>
        ) : (
          <section className="mentor-surface mentor-alert-card is-calm">
            <div className="mentor-alert-card__copy">
              <strong>All caught up</strong>
              <span>No leave requests are waiting on your approval right now.</span>
            </div>
          </section>
        )}

        {/* Live stat tiles — counts only, no repeated list content */}
        <section className="mentor-four-grid">
          <article
            className="mentor-surface mentor-tile"
            onClick={() => navigate("/dashboard/mentor/leave-queue")}
          >
            <span className="mentor-tile__icon">🗂️</span>
            <span className="mentor-eyebrow" style={{ color: "#7d7469" }}>Leave Queue</span>
            <h3>{pendingLeaves.length}</h3>
            <p>Awaiting your review</p>
            {urgentCount > 0 ? <small>{urgentCount} urgent</small> : null}
          </article>

          <article
            className="mentor-surface mentor-tile"
            onClick={() => navigate("/dashboard/mentor/mentees")}
          >
            <span className="mentor-tile__icon">🎓</span>
            <span className="mentor-eyebrow" style={{ color: "#7d7469" }}>My Mentees</span>
            <h3>{menteeCount}</h3>
            <p>Students under your mentorship</p>
          </article>

          <article
            className="mentor-surface mentor-tile"
            onClick={() => navigate("/dashboard/mentor/grievances")}
          >
            <span className="mentor-tile__icon">📮</span>
            <span className="mentor-eyebrow" style={{ color: "#7d7469" }}>Grievances</span>
            <h3>{openGrievanceCount}</h3>
            <p>Still open</p>
            {disputedCount > 0 ? <small>{disputedCount} disputed</small> : null}
          </article>

          <article
            className="mentor-surface mentor-tile"
            onClick={() => navigate("/dashboard/mentor/notifications")}
          >
            <span className="mentor-tile__icon">🔔</span>
            <span className="mentor-eyebrow" style={{ color: "#7d7469" }}>Notifications</span>
            <h3>{unreadNotifs}</h3>
            <p>Unread updates</p>
          </article>
        </section>

        {/* Quick actions */}
        <section className="mentor-surface mentor-panel-card">
          <span className="mentor-eyebrow" style={{ color: "#7d7469" }}>Quick Actions</span>
          <div className="mentor-quick-actions">
            <button className="mentor-secondary-button" onClick={() => navigate("/dashboard/mentor/leave-queue")}>
              Review Leave Queue
            </button>
            <button className="mentor-dark-button" onClick={() => navigate("/dashboard/mentor/mentees")}>
              View My Mentees
            </button>
            <button className="mentor-dark-button" onClick={() => navigate("/dashboard/mentor/grievances")}>
              Check Grievances
            </button>
            <button className="mentor-dark-button" onClick={() => navigate("/dashboard/mentor/messages")}>
              Read Messages ({messageCount})
            </button>
          </div>
        </section>
      </div>
    </MentorShell>
  );
}