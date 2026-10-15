import React, { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDateTime } from "../../../utils/formatDate";
import { Bell, Check, Clock } from "../../../components/Icons";

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
      console.error("Failed to mark notification as read:", err);
    }
  }

  return (
    <ParentShell
      title="Notifications & Alerts"
      eyebrow="Activity Log"
      backTo="/dashboard/parent"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You have no notifications yet. Whenever your child submits leave requests or issues arise, alerts will arrive here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  notif.read
                    ? "bg-white border-[rgba(64,61,57,0.12)] opacity-85"
                    : "bg-white border-l-4 border-l-[#eb5e28] border-[rgba(64,61,57,0.18)] shadow-sm"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#252422] m-0 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-[#756f67] block font-mono">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notif.id)}
                    className="px-3 py-1 rounded-lg border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-xs font-semibold text-[#756f67] flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer"
                  >
                    <Check size={12} /> Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ParentShell>
  );
}