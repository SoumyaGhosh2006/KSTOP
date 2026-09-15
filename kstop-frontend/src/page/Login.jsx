import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Invalid email or password.");
      }
      login(data.token, data.user);
      const dashboardByRole = {
        student: "/dashboard/student",
        mentor: "/dashboard/mentor",
        parent: "/dashboard/parent",
        hostel: "/dashboard/hostel",
      };
      navigate(dashboardByRole[data.user?.role] || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <style>{styles}</style>
      <header className="login-brand" aria-label="K-STOP">
        <div className="login-logo" aria-hidden="true">K</div>
        <span>K-STOP</span>
      </header>
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-kicker">Campus access</span>
        <h1 id="login-title">Welcome back.</h1>
        <p className="login-subtitle">Sign in to your K-STOP account.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@kiit.ac.in" autoComplete="username" disabled={loading} />
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" disabled={loading} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-actions"><Link to="/forgot-password">Forgot password?</Link></div>
          <button className="submit-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        <p className="register-prompt">Don't have an account? <Link to="/register">Create account</Link></p>
      </section>
      <Link className="dev-link" to="/dev-login">Developer Login</Link>
      <p className="login-footer">KIIT University · Student-Mentor-Hostel Management System</p>
    </main>
  );
}

const styles = `
  :root { --kstop-paper:#FFFCF2; --kstop-sand:#CCC5B9; --kstop-ash:#403D39; --kstop-ink:#252422; --kstop-orange:#EB5E28; }
  .login-page { min-height:100vh; box-sizing:border-box; display:flex; align-items:center; justify-content:center; position:relative; padding:6rem 1.25rem 4rem; overflow:hidden; font-family:"Space Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--kstop-ink); background:radial-gradient(circle at 75% 20%,rgba(235,94,40,.12),transparent 22rem),linear-gradient(135deg,#FFFCF2 0%,#f5efe4 100%); }
  .login-brand { position:absolute; top:1.35rem; left:1.5rem; display:flex; align-items:center; gap:.75rem; font-size:1rem; font-weight:800; }
  .login-logo { width:2.25rem; height:2.25rem; display:grid; place-items:center; border-radius:8px; background:var(--kstop-orange); color:var(--kstop-paper); box-shadow:0 12px 24px rgba(235,94,40,.22); }
  .login-card { width:min(100%,430px); padding:2.1rem; border:1px solid rgba(64,61,57,.15); border-radius:14px; background:rgba(255,252,242,.9); box-shadow:0 28px 70px rgba(37,36,34,.13); backdrop-filter:blur(14px); }
  .login-kicker { display:inline-flex; padding:.35rem .75rem; border-radius:999px; background:rgba(235,94,40,.1); color:var(--kstop-orange); font-size:.78rem; font-weight:800; }
  h1 { margin:.9rem 0 .35rem; font-size:2.5rem; line-height:1.05; }
  .login-subtitle,.register-prompt,.login-footer { color:var(--kstop-ash); }
  .login-subtitle { margin:0 0 1.8rem; }
  form { display:grid; gap:.55rem; }
  label { margin-top:.45rem; font-size:.9rem; font-weight:750; }
  input { width:100%; box-sizing:border-box; padding:.9rem 1rem; border:1px solid rgba(64,61,57,.2); border-radius:8px; background:rgba(255,255,255,.55); color:var(--kstop-ink); font:inherit; outline:none; }
  input:focus { border-color:var(--kstop-orange); box-shadow:0 0 0 3px rgba(235,94,40,.12); }
  .password-field { position:relative; }
  .password-field input { padding-right:4.5rem; }
  .password-toggle { position:absolute; right:.7rem; top:50%; transform:translateY(-50%); border:0; background:transparent; color:var(--kstop-orange); font-weight:800; cursor:pointer; }
  .login-actions { display:flex; justify-content:flex-end; margin:.35rem 0 .5rem; }
  a { color:var(--kstop-orange); text-decoration:none; font-weight:750; }
  .login-error { margin-top:.6rem; padding:.75rem .85rem; border:1px solid rgba(190,40,40,.25); border-radius:8px; background:rgba(190,40,40,.07); color:#a32626; font-size:.9rem; }
  .submit-button { margin-top:.45rem; padding:.95rem 1rem; border:0; border-radius:8px; background:var(--kstop-orange); color:var(--kstop-paper); font:inherit; font-weight:850; cursor:pointer; }
  .submit-button:disabled { opacity:.65; cursor:wait; }
  .register-prompt { margin:1.4rem 0 0; text-align:center; font-size:.9rem; }
  .dev-link { position:absolute; right:1.5rem; top:1.55rem; font-size:.82rem; }
  .login-footer { position:absolute; bottom:1.2rem; margin:0; font-size:.76rem; font-weight:650; text-align:center; }
  @media (max-width:600px) { .login-card { padding:1.5rem; } h1 { font-size:2.15rem; } .dev-link { top:4.1rem; right:1.25rem; } }
`;