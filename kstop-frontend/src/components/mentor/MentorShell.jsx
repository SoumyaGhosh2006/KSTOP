import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import "../../page/dashboard/mentor/mentor-dashboard.css";

// Every mentor-facing page lives behind one of these links.
// Keep this in sync with the routes registered in App.jsx.
const MENU_ITEMS = [
  { label: "Home", path: "/dashboard/mentor" },
  { label: "Leave Queue", path: "/dashboard/mentor/leave-queue" },
  { label: "My Mentees", path: "/dashboard/mentor/mentees" },
  { label: "Grievances", path: "/dashboard/mentor/grievances" },
  { label: "Messages", path: "/dashboard/mentor/messages" },
  { label: "Notifications", path: "/dashboard/mentor/notifications" },
];

export default function MentorShell({ title, backTo, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");

    function syncViewport(event) {
      setIsMobile(event.matches);
      setIsSidebarOpen(false);
    }

    syncViewport(mediaQuery);
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  // Poll unread notifications so the bell/badge stay fresh without a refresh.
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api.get("/mentor/notifications");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // silently skip — the badge just won't update this cycle
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function toggleSidebar() {
    setIsSidebarOpen((current) => !current);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const name = user?.name || "Mentor";
  const showBack = Boolean(backTo);
  const currentPath = location.pathname;

  return (
    <div className="mentor-shell">
      <div className="mentor-top-brand" aria-label="K-STOP brand">
        <span className="mentor-top-brand__name">K-STOP</span>
      </div>

      <button
        type="button"
        className={`mentor-menu-button${isSidebarOpen ? " is-open" : ""}`}
        onClick={toggleSidebar}
        onMouseEnter={!isMobile ? openSidebar : undefined}
        aria-label="Open navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Desktop hover zone makes the sidebar easy to discover without forcing it open. */}
      {!isMobile ? (
        <div
          className="mentor-sidebar-hover-zone"
          onMouseEnter={openSidebar}
          aria-hidden="true"
        />
      ) : null}

      {isMobile && isSidebarOpen ? (
        <button
          type="button"
          className="mentor-sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={`mentor-sidebar${isSidebarOpen ? " is-open" : ""}`}
        onMouseLeave={!isMobile ? closeSidebar : undefined}
      >
        <div className="mentor-sidebar__brand">
          <p>Hi, {name}</p>
          <span>Mentor Portal</span>
        </div>

        <nav className="mentor-sidebar__nav" aria-label="Mentor navigation">
          {MENU_ITEMS.map((item) => {
            const isNotifLink = item.path === "/dashboard/mentor/notifications";
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard/mentor"}
                className={({ isActive }) => {
                  const matchesNested =
                    item.path !== "/dashboard/mentor" &&
                    currentPath.startsWith(`${item.path}/`);
                  return `mentor-sidebar__link${isActive || matchesNested ? " is-active" : ""}`;
                }}
                onClick={isMobile ? closeSidebar : undefined}
              >
                <span>{item.label}</span>
                {isNotifLink && unreadCount > 0 ? (
                  <span className="mentor-nav-badge">{unreadCount}</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <button type="button" className="mentor-sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="mentor-main">
        <header className="mentor-header">
          <div className="mentor-header__copy">
            {showBack ? (
              <button type="button" className="mentor-back-link" onClick={() => navigate(backTo)}>
                {"<- Home"}
              </button>
            ) : null}
            <h1>{title}</h1>
          </div>
          <button
            type="button"
            className="mentor-notif-bell"
            onClick={() => navigate("/dashboard/mentor/notifications")}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 ? <span className="mentor-notif-badge">{unreadCount}</span> : null}
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}