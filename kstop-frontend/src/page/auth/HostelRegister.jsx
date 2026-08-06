import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Hostel options shown in the hostel staff registration dropdown.
const HOSTELS = [
  "Select assigned hostel",
  "HS-1", "HS-2", "HS-3", "HS-4", "HS-5",
  "HS-6", "HS-7", "HS-8", "HS-9", "HS-10",
  "HS-11", "HS-12", "HS-13", "HS-14", "HS-15",
  "HN-1", "HN-2", "HN-3", "HN-4", "HN-5", "Other",
];

export default function HostelRegister() {
  const navigate = useNavigate();

  // Pointer coordinates drive the moving background glow.
  const [pointer, setPointer] = useState({ x: 58, y: 42 });

  // Hostel staff registration fields stored together for predictable updates.
  const [form, setForm] = useState({
    name: "",
    staffId: "",
    assignedHostelId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Convert pointer location into CSS percentage values.
  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPointer({ x, y });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name) errs.name = "Full name is required.";
    if (!form.staffId) errs.staffId = "Staff ID is required.";
    if (!form.assignedHostelId || form.assignedHostelId === "Select assigned hostel")
      errs.assignedHostelId = "Select your assigned hostel.";
    if (!form.email) errs.email = "Email is required.";
    else if (!form.email.endsWith("@kiit.ac.in"))
      errs.email = "Use your KIIT college email (@kiit.ac.in).";
    if (!form.phone) errs.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phone))
      errs.phone = "Enter a 10-digit phone number.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Confirm your password.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    // TODO: POST /auth/register with form data
    // const res = await api.post("/auth/register", { ...form, role: "hostel" });
    setTimeout(() => {
      setLoading(false);
      navigate("/login");
    }, 1200);
  }

  return (
    <div
      style={{
        ...styles.page,
        "--pointer-x": `${pointer.x}%`,
        "--pointer-y": `${pointer.y}%`,
        "--bg-x": `${50 + (pointer.x - 50) * 0.08}%`,
        "--bg-y": `${50 + (pointer.y - 50) * 0.06}%`,
      }}
      onPointerMove={handlePointerMove}
    >
      <style>{hostelRegisterMediaStyles}</style>
      <div className="hostel-register-bg" style={styles.background} />
      <div style={styles.pointerLight} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button type="button" style={styles.backBtn} onClick={() => navigate("/register")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div style={styles.brand}>
            <div style={styles.logoMark}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#EB5E28" />
                <text x="14" y="20" textAnchor="middle" fill="#FFFCF2" fontSize="14" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">K</text>
              </svg>
            </div>
            <span style={styles.wordmark}>K-STOP</span>
          </div>
        </div>

        <div style={styles.headingBlock}>
          <div style={styles.rolePill}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22v-8h6v8" />
            </svg>
            Hostel
          </div>
          <h1 style={styles.heading}>Create your hostel account.</h1>
          <p style={styles.subheading}>
            Already registered?{" "}
            <a href="/login" style={styles.link}>Log in</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.row}>
            <Field
              label="Full name"
              name="name"
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              label="Staff ID"
              name="staffId"
              type="text"
              placeholder="KIIT-HOSTEL-1024"
              value={form.staffId}
              onChange={handleChange}
              error={errors.staffId}
            />
          </div>

          <SelectField
            label="Assigned hostel"
            name="assignedHostelId"
            value={form.assignedHostelId}
            onChange={handleChange}
            options={HOSTELS}
            error={errors.assignedHostelId}
            hint="This links the account to the hostel office dashboard"
          />

          <Field
            label="College email"
            name="email"
            type="email"
            placeholder="hostel@kiit.ac.in"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            hint="Must be your @kiit.ac.in address"
          />

          <Field
            label="Phone number"
            name="phone"
            type="tel"
            placeholder="XXXXXXXXXX"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            hint="Used for urgent hostel notifications"
          />

          <div style={styles.row}>
            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              show={showPass}
              onToggle={() => setShowPass((v) => !v)}
              placeholder="Min. 8 characters"
            />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnLoading : {}),
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.spinnerWrap}>
                <Spinner /> Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          KIIT University - Student-Mentor-Hostel Management System
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, type, placeholder, value, onChange, error, hint }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          ...fieldStyles.input,
          ...(error ? fieldStyles.inputError : {}),
        }}
      />
      {hint ? <span style={fieldStyles.hint}>{hint}</span> : null}
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error, hint }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label} htmlFor={name}>
        {label}
      </label>
      <div style={fieldStyles.selectWrap}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          style={{
            ...fieldStyles.select,
            ...(error ? fieldStyles.inputError : {}),
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={fieldStyles.selectArrow}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {hint ? <span style={fieldStyles.hint}>{hint}</span> : null}
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, error, show, onToggle, placeholder }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label} htmlFor={name}>
        {label}
      </label>
      <div style={fieldStyles.passWrap}>
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            ...fieldStyles.input,
            paddingRight: "42px",
            ...(error ? fieldStyles.inputError : {}),
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={fieldStyles.eyeBtn}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M4 4l16 16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.7s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#FFFCF2",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "2.5rem 1rem 3rem",
    fontFamily: "'Space Grotesk', sans-serif",
    position: "relative",
    overflowX: "hidden",
    isolation: "isolate",
  },
  background: {
    position: "absolute",
    inset: 0,
    zIndex: -3,
    backgroundImage:
      "linear-gradient(90deg, rgba(255,252,242,0.94) 0%, rgba(255,252,242,0.82) 42%, rgba(255,252,242,0.56) 100%), url('/registerpc.png')",
    backgroundSize: "cover",
    backgroundPosition: "var(--bg-x) var(--bg-y)",
    transition: "background-position 180ms ease-out",
  },
  pointerLight: {
    position: "absolute",
    inset: 0,
    zIndex: -2,
    background:
      "radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(235,94,40,0.16), rgba(235,94,40,0.04) 13rem, transparent 25rem)",
    mixBlendMode: "multiply",
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    position: "relative",
    zIndex: 1,
    background: "rgba(255,252,242,0.84)",
    border: "1px solid rgba(64,61,57,0.14)",
    borderRadius: "8px",
    boxShadow: "0 24px 60px rgba(37,36,34,0.13)",
    backdropFilter: "blur(14px)",
    padding: "1.4rem",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "none",
    color: "#403D39",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 0",
    fontFamily: "'Space Grotesk', sans-serif",
    transition: "color 0.15s",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoMark: { lineHeight: 0 },
  wordmark: {
    color: "#252422",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.06em",
  },
  headingBlock: {
    marginBottom: "1.75rem",
  },
  rolePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(235,94,40,0.14)",
    color: "#EB5E28",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
    marginBottom: "10px",
    letterSpacing: "0.02em",
  },
  heading: {
    color: "#252422",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 0.4rem",
    letterSpacing: "-0.01em",
    lineHeight: "1.3",
  },
  subheading: {
    color: "#403D39",
    fontSize: "14px",
    margin: 0,
  },
  link: {
    color: "#EB5E28",
    textDecoration: "none",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  submitBtn: {
    width: "100%",
    height: "44px",
    backgroundColor: "#EB5E28",
    color: "#FFFCF2",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    marginTop: "4px",
    transition: "opacity 0.15s",
    letterSpacing: "0.01em",
  },
  submitBtnLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  spinnerWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  footer: {
    color: "rgba(64,61,57,0.68)",
    fontSize: "12px",
    textAlign: "center",
    opacity: 1,
    marginTop: "2rem",
  },
};

const fieldStyles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    color: "#403D39",
    fontSize: "13px",
    fontWeight: "500",
    letterSpacing: "0.01em",
  },
  input: {
    width: "100%",
    height: "42px",
    backgroundColor: "rgba(255,252,242,0.9)",
    border: "1px solid rgba(64,61,57,0.18)",
    borderRadius: "8px",
    color: "#252422",
    fontSize: "14px",
    padding: "0 12px",
    fontFamily: "'Space Grotesk', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  inputError: {
    borderColor: "#E24B4A",
  },
  hint: {
    color: "#77716a",
    fontSize: "11px",
  },
  error: {
    color: "#E24B4A",
    fontSize: "11px",
    fontWeight: "500",
  },
  selectWrap: {
    position: "relative",
  },
  select: {
    width: "100%",
    height: "42px",
    backgroundColor: "rgba(255,252,242,0.9)",
    border: "1px solid rgba(64,61,57,0.18)",
    borderRadius: "8px",
    fontSize: "14px",
    padding: "0 36px 0 12px",
    fontFamily: "'Space Grotesk', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    cursor: "pointer",
  },
  selectArrow: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  passWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
  },
};

const hostelRegisterMediaStyles = `
  @media (max-width: 760px) {
    .hostel-register-bg {
      background-image:
        linear-gradient(180deg, rgba(255,252,242,0.94) 0%, rgba(255,252,242,0.82) 48%, rgba(255,252,242,0.72) 100%),
        url("/registermobile.png") !important;
      background-position: center top !important;
    }
  }
`;
