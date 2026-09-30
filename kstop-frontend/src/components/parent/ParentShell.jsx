import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import "../../page/dashboard/parent/parent-dashboard.css";

const NAV_LINKS = [
  { to: "/dashboard/parent", label: "Dashboard", end: true },
  { to: "/dashboard/parent/pending-leaves", label: "Pending Approvals" },
  { to: "/dashboard/parent/leave-history", label: "Leave History" },
  { to: "/dashboard/parent/grievances", label: "Grievances" },
  { to: "/dashboard/parent/message-mentor", label: "Message Mentor" },
  { to: "/dashboard/parent/notifications", label: "Notifications" },
];

export default function ParentShell({ title, eyebrow, backTo, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api.get("/parent/notifications");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() { logout(); navigate("/login"); }
  const displayName = user?.name || "Parent";

  return (
    <div className="parent-shell">
      <button type="button" className={"parent-menu-toggle" + (sidebarOpen ? " is-open" : "")} aria-label="Open menu" onClick={() => setSidebarOpen((current) => !current)}>
        <span /><span /><span />
      </button>
      <div className="parent-sidebar-hover-zone" aria-hidden="true" />

      <nav className={"parent-sidebar" + (sidebarOpen ? " is-open" : "")}>
        <div className="parent-sidebar__brand">
          <strong>K-STOP</strong>
          <span>Parent Portal</span>
          <p className="parent-sidebar__greeting">Hi, {displayName}</p>
        </div>

        <div className="parent-sidebar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => "parent-sidebar__link" + (isActive ? " is-active" : "")} onClick={() => setSidebarOpen(false)}>
              {link.label}
              {link.to === "/dashboard/parent/notifications" && unreadCount > 0 ? <span className="parent-nav-badge">{unreadCount}</span> : null}
            </NavLink>
          ))}
        </div>

        <button type="button" className="parent-sidebar__logout" onClick={handleLogout}>Log out</button>
      </nav>

      {sidebarOpen ? <button type="button" className="parent-sidebar-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} /> : null}

      <main className="parent-main">
        <header className="parent-header">
          <div>
            {eyebrow ? <p>{eyebrow}</p> : null}
            {backTo ? <button type="button" className="parent-back-link" onClick={() => navigate(backTo)}>{"<- Back"}</button> : null}
            <h1>{title}</h1>
          </div>
          <button type="button" className="parent-notif-bell" onClick={() => navigate("/dashboard/parent/notifications")} aria-label="Notifications">
            🔔{unreadCount > 0 ? <span className="parent-notif-badge">{unreadCount}</span> : null}
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
