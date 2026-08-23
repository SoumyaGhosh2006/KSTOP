import { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const res = await api.get("/parent/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      await api.patch(`/parent/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  if (loading) {
    return (
      <ParentShell title="Notifications" backTo="/dashboard/parent">
        <div className="parent-surface parent-panel-card">
          <p style={{ color: "#8c857c" }}>Loading notifications...</p>
        </div>
      </ParentShell>
    );
  }

  if (notifications.length === 0) {
    return (
      <ParentShell title="Notifications" backTo="/dashboard/parent">
        <div className="parent-surface parent-empty-state">
          <h3>No Notifications</h3>
          <p>When your child submits a leave request, you will be notified here.</p>
        </div>
      </ParentShell>
    );
  }

  return (
    <ParentShell title="Notifications" backTo="/dashboard/parent">
      <div className="parent-notif-list">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`parent-surface parent-notif-item ${notif.read ? "is-read" : "is-unread"}`}
          >
            <div className="parent-notif-content">
              <p>{notif.message}</p>
              <small>
                {new Date(notif.createdAt).toLocaleString("en-IN")}
              </small>
            </div>
            {!notif.read ? (
              <div className="parent-notif-actions">
                <button
                  className="parent-notif-mark-btn"
                  onClick={() => markAsRead(notif.id)}
                >
                  Mark as read
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ParentShell>
  );
}