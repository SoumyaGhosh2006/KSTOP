import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RELATIONS = ["Select relation", "Father", "Mother", "Guardian", "Other"];

export default function ParentRegister() {
  const navigate = useNavigate();
  const [pointer, setPointer] = useState({ x: 58, y: 42 });
  const [form, setForm] = useState({
    parentName: "",
    wardName: "",
    rollNumber: "",
    relation: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    if (!form.parentName) errs.parentName = "Parent name is required.";
    if (!form.wardName) errs.wardName = "Ward name is required.";
    if (!form.rollNumber) errs.rollNumber = "Ward roll number is required.";
    if (!form.relation || form.relation === "Select relation")
      errs.relation = "Select your relation.";
    if (!form.email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
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
    // const res = await api.post("/auth/register", { ...form, role: "parent" });
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
      <style>{parentRegisterMediaStyles}</style>
      <div className="parent-register-bg" style={styles.background} />
      <div style={styles.pointerLight} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate("/register")}>
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Parent
          </div>
          <h1 style={styles.heading}>Create your parent account.</h1>
          <p style={styles.subheading}>
            Already registered?{" "}
            <a href="/login" style={styles.link}>Log in</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <div style={styles.row}>
            <Field
              label="Parent name"
              name="parentName"
              type="text"
              placeholder="Anita Das"
              value={form.parentName}
              onChange={handleChange}
              error={errors.parentName}
            />
            <Field
              label="Ward name"
              name="wardName"
              type="text"
              placeholder="Soumya Das"
              value={form.wardName}
              onChange={handleChange}
              error={errors.wardName}
            />
          </div>

          <div style={styles.row}>
            <Field
              label="Ward roll number"
              name="rollNumber"
              type="text"
              placeholder="22053XXX"
              value={form.rollNumber}
              onChange={handleChange}
              error={errors.rollNumber}
              hint="Enter the student's KIIT roll number"
            />
            <SelectField
              label="Relation"
              name="relation"
              value={form.relation}
              onChange={handleChange}
              options={RELATIONS}
              error={errors.relation}
            />
          </div>

          <Field
            label="Email address"
            name="email"
            type="email"
            placeholder="parent@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            hint="We will use this for account recovery and alerts"
          />

          <Field
            label="Phone number"
            name="phone"
            type="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            hint="Use the primary number linked to your ward"
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
            color: value && value !== options[0] ? "#252422" : "#77716a",
          }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} disabled={opt === options[0]} hidden={opt === options[0]}>
              {opt}
            </option>
          ))}
        </select>
        <svg style={fieldStyles.selectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#403D39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#403D39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#403D39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
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

const parentRegisterMediaStyles = `
  @media (max-width: 760px) {
    .parent-register-bg {
      background-image:
        linear-gradient(180deg, rgba(255,252,242,0.94) 0%, rgba(255,252,242,0.82) 48%, rgba(255,252,242,0.72) 100%),
        url("/registermobile.png") !important;
      background-position: center top !important;
    }
  }
`;
