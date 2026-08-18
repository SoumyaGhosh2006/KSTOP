import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../page/dashboard/hostel/hostel-dashboard.css";

// Nav links shown in the sidebar
const NAV_LINKS = [
  { to: "/dashboard/hostel", label: "Dashboard", end: true },
  { to: "/dashboard/hostel/mess-menu", label: "Upload Menu" },
  { to: "/dashboard/hostel/scan-qr", label: "Scan QR" },
  { to: "/dashboard/hostel/leave-records", label: "Leave Records" },
  { to: "/dashboard/hostel/grievances", label: "Grievances" },
];

/*
  HostelShell wraps every hostel page with:
  - A sidebar that slides in when the user hovers the left edge (desktop)
  - A hamburger button for mobile tap-to-open
  - A header with eyebrow + title
  - A content area (children)
*/
export default function HostelShell({ title, eyebrow, children }) {
  // sidebarOpen is only used on mobile (click to open)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("kstop_token");
    localStorage.removeItem("kstop_user");
    navigate("/login");
  }

  return (
    <div className="hostel-shell">
      {/* ── Thin hover zone on the left edge — hovering this slides the sidebar in ── */}
      {/* This div is invisible but sits at the left edge of the screen.            */}
      {/* The CSS rule   .hostel-sidebar-hover-zone:hover ~ .hostel-sidebar          */}
      {/* is what makes the sidebar slide in when the user hovers here.             */}
      <div className="hostel-sidebar-hover-zone" aria-hidden="true" />

      {/* ── Hamburger button — only visible on mobile ── */}
      <button
        type="button"
        className="hostel-menu-toggle"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* ── Sidebar ── */}
      <nav className={`hostel-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="hostel-sidebar__brand">
          <strong>K-STOP</strong>
          <span>Hostel Portal</span>
        </div>

        <div className="hostel-sidebar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `hostel-sidebar__link${isActive ? " is-active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <button type="button" className="hostel-sidebar__logout" onClick={logout}>
          Log out
        </button>
      </nav>

      {/* Overlay — only shown on mobile when sidebar is open */}
      {sidebarOpen ? (
        <button
          type="button"
          className="hostel-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* ── Main content area ── */}
      <main className="hostel-main">
        <header className="hostel-header">
          <div>
            {eyebrow ? <p>{eyebrow}</p> : null}
            <h1>{title}</h1>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}