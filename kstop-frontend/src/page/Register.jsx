import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  {
    id: "student",
    label: "Student",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    description: "Apply for leave, track grievances, rate mess food",
    route: "/register/student",
  },
  {
    id: "mentor",
    label: "Mentor",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M16 3.5 18 5.5 22 1.5" />
      </svg>
    ),
    description: "Approve leaves, track mentees, manage grievances",
    route: "/register/mentor",
  },
  {
    id: "parent",
    label: "Parent",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    description: "Approve your ward's leave requests",
    route: "/register/parent",
  },
  {
    id: "hostel",
    label: "Hostel",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    description: "Upload mess menu, handle hostel complaints",
    route: "/register/hostel",
  },
];

export default function Register() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay} />

      <header style={styles.brand} aria-label="K-STOP">
        <div style={styles.logoMark} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#EB5E28" />
            <text x="14" y="20" textAnchor="middle" fill="#FFFCF2" fontSize="14" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
              K
            </text>
          </svg>
        </div>
        <span style={styles.wordmark}>K-STOP</span>
      </header>

      <main style={styles.container}>
        <div style={styles.headingBlock}>
          <h1 style={styles.heading}>Choose your role to continue.</h1>
          <p style={styles.subheading}>
            Already have an account?{" "}
            <a href="/login" style={styles.link}>
              Log in
            </a>
          </p>
        </div>

        <div style={styles.roleGrid}>
          {ROLES.map((role) => {
            const isHovered = hovered === role.id;

            return (
              <button
                key={role.id}
                style={{
                  ...styles.roleCard,
                  ...(isHovered ? styles.roleCardHover : {}),
                }}
                onMouseEnter={() => setHovered(role.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(role.route)}
              >
                <div
                  style={{
                    ...styles.iconWrap,
                    ...(isHovered ? styles.iconWrapHover : {}),
                  }}
                >
                  {role.icon}
                </div>
                <div style={styles.roleLabel}>{role.label}</div>
                <div style={styles.roleDesc}>{role.description}</div>
                <div
                  style={{
                    ...styles.arrow,
                    ...(isHovered ? styles.arrowHover : {}),
                  }}
                >
                  &rarr;
                </div>
              </button>
            );
          })}
        </div>

        <p style={styles.footer}>KIIT University &middot; Student-Mentor-Hostel Management System</p>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 18% 16%, rgba(235, 94, 40, 0.16), transparent 28rem), linear-gradient(135deg, #252422 0%, #2e2b28 52%, #1f1e1c 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5.25rem 1rem 2rem",
    fontFamily: "'Space Grotesk', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(204,197,185,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(204,197,185,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  brand: {
    position: "absolute",
    top: "1.25rem",
    left: "1.25rem",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoMark: {
    lineHeight: 0,
  },
  wordmark: {
    color: "#FFFCF2",
    fontSize: "1.05rem",
    fontWeight: "700",
    letterSpacing: "0.08em",
  },
  container: {
    width: "100%",
    maxWidth: "580px",
    position: "relative",
    zIndex: 1,
  },
  headingBlock: {
    marginBottom: "2rem",
  },
  heading: {
    color: "#FFFCF2",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: "700",
    margin: "0 0 0.5rem",
    lineHeight: "1.08",
    letterSpacing: "0",
    maxWidth: "12ch",
  },
  subheading: {
    color: "#CCC5B9",
    fontSize: "0.95rem",
    margin: 0,
  },
  link: {
    color: "#EB5E28",
    textDecoration: "none",
    fontWeight: "600",
  },
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "2rem",
  },
  roleCard: {
    background: "rgba(64, 61, 57, 0.92)",
    border: "1px solid rgba(204,197,185,0.14)",
    borderRadius: "12px",
    padding: "1.25rem",
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.18s, background 0.18s, transform 0.18s",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    outline: "none",
  },
  roleCardHover: {
    background: "#4a4643",
    borderColor: "#EB5E28",
    transform: "translateY(-2px)",
  },
  iconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(235,94,40,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#EB5E28",
    transition: "background 0.18s",
    marginBottom: "4px",
  },
  iconWrapHover: {
    background: "rgba(235,94,40,0.22)",
  },
  roleLabel: {
    color: "#FFFCF2",
    fontSize: "1rem",
    fontWeight: "700",
    letterSpacing: "0",
  },
  roleDesc: {
    color: "#CCC5B9",
    fontSize: "0.82rem",
    lineHeight: "1.5",
    fontWeight: "400",
  },
  arrow: {
    color: "#CCC5B9",
    fontSize: "16px",
    marginTop: "4px",
    transition: "color 0.18s, transform 0.18s",
    display: "inline-block",
    alignSelf: "flex-start",
  },
  arrowHover: {
    color: "#EB5E28",
    transform: "translateX(3px)",
  },
  footer: {
    color: "#CCC5B9",
    fontSize: "0.78rem",
    textAlign: "center",
    opacity: 0.68,
    margin: 0,
  },
};
