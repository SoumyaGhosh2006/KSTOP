import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Each role card drives both the UI content and navigation target.
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
    route: "/studentregister",
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
  const navigate = useNavigate();

  // Pointer state is used to move the background glow for a richer UI feel.
  const [pointer, setPointer] = useState({ x: 58, y: 48 });

  // Convert pointer position into percentage values for CSS variables.
  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPointer({ x, y });
  }

  return (
    <div
      className="register-page"
      onPointerMove={handlePointerMove}
      style={{
        "--pointer-x": `${pointer.x}%`,
        "--pointer-y": `${pointer.y}%`,
        "--bg-x": `${50 + (pointer.x - 50) * 0.08}%`,
        "--bg-y": `${50 + (pointer.y - 50) * 0.06}%`,
      }}
    >
      <style>{registerStyles}</style>

      {/* Background image layer + glow layer */}
      <div className="register-bg" />
      <div className="register-pointer-light" />

      {/* Fixed app branding */}
      <header className="register-brand" aria-label="K-STOP">
        <div className="register-logo" aria-hidden="true">K</div>
        <span>K-STOP</span>
      </header>

      <main className="register-shell">
        {/* Intro copy for role selection */}
        <section className="register-copy">
          <span className="register-kicker">Campus access</span>
          <h1>Choose your role to continue.</h1>
          <p>
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </section>

        {/* Main role selection grid */}
        <section className="role-grid" aria-label="Choose registration role">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className="role-card"
              onClick={() => navigate(role.route)}
              aria-label={`Register as ${role.label}`}
            >
              <span className="role-icon" aria-hidden="true">
                {role.icon}
              </span>
              <span className="role-title">{role.label}</span>
              <span className="role-desc">{role.description}</span>
              <span className="role-arrow" aria-hidden="true">&rarr;</span>
            </button>
          ))}
        </section>

        <p className="register-footer">
          KIIT University &middot; Student-Mentor-Hostel Management System
        </p>
      </main>
    </div>
  );
}

const registerStyles = `
  /* Theme tokens used across this page */
  :root {
    --kstop-paper: #FFFCF2;
    --kstop-sand: #CCC5B9;
    --kstop-ash: #403D39;
    --kstop-ink: #252422;
    --kstop-orange: #EB5E28;
  }

  .register-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6rem 7vw 3rem;
    font-family: "Space Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--kstop-ink);
    background: var(--kstop-paper);
  }

  .register-bg {
    position: absolute;
    inset: 0;
    z-index: -3;
    background-image:
      linear-gradient(90deg, rgba(255, 252, 242, 0.94) 0%, rgba(255, 252, 242, 0.8) 36%, rgba(255, 252, 242, 0.48) 100%),
      url("/registerpc.png");
    background-size: cover;
    background-position: var(--bg-x) var(--bg-y);
    transition: background-position 180ms ease-out;
  }

  .register-pointer-light {
    /* Glow follows pointer location via CSS variables from React state */
    position: absolute;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(235, 94, 40, 0.16), rgba(235, 94, 40, 0.04) 13rem, transparent 25rem);
    mix-blend-mode: multiply;
  }

  .register-brand {
    position: absolute;
    top: 1.35rem;
    left: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 2;
    color: var(--kstop-ink);
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0;
  }

  .register-logo {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 8px;
    display: grid;
    place-items: center;
    background: var(--kstop-orange);
    color: var(--kstop-paper);
    box-shadow: 0 12px 24px rgba(235, 94, 40, 0.22);
  }

  .register-shell {
    width: min(100%, 820px);
    position: relative;
    z-index: 1;
    margin-inline: auto;
  }

  .register-copy {
    max-width: 100%;
    margin-bottom: 1.7rem;
    text-align: center;
  }

  .register-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 1.75rem;
    padding: 0 0.75rem;
    border: 1px solid rgba(64, 61, 57, 0.14);
    border-radius: 999px;
    background: rgba(255, 252, 242, 0.72);
    color: var(--kstop-orange);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0;
  }

  .register-copy h1 {
    margin: 0.75rem 0 0.5rem;
    color: var(--kstop-ink);
    font-size: 3rem;
    line-height: 1.05;
    letter-spacing: 0;
    max-width: 12ch;
    margin-inline: auto;
    text-wrap: balance;
  }

  .register-copy p {
    margin: 0;
    color: var(--kstop-ash);
    font-size: 1rem;
    font-weight: 600;
  }

  .register-copy a {
    color: var(--kstop-orange);
    text-decoration: none;
    font-weight: 800;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
    margin-bottom: 1.6rem;
    justify-content: center;
  }

  .role-card {
    min-height: 172px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
    padding: 1.15rem;
    border: 1px solid rgba(64, 61, 57, 0.16);
    border-radius: 8px;
    background: rgba(255, 252, 242, 0.82);
    color: var(--kstop-ink);
    text-align: left;
    cursor: pointer;
    box-shadow: 0 18px 45px rgba(37, 36, 34, 0.09);
    backdrop-filter: blur(12px);
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  }

  .role-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border-top: 3px solid transparent;
    pointer-events: none;
    transition: border-color 180ms ease;
  }

  .role-card:hover,
  .role-card:focus-visible {
    transform: translateY(-4px);
    border-color: rgba(235, 94, 40, 0.58);
    background: rgba(255, 252, 242, 0.96);
    box-shadow: 0 24px 55px rgba(37, 36, 34, 0.16);
    outline: none;
  }

  .role-card:hover::after,
  .role-card:focus-visible::after {
    border-top-color: var(--kstop-orange);
  }

  .role-icon {
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: rgba(235, 94, 40, 0.12);
    color: var(--kstop-orange);
    transition: background 180ms ease, color 180ms ease, transform 180ms ease;
  }

  .role-card:hover .role-icon,
  .role-card:focus-visible .role-icon {
    background: var(--kstop-orange);
    color: var(--kstop-paper);
    transform: translateY(-1px);
  }

  .role-title {
    color: var(--kstop-ink);
    font-size: 1.05rem;
    font-weight: 850;
    letter-spacing: 0;
  }

  .role-desc {
    color: var(--kstop-ash);
    font-size: 0.92rem;
    line-height: 1.45;
    font-weight: 600;
  }

  .role-arrow {
    margin-top: auto;
    color: var(--kstop-orange);
    font-size: 1.1rem;
    line-height: 1;
    transition: transform 180ms ease;
  }

  .role-card:hover .role-arrow,
  .role-card:focus-visible .role-arrow {
    transform: translateX(4px);
  }

  .register-footer {
    color: rgba(64, 61, 57, 0.68);
    font-size: 0.8rem;
    font-weight: 700;
    margin: 0;
    text-align: center;
  }

  @media (max-width: 760px) {
    .register-page {
      align-items: flex-start;
      justify-content: flex-start;
      padding: 5.5rem 1rem 2rem;
    }

    .register-bg {
      background-image:
        linear-gradient(180deg, rgba(255, 252, 242, 0.94) 0%, rgba(255, 252, 242, 0.82) 48%, rgba(255, 252, 242, 0.7) 100%),
        url("/registermobile.png");
      background-position: center top;
    }

    .register-brand {
      left: 1rem;
      top: 1rem;
    }

    .register-copy {
      margin-bottom: 1.25rem;
    }

    .register-copy h1 {
      font-size: 2.25rem;
      max-width: 12ch;
    }

    .role-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .role-card {
      min-height: 148px;
    }
  }
`;


// push check