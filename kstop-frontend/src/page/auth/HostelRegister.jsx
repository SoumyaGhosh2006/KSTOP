import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOSTELS = [
  "Select hostel",
  "HS-1",
  "HS-2",
  "HS-3",
  "HS-4",
  "HS-5",
  "HS-6",
  "HS-7",
  "HS-8",
  "HS-9",
  "HS-10",
  "HS-11",
  "HS-12",
  "HS-13",
  "HS-14",
  "HS-15",
  "HN-1",
  "HN-2",
  "HN-3",
  "HN-4",
  "HN-5",
  "KIIT Nagar",
  "Other",
];

export default function HostelRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hostelName: "",
    wardenName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    selectedHostel: "Select hostel",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const next = {};
    if (!form.wardenName.trim()) next.wardenName = "Warden name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.selectedHostel || form.selectedHostel === "Select hostel") next.selectedHostel = "Choose a hostel.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) next.confirmPassword = "Confirm your password.";
    else if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    // TODO: submit registration data to backend
    setTimeout(() => {
      setLoading(false);
      navigate("/register");
    }, 1000);
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topBar}>
          <button style={styles.backButton} onClick={() => navigate("/register")}> 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div style={styles.brand}> 
            <div style={styles.logoMark}>K</div>
            <span style={styles.wordmark}>K-STOP</span>
          </div>
        </header>

        <div style={styles.headingBlock}>
          <span style={styles.rolePill}>Hostel Registration</span>
          <h1 style={styles.title}>Register the hostel account.</h1>
          <p style={styles.subtitle}>Use a separate hostel registration form to create the warden access account.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.row}>
            <Field
              label="Hostel label"
              name="hostelName"
              type="text"
              placeholder="Hostel name"
              value={form.hostelName}
              onChange={handleChange}
              error={errors.hostelName}
            />
            <SelectField
              label="Hostel block"
              name="selectedHostel"
              value={form.selectedHostel}
              options={HOSTELS}
              onChange={handleChange}
              error={errors.selectedHostel}
            />
          </div>

          <Field
            label="Warden name"
            name="wardenName"
            type="text"
            placeholder="Full name"
            value={form.wardenName}
            onChange={handleChange}
            error={errors.wardenName}
          />

          <div style={styles.row}>
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="warden@kiit.ac.in"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />
          </div>

          <div style={styles.row}>
            <PasswordField
              label="Password"
              name="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              show={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
            />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
            />
          </div>

          <button type="submit" style={{ ...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {}) }} disabled={loading}>
            {loading ? "Registering…" : "Create hostel account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type, placeholder, value, onChange, error }) {
  return (
    <div style={fieldStyles.field}>
      <label htmlFor={name} style={fieldStyles.label}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...fieldStyles.input, ...(error ? fieldStyles.inputError : {}) }}
      />
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

function SelectField({ label, name, value, options, onChange, error }) {
  return (
    <div style={fieldStyles.field}>
      <label htmlFor={name} style={fieldStyles.label}>{label}</label>
      <div style={fieldStyles.selectWrapper}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          style={{ ...fieldStyles.select, ...(error ? fieldStyles.inputError : {}) }}
        >
          {options.map((option) => (
            <option key={option} value={option} disabled={option === options[0]} hidden={option === options[0]}>
              {option}
            </option>
          ))}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC5B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={fieldStyles.selectIcon}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

function PasswordField({ label, name, value, placeholder, onChange, error, show, onToggle }) {
  return (
    <div style={fieldStyles.field}>
      <label htmlFor={name} style={fieldStyles.label}>{label}</label>
      <div style={fieldStyles.passwordField}>
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ ...fieldStyles.input, ...(error ? fieldStyles.inputError : {}), paddingRight: "3.5rem" }}
        />
        <button type="button" onClick={onToggle} style={fieldStyles.eyeButton} tabIndex={-1}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <span style={fieldStyles.error}>{error}</span> : null}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1.25rem",
    background: "#252422",
    color: "#FFFCF2",
    fontFamily: "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "560px",
    padding: "2rem",
    borderRadius: "0.75rem",
    background: "#403D39",
    border: "1px solid rgba(255,252,242,0.06)",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "transparent",
    border: "none",
    color: "#CCC5B9",
    fontSize: "0.95rem",
    cursor: "pointer",
    padding: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoMark: {
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "0.5rem",
    display: "grid",
    placeItems: "center",
    background: "#EB5E28",
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
  headingBlock: {
    marginBottom: "1.75rem",
  },
  rolePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "rgba(235,94,40,0.14)",
    color: "#EB5E28",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.45rem 0.85rem",
    borderRadius: "20px",
    marginBottom: "0.75rem",
  },
  title: {
    margin: 0,
    fontSize: "1.9rem",
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
    fontWeight: 600,
    color: "#FFFCF2",
  },
  subtitle: {
    margin: "0.75rem 0 0",
    color: "#CCC5B9",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
  },
  submitButton: {
    width: "100%",
    minHeight: "2.75rem",
    padding: "0 1rem",
    borderRadius: "0.5rem",
    border: "none",
    background: "#EB5E28",
    color: "#FFFCF2",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.25rem",
    transition: "opacity 0.15s ease",
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};

const fieldStyles = {
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    color: "#CCC5B9",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    minHeight: "2.6rem",
    padding: "0.85rem 0.95rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(204,197,185,0.18)",
    background: "#252422",
    color: "#FFFCF2",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  selectWrapper: {
    position: "relative",
  },
  select: {
    width: "100%",
    minHeight: "2.6rem",
    padding: "0.85rem 2.5rem 0.85rem 0.95rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(204,197,185,0.18)",
    background: "#252422",
    color: "#FFFCF2",
    fontSize: "0.95rem",
    appearance: "none",
    outline: "none",
    boxSizing: "border-box",
  },
  selectIcon: {
    position: "absolute",
    top: "50%",
    right: "0.85rem",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  passwordField: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#EB5E28",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0.25rem",
  },
  inputError: {
    borderColor: "#E24B4A",
  },
  error: {
    color: "#E24B4A",
    fontSize: "0.8rem",
    marginTop: "0.25rem",
  },
};
