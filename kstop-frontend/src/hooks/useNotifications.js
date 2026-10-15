import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuthContext } from "../context/AuthContext";

/**
 * Custom hook to monitor role-based notifications and unread alert counts.
 * Automatically fetches and updates alerts for parent and mentor users.
 *
 * @returns {{
 *   notifications: Array,
 *   unreadCount: number,
 *   loading: boolean,
 *   reload: () => Promise<void>,
 *   markAsRead: (id: string) => Promise<void>
 * }}
 */
export function useNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user || !["parent", "mentor"].includes(user.role)) {
      setLoading(false);
      return;
    }

    try {
      const endpoint =
        user.role === "parent" ? "/parent/notifications" : "/mentor/notifications";
      const res = await api.get(endpoint);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Keep silent fallback on transient network drop
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      if (!user || !["parent", "mentor"].includes(user.role)) return;
      try {
        const endpoint =
          user.role === "parent"
            ? `/parent/notifications/${id}/read`
            : `/mentor/notifications/${id}/read`;
        await api.patch(endpoint);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    },
    [user]
  );

  return {
    notifications,
    unreadCount,
    loading,
    reload: fetchNotifications,
    markAsRead,
  };
}

export default useNotifications;
