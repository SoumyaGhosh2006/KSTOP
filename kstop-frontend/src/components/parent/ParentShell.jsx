import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import "../../page/dashboard/parent/parent-dashboard.css";

// Navigation links shown in the parent sidebar.
const NAV_LINKS = [
  { to: "/dashboard/parent", label: "Dashboard", end: true },
  { to: "/dashboard/parent/pending-leaves", label: "Pending Approvals" },
  { to: "/dashboard/parent/leave-history", label: "Leave History" },
  { to: "/dashboard/parent/message-mentor", label: "Message Mentor" },
  { to: "/dashboard/parent/notifications", label: "Notifications" },
];

export default function ParentShell({ title, eyebrow, backTo, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  // Fetch unread notification count on mount and every 30 seconds.
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api.get("/parent/notifications");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // silently fail
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const displayName = user?.name || "Parent";

  return (
    <div className="parent-shell">
      <div className="parent-sidebar-hover-zone" aria-hidden="true" />

      <button
        type="button"
        className="parent-menu-toggle"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`parent-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="parent-sidebar__brand">
          <p className="parent-sidebar__greeting">Hi, {displayName}</p>
          <span>Parent Portal</span>
        </div>

        <div className="parent-sidebar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `parent-sidebar__link${isActive ? " is-active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
              {link.to === "/dashboard/parent/notifications" && unreadCount > 0 ? (
                <span className="parent-nav-badge">{unreadCount}</span>
              ) : null}
            </NavLink>
          ))}
        </div>

        <button type="button" className="parent-sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      {sidebarOpen ? (
        <button
          type="button"
          className="parent-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <main className="parent-main">
        <header className="parent-header">
          <div>
            {eyebrow ? <p>{eyebrow}</p> : null}
            {backTo ? (
              <button
                type="button"
                className="parent-back-link"
                onClick={() => navigate(backTo)}
              >
                {"<- Back"}
              </button>
            ) : null}
            <h1>{title}</h1>
          </div>
          <button
            type="button"
            className="parent-notif-bell"
            onClick={() => navigate("/dashboard/parent/notifications")}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 ? (
              <span className="parent-notif-badge">{unreadCount}</span>
            ) : null}
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}