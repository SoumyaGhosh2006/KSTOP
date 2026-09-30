import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../page/dashboard/hostel/hostel-dashboard.css";

const NAV_LINKS = [
  { to: "/dashboard/hostel", label: "Dashboard", end: true },
  { to: "/dashboard/hostel/mess-menu", label: "Upload Menu" },
  { to: "/dashboard/hostel/mess-feedback", label: "Mess Feedback" },
  { to: "/dashboard/hostel/scan-qr", label: "Scan QR" },
  { to: "/dashboard/hostel/leave-records", label: "Leave Records" },
  { to: "/dashboard/hostel/grievances", label: "Grievances" },
];

export default function HostelShell({ title, eyebrow, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("kstop_token");
    localStorage.removeItem("kstop_user");
    navigate("/login");
  }

  return (
    <div className="hostel-shell">
      <button type="button" className={"hostel-menu-toggle" + (sidebarOpen ? " is-open" : "")} aria-label="Open menu" onClick={() => setSidebarOpen((current) => !current)}>
        <span /><span /><span />
      </button>
      <div className="hostel-sidebar-hover-zone" aria-hidden="true" />

      <nav className={"hostel-sidebar" + (sidebarOpen ? " is-open" : "")}>
        <div className="hostel-sidebar__brand">
          <strong>K-STOP</strong>
          <span>Hostel Portal</span>
        </div>

        <div className="hostel-sidebar__nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => "hostel-sidebar__link" + (isActive ? " is-active" : "")} onClick={() => setSidebarOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <button type="button" className="hostel-sidebar__logout" onClick={logout}>Log out</button>
      </nav>

      {sidebarOpen ? <button type="button" className="hostel-sidebar-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} /> : null}

      <main className="hostel-main">
        <header className="hostel-header">
          <div>{eyebrow ? <p>{eyebrow}</p> : null}<h1>{title}</h1></div>
        </header>
        {children}
      </main>
    </div>
  );
}
