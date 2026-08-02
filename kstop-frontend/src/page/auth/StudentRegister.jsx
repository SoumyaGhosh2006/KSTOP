import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOSTELS = [
  "Select your hostel",
  "HS-1", "HS-2", "HS-3", "HS-4", "HS-5",
  "HS-6", "HS-7", "HS-8", "HS-9", "HS-10",
  "HS-11", "HS-12", "HS-13", "HS-14", "HS-15",
  "HN-1", "HN-2", "HN-3", "HN-4", "HN-5",
  "KIIT Nagar", "Other",
];

const GENDERS = ["Select gender", "Male", "Female", "Prefer not to say"];

export default function StudentRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    rollNumber: "",
    name: "",
    hostel: "",
    gender: "",
    mentorName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    else if (!form.email.endsWith("@kiit.ac.in"))
      errs.email = "Use your KIIT college email (@kiit.ac.in).";
    if (!form.rollNumber) errs.rollNumber = "Roll number is required.";
    if (!form.name) errs.name = "Full name is required.";
    if (!form.hostel || form.hostel === "Select your hostel")
      errs.hostel = "Select your hostel.";
    if (!form.gender || form.gender === "Select gender")
      errs.gender = "Select your gender.";
    if (!form.mentorName) errs.mentorName = "Mentor name is required.";
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
    // const res = await api.post("/auth/register", { ...form, role: "student" });
    setTimeout(() => {
      setLoading(false);
      navigate("/login");
    }, 1200);
  }

  return (
    <div style={styles.page}>
      <div style={styles.gridOverlay} />

      <div style={styles.container}>
        {/* Back + brand */}
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate("/register")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
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

        {/* Heading */}
        <div style={styles.headingBlock}>
          <div style={styles.rolePill}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            Student
          </div>
          <h1 style={styles.heading}>Create your account.</h1>
          <p style={styles.subheading}>
            Already registered?{" "}
            <a href="/login" style={styles.link}>Log in</a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Row: name + roll */}
          <div style={styles.row}>
            <Field
              label="Full name"
              name="name"
              type="text"
              placeholder="Soumya Das"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              label="Roll number"
              name="rollNumber"
              type="text"
              placeholder="22053XXX"
              value={form.rollNumber}
              onChange={handleChange}
              error={errors.rollNumber}
            />
          </div>

          {/* College email — full width */}
          <Field
            label="College email"
            name="email"
            type="email"
            placeholder="22053xxx@kiit.ac.in"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            hint="Must be your @kiit.ac.in address"
          />

          {/* Row: hostel + gender */}
          <div style={styles.row}>
            <SelectField
              label="Hostel"
              name="hostel"
              value={form.hostel}
              onChange={handleChange}
              options={HOSTELS}
              error={errors.hostel}
            />
            <SelectField
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              options={GENDERS}
              error={errors.gender}
            />
          </div>

          {/* Mentor name — full width */}
          <Field
            label="Mentor name"
            name="mentorName"
            type="text"
            placeholder="Dr. Priya Sharma"
            value={form.mentorName}
            onChange={handleChange}
            error={errors.mentorName}
            hint="Enter your assigned faculty mentor's name"
          />

          {/* Password row */}
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
                <Spinner /> Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          KIIT University · Student–Mentor–Hostel Management System
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

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
        autoComplete="off"
        style={{
          ...fieldStyles.input,
          ...(error ? fieldStyles.inputError : {}),
        }}
      />
      {hint && !error && <span style={fieldStyles.hint}>{hint}</span>}
      {error && <span style={fieldStyles.error}>{error}</span>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error }) {
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
            color: value && value !== options[0] ? "#FFFCF2" : "#888780",
          }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} disabled={opt === options[0]} hidden={opt === options[0]}>
              {opt}
            </option>
          ))}
        </select>
        <svg style={fieldStyles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC5B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {error && <span style={fieldStyles.error}>{error}</span>}
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
            ...(error ? fieldStyles.inputError : {}),
            paddingRight: "44px",
          }}
        />
        <button type="button" onClick={onToggle} style={fieldStyles.eyeBtn} tabIndex={-1}>
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC5B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC5B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && <span style={fieldStyles.error}>{error}</span>}
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

/* ── Styles ── */

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#252422",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "2.5rem 1rem 3rem",
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
  container: {
    width: "100%",
    maxWidth: "560px",
    position: "relative",
    zIndex: 1,
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
    color: "#CCC5B9",
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
    color: "#FFFCF2",
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
    color: "#FFFCF2",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 0.4rem",
    letterSpacing: "-0.01em",
    lineHeight: "1.3",
  },
  subheading: {
    color: "#CCC5B9",
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
    color: "#CCC5B9",
    fontSize: "12px",
    textAlign: "center",
    opacity: 0.5,
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
    color: "#CCC5B9",
    fontSize: "13px",
    fontWeight: "500",
    letterSpacing: "0.01em",
  },
  input: {
    width: "100%",
    height: "42px",
    backgroundColor: "#403D39",
    border: "1px solid rgba(204,197,185,0.18)",
    borderRadius: "8px",
    color: "#FFFCF2",
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
    color: "#888780",
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
    backgroundColor: "#403D39",
    border: "1px solid rgba(204,197,185,0.18)",
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