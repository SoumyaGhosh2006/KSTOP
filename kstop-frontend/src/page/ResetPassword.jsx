import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is missing its security token. Please request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to reset your password.");
      }

      setMessage(data.message || "Password reset successfully.");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reset-page">
      <style>{styles}</style>
      <header className="reset-brand" aria-label="K-STOP">
        <div className="reset-logo" aria-hidden="true">K</div>
        <span>K-STOP</span>
      </header>

      <section className="reset-card" aria-labelledby="reset-title">
        <span className="reset-kicker">Secure password reset</span>
        <h1 id="reset-title">Create a new password.</h1>
        <p className="reset-subtitle">
          Choose a new password for your K-STOP account.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={loading}
          />

          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter the password again"
            autoComplete="new-password"
            disabled={loading}
          />

          <button
            type="button"
            className="show-password"
            onClick={() => setShowPasswords((visible) => !visible)}
            disabled={loading}
          >
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          {error && <div className="reset-error" role="alert">{error}</div>}
          {message && <div className="reset-success" role="status">{message}</div>}

          <button className="submit-button" type="submit" disabled={loading || Boolean(message)}>
            {loading ? "Updating..." : "Reset Password"}
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
  :root { --paper:#FFFCF2; --ash:#403D39; --ink:#252422; --orange:#EB5E28; }
  .reset-page { min-height:100vh; box-sizing:border-box; display:flex; align-items:center; justify-content:center; position:relative; padding:6rem 1.25rem 4rem; font-family:"Space Grotesk",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:radial-gradient(circle at 75% 20%,rgba(235,94,40,.12),transparent 22rem),linear-gradient(135deg,#FFFCF2 0%,#f5efe4 100%); }
  .reset-brand { position:absolute; top:1.35rem; left:1.5rem; display:flex; align-items:center; gap:.75rem; font-size:1rem; font-weight:800; }
  .reset-logo { width:2.25rem; height:2.25rem; display:grid; place-items:center; border-radius:8px; background:var(--orange); color:var(--paper); }
  .reset-card { width:min(100%,430px); padding:2.1rem; border:1px solid rgba(64,61,57,.15); border-radius:14px; background:rgba(255,252,242,.92); box-shadow:0 28px 70px rgba(37,36,34,.13); }
  .reset-kicker { display:inline-flex; padding:.35rem .75rem; border-radius:999px; background:rgba(235,94,40,.1); color:var(--orange); font-size:.78rem; font-weight:800; }
  h1 { margin:.9rem 0 .55rem; font-size:2.35rem; line-height:1.05; }
  .reset-subtitle { margin:0 0 1.8rem; color:var(--ash); line-height:1.55; }
  form { display:grid; gap:.55rem; }
  label { margin-top:.45rem; font-size:.9rem; font-weight:750; }
  input { width:100%; box-sizing:border-box; padding:.9rem 1rem; border:1px solid rgba(64,61,57,.2); border-radius:8px; background:rgba(255,255,255,.55); color:var(--ink); font:inherit; outline:none; }
  input:focus { border-color:var(--orange); box-shadow:0 0 0 3px rgba(235,94,40,.12); }
  .show-password { justify-self:start; margin:.15rem 0 .2rem; border:0; padding:0; background:transparent; color:var(--orange); font:inherit; font-size:.85rem; font-weight:800; cursor:pointer; }
  .reset-error,.reset-success { margin-top:.7rem; padding:.75rem .85rem; border-radius:8px; font-size:.9rem; line-height:1.45; }
  .reset-error { border:1px solid rgba(190,40,40,.25); background:rgba(190,40,40,.07); color:#a32626; }
  .reset-success { border:1px solid rgba(44,120,75,.25); background:rgba(44,120,75,.07); color:#27633e; }
  .submit-button { margin-top:.8rem; padding:.95rem 1rem; border:0; border-radius:8px; background:var(--orange); color:var(--paper); font:inherit; font-weight:850; cursor:pointer; }
  .submit-button:disabled { opacity:.65; cursor:wait; }
  .back-link { margin:1.4rem 0 0; text-align:center; font-size:.9rem; }
  a { color:var(--orange); text-decoration:none; font-weight:750; }
  @media (max-width:600px) { .reset-card { padding:1.5rem; } h1 { font-size:2.05rem; } }
`;
