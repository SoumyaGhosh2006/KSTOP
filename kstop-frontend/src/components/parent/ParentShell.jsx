import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import "../../page/dashboard/parent/parent-dashboard.css";

// Navigation links shown in the parent sidebar.
// Parents only see leave + messaging — no grievances, no mess, no attendance.
const NAV_LINKS = [
  { to: "/dashboard/parent", label: "Dashboard", end: true },
  { to: "/dashboard/parent/pending-leaves", label: "Pending Approvals" },
  { to: "/dashboard/parent/leave-history", label: "Leave History" },
  { to: "/dashboard/parent/message-mentor", label: "Message Mentor" },
];

/**
 * ParentShell wraps every parent page with:
 *  - A sidebar that slides in when the user hovers the left edge (desktop)
 *  - A hamburger button for mobile tap-to-open
 *  - A header with eyebrow + title
 *  - A content area (children)
 *
 *  Design matches StudentShell and HostelShell exactly:
 *    - Dark sidebar (#252422) with orange active indicator (#eb5e28)
 *    - Beige background (#f8f4e8)
 *    - White rounded cards
 *    - Orange primary buttons
 */
export default function ParentShell({ title, eyebrow, backTo, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Show the REAL logged-in parent's name from auth context.
  // This is the fix for the "Asha Kumar" bug — no hardcoded fallbacks.
  const displayName = user?.name || "Parent";

  return (
    <div className="parent-shell">
      {/* ── Thin hover zone on the left edge — hovering slides the sidebar in ── */}
      <div className="parent-sidebar-hover-zone" aria-hidden="true" />

      {/* ── Hamburger button — only visible on mobile ── */}
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

      {/* ── Sidebar ── */}
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
            </NavLink>
          ))}
        </div>

        <button type="button" className="parent-sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      {/* Overlay — only shown on mobile when sidebar is open */}
      {sidebarOpen ? (
        <button
          type="button"
          className="parent-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* ── Main content area ── */}
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
        </header>

        {children}
      </main>
    </div>
  );
}