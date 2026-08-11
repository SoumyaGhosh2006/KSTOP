import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const MENU_ITEMS = [
  { label: "Home", path: "/dashboard/student" },
  { label: "Apply for Leave", path: "/dashboard/student/new-leave" },
  { label: "My Leaves", path: "/dashboard/student/leaves" },
  { label: "Mess Menu", path: "/dashboard/student/mess-menu" },
  { label: "Grievance", path: "/dashboard/student/grievances" },
];

export default function StudentShell({ title, backTo, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const name = user?.name || "Soumya";
  const hostelLabel = user?.hostel ? `${user.hostel} Hostel` : "CV Raman Hostel";
  const roomLabel = user?.room ? `Room ${user.room}` : "Room 214";
  const showBack = Boolean(backTo);
  const currentPath = location.pathname;

  return (
    <div className="student-shell">
      <div className="student-top-brand" aria-label="K-STOP brand">
        <span className="student-top-brand__name">K-STOP</span>
      </div>

      <button
        type="button"
        className={`student-menu-button${isSidebarOpen ? " is-open" : ""}`}
        onClick={toggleSidebar}
        onMouseEnter={!isMobile ? openSidebar : undefined}
        aria-label="Open navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      {!isMobile ? (
        <div
          className="student-sidebar-hover-zone"
          onMouseEnter={openSidebar}
          aria-hidden="true"
        />
      ) : null}

      {isMobile && isSidebarOpen ? (
        <button
          type="button"
          className="student-sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={`student-sidebar${isSidebarOpen ? " is-open" : ""}${isMobile ? " is-mobile" : ""}`}
        onMouseLeave={!isMobile ? closeSidebar : undefined}
      >
        <div className="student-sidebar__brand">
          <p>Hi, {name}</p>
        </div>

        <nav className="student-sidebar__nav" aria-label="Student navigation">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard/student"}
              className={({ isActive }) => {
                const matchesNested =
                  item.path !== "/dashboard/student" &&
                  currentPath.startsWith(`${item.path}/`);

                return `student-sidebar__link${isActive || matchesNested ? " is-active" : ""}`;
              }}
              onClick={isMobile ? closeSidebar : undefined}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="student-sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="student-main">
        <header className="student-header">
          {showBack ? (
            <button type="button" className="student-back-link" onClick={() => navigate(backTo)}>
              {"<- Home"}
            </button>
          ) : null}

          <div className="student-header__copy">
            <h1>{title}</h1>
            {!showBack ? <p>{hostelLabel} | {roomLabel}</p> : null}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
