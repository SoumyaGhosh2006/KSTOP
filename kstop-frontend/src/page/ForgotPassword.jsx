import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to process your request.");
      }

      setMessage(
        data.message ||
          "If that email is registered, a password reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="recovery-page">
      <style>{styles}</style>
      <header className="recovery-brand" aria-label="K-STOP">
        <div className="recovery-logo" aria-hidden="true">K</div>
        <span>K-STOP</span>
      </header>

      <section className="recovery-card" aria-labelledby="recovery-title">
        <span className="recovery-kicker">Account recovery</span>
        <h1 id="recovery-title">Forgot your password?</h1>
        <p className="recovery-subtitle">
          Enter your registered email and we'll send you a secure reset link.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@kiit.ac.in"
            autoComplete="email"
            disabled={loading}
          />

          {error && <div className="recovery-error" role="alert">{error}</div>}
          {message && <div className="recovery-success" role="status">{message}</div>}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="back-link">
          <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}

const styles = `
  :root { --paper:#FFFCF2; --sand:#CCC5B9; --ash:#403D39; --ink:#252422; --orange:#EB5E28; }
  .recovery-page { min-height:100vh; box-sizing:border-box; display:flex; align-items:center; justify-content:center; position:relative; padding:6rem 1.25rem 4rem; font-family:"Space Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:radial-gradient(circle at 75% 20%,rgba(235,94,40,.12),transparent 22rem),linear-gradient(135deg,#FFFCF2 0%,#f5efe4 100%); }
  .recovery-brand { position:absolute; top:1.35rem; left:1.5rem; display:flex; align-items:center; gap:.75rem; font-size:1rem; font-weight:800; }
  .recovery-logo { width:2.25rem; height:2.25rem; display:grid; place-items:center; border-radius:8px; background:var(--orange); color:var(--paper); }
  .recovery-card { width:min(100%,430px); padding:2.1rem; border:1px solid rgba(64,61,57,.15); border-radius:14px; background:rgba(255,252,242,.92); box-shadow:0 28px 70px rgba(37,36,34,.13); }
  .recovery-kicker { display:inline-flex; padding:.35rem .75rem; border-radius:999px; background:rgba(235,94,40,.1); color:var(--orange); font-size:.78rem; font-weight:800; }
  h1 { margin:.9rem 0 .55rem; font-size:2.35rem; line-height:1.05; }
  .recovery-subtitle { margin:0 0 1.8rem; color:var(--ash); line-height:1.55; }
  form { display:grid; gap:.55rem; }
  label { margin-top:.45rem; font-size:.9rem; font-weight:750; }
  input { width:100%; box-sizing:border-box; padding:.9rem 1rem; border:1px solid rgba(64,61,57,.2); border-radius:8px; background:rgba(255,255,255,.55); color:var(--ink); font:inherit; outline:none; }
  input:focus { border-color:var(--orange); box-shadow:0 0 0 3px rgba(235,94,40,.12); }
  .recovery-error,.recovery-success { margin-top:.7rem; padding:.75rem .85rem; border-radius:8px; font-size:.9rem; line-height:1.45; }
  .recovery-error { border:1px solid rgba(190,40,40,.25); background:rgba(190,40,40,.07); color:#a32626; }
  .recovery-success { border:1px solid rgba(44,120,75,.25); background:rgba(44,120,75,.07); color:#27633e; }
  .submit-button { margin-top:.8rem; padding:.95rem 1rem; border:0; border-radius:8px; background:var(--orange); color:var(--paper); font:inherit; font-weight:850; cursor:pointer; }
  .submit-button:disabled { opacity:.65; cursor:wait; }
  .back-link { margin:1.4rem 0 0; text-align:center; font-size:.9rem; }
  a { color:var(--orange); text-decoration:none; font-weight:750; }
  @media (max-width:600px) { .recovery-card { padding:1.5rem; } h1 { font-size:2.05rem; } }
`;
