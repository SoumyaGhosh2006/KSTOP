import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../lib/api";
import { useAuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const user = res.data.user || {};

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      login(user);

      navigate(getDashboardRoute(user.role), { replace: true });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page" style={styles.page}>
      <style>{stylesString}</style>
      <div className="grid-overlay" />

      <div style={styles.container}>
        <header style={styles.brand} aria-label="K-STOP">
          <div style={styles.logo}>K</div>
          <span style={styles.wordmark}>K-STOP</span>
        </header>

        <div style={styles.card}>
          <div style={styles.header}>
            <span style={styles.kicker}>Campus hostel access</span>
            <h1 style={styles.title}>Sign in to K-STOP</h1>
            <p style={styles.subtitle}>
              One login for hostel, mentor, and student dashboards.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <label style={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <label style={styles.fieldLabel} htmlFor="password">
              Password
            </label>
            <div style={styles.passwordWrap}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: "3.25rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={styles.toggleButton}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div style={styles.helperRow}>
              <Link to="/forgot-password" style={styles.link}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? <LoadingSpinner /> : "Sign in"}
            </button>

            {errorMessage ? <p style={styles.errorText}>{errorMessage}</p> : null}
          </form>
        </div>
      </div>
    </div>
  );
}

function getDashboardRoute(role) {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "mentor":
      return "/dashboard/mentor";
    case "hostel":
    case "warden":
      return "/dashboard/hostel";
    default:
      return "/dashboard/student";
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 2rem",
    backgroundColor: "#252422",
    color: "#FFFCF2",
    fontFamily: "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  container: {
    width: "100%",
    maxWidth: "560px",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  logo: {
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.5rem",
    display: "grid",
    placeItems: "center",
    backgroundColor: "#EB5E28",
    color: "#FFFCF2",
    fontWeight: 700,
    fontSize: "1rem",
  },
  wordmark: {
    color: "#FFFCF2",
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  card: {
    width: "100%",
    padding: "2rem",
    borderRadius: "0.75rem",
    backgroundColor: "#403D39",
    border: "1px solid rgba(235,94,40,0.14)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "1.75rem",
  },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.95rem",
    borderRadius: "9999px",
    backgroundColor: "rgba(235,94,40,0.14)",
    color: "#EB5E28",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0",
  },
  title: {
    margin: "0.85rem 0 0.5rem",
    color: "#FFFCF2",
    fontSize: "1.75rem",
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  subtitle: {
    margin: 0,
    color: "#CCC5B9",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    fontWeight: 400,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldLabel: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#CCC5B9",
  },
  input: {
    width: "100%",
    minHeight: "2.6rem",
    padding: "0.95rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(204,197,185,0.18)",
    backgroundColor: "#403D39",
    color: "#FFFCF2",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  },
  passwordWrap: {
    position: "relative",
  },
  toggleButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#EB5E28",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0.35rem",
  },
  helperRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  link: {
    color: "#EB5E28",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  submitButton: {
    width: "100%",
    minHeight: "2.75rem",
    padding: "0 1rem",
    borderRadius: "0.5rem",
    border: "none",
    backgroundColor: "#EB5E28",
    color: "#FFFCF2",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 150ms ease-in-out",
  },
  errorText: {
    margin: 0,
    color: "#E24B4A",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
};

const stylesString = `
.login-page {
  position: relative;
}
.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/loginpc.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.14;
  pointer-events: none;
}
.login-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(37,36,34,0.72) 0%, rgba(37,36,34,0.92) 100%);
  pointer-events: none;
}
.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(0deg, rgba(204,197,185,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(204,197,185,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}
@media (max-width: 767px) {
  .login-page::before {
    background-image: url('/loginmobile.png');
  }
}
`;
