import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const SCHOOLS = [
  "Select school",
  "School of Computer Engineering",
  "School of Electronics Engineering",
  "School of Electrical Engineering",
  "School of Mechanical Engineering",
  "School of Civil Engineering",
  "School of Management",
  "School of Law",
  "School of Biotechnology",
  "Other",
];

// These two values must be spelled EXACTLY "Male" / "Female" —
// the backend stores this straight into the Gender enum in
// prisma/schema.prisma (mentorGenderScope), so it's case-sensitive.
const MENTEE_SEX = ["Select sex of mentees", "Male", "Female"];

export default function MentorRegister() {
  const navigate = useNavigate();

  const [pointer, setPointer] = useState({ x: 58, y: 42 });

  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    school: "",
    menteeRollStart: "",
    menteeRollEnd: "",
    menteeSex: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── OTP step state ─────────────────────────────────────────
  // Same two-step pattern as ParentRegister.jsx: fill form → send
  // OTP → enter the 6-digit code → THEN actually create the account.
  const [step,       setStep]       = useState(1);
  const [otp,        setOtp]        = useState("");
  const [otpError,   setOtpError]   = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
    if (!form.employeeId) errs.employeeId = "Employee ID is required.";
    if (!form.school || form.school === "Select school")
      errs.school = "Select your school.";
    if (!form.menteeRollStart)
      errs.menteeRollStart = "Starting roll number is required.";
    else if (!/^\d+$/.test(form.menteeRollStart))
      errs.menteeRollStart = "Enter a valid roll number.";
    if (!form.menteeRollEnd)
      errs.menteeRollEnd = "Ending roll number is required.";
    else if (!/^\d+$/.test(form.menteeRollEnd))
      errs.menteeRollEnd = "Enter a valid roll number.";
    if (
      /^\d+$/.test(form.menteeRollStart) &&
      /^\d+$/.test(form.menteeRollEnd) &&
      Number(form.menteeRollEnd) < Number(form.menteeRollStart)
    ) {
      errs.menteeRollEnd = "Ending roll number must be after the starting roll number.";
    }
    if (!form.menteeSex || form.menteeSex === "Select sex of mentees")
      errs.menteeSex = "Select the sex of your mentees.";
    if (!form.email) errs.email = "Email is required.";
    // FIX: mentors specifically need "fcs@kiit.ac.in", not just any
    // "@kiit.ac.in" — that's how the backend tells mentors apart from
    // students/hostel staff at the email level (see routes/auth/register.js).
    else if (!form.email.endsWith("fcs@kiit.ac.in"))
      errs.email = "Use your KIIT faculty email, ending in fcs@kiit.ac.in (e.g. xyzfcs@kiit.ac.in).";
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

  // ── Step 1: validate then send OTP ────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setOtpLoading(true);
    setOtpError("");
    try {
      await api.post("/auth/send-otp", { email: form.email.trim().toLowerCase() });
      setStep(2);
      setSuccessMsg(`Verification code sent to ${form.email}`);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Step 2: submit form + OTP ─────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setOtpError("");
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     "mentor",
        otp,
        // These three MUST use these exact key names — they match
        // what routes/auth/register.js reads for role === "mentor".
        rollRangeStart: form.menteeRollStart.trim(),
        rollRangeEnd:   form.menteeRollEnd.trim(),
        genderScope:    form.menteeSex, // "Male" or "Female"
        // employeeId / school / phone aren't stored by the backend
        // yet — sending them is harmless (extra fields are ignored),
        // kept here in case they get used later.
        employeeId: form.employeeId.trim(),
        school:     form.school,
        phone:      form.phone,
      });
      setSuccessMsg("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <style>{mentorRegisterMediaStyles}</style>
      <div className="mentor-register-bg" style={styles.background} />
      <div style={styles.pointerLight} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button
            style={styles.backBtn}
            onClick={() => (step === 2 ? setStep(1) : navigate("/register"))}
          >
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
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              <path d="M16 3.5 18 5.5 22 1.5" />
            </svg>
            Mentor
          </div>
          <h1 style={styles.heading}>Create your mentor account.</h1>
          <p style={styles.subheading}>
            Already registered?{" "}
            <a href="/login" style={styles.link}>Log in</a>
          </p>
        </div>

        {successMsg && <div style={styles.successBanner}>{successMsg}</div>}
        {otpError   && <div style={styles.errorBanner}>{otpError}</div>}

        {/* ── STEP 1: form ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate style={styles.form}>
            <div style={styles.row}>
              <Field
                label="Full name" name="name" type="text" placeholder="Your Name"
                value={form.name} onChange={handleChange} error={errors.name}
              />
              <Field
                label="Employee ID" name="employeeId" type="text" placeholder="KIIT-FAC-1024"
                value={form.employeeId} onChange={handleChange} error={errors.employeeId}
              />
            </div>

            <SelectField
              label="School" name="school" value={form.school}
              onChange={handleChange} options={SCHOOLS} error={errors.school}
            />

            <div style={styles.row}>
              <Field
                label="Mentee roll starts" name="menteeRollStart" type="text" placeholder="e.g. 2205001"
                value={form.menteeRollStart} onChange={handleChange} error={errors.menteeRollStart}
              />
              <Field
                label="Mentee roll ends" name="menteeRollEnd" type="text" placeholder="e.g. 2205050"
                value={form.menteeRollEnd} onChange={handleChange} error={errors.menteeRollEnd}
              />
            </div>

            <SelectField
              label="Sex of mentees" name="menteeSex" value={form.menteeSex}
              onChange={handleChange} options={MENTEE_SEX} error={errors.menteeSex}
            />

            <Field
              label="College email" name="email" type="email" placeholder="xyzfcs@kiit.ac.in"
              value={form.email} onChange={handleChange} error={errors.email}
              hint="Must end with fcs@kiit.ac.in (e.g. xyzfcs@kiit.ac.in)"
            />

            <Field
              label="Phone number" name="phone" type="tel" placeholder="XXXXXXXXXX"
              value={form.phone} onChange={handleChange} error={errors.phone}
              hint="Used for urgent leave and grievance notifications"
            />

            <div style={styles.row}>
              <PasswordField
                label="Password" name="password" value={form.password} onChange={handleChange}
                error={errors.password} show={showPass} onToggle={() => setShowPass((v) => !v)}
                placeholder="Min. 8 characters"
              />
              <PasswordField
                label="Confirm password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} error={errors.confirmPassword} show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)} placeholder="Re-enter password"
              />
            </div>

            <button type="submit"
              style={{ ...styles.submitBtn, ...(otpLoading ? styles.submitBtnLoading : {}) }}
              disabled={otpLoading}>
              {otpLoading
                ? <span style={styles.spinnerWrap}><Spinner /> Sending code...</span>
                : "Send verification code"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleRegister} noValidate style={styles.form}>
            <div style={fieldStyles.wrap}>
              <label style={fieldStyles.label}>6-Digit Verification Code</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                placeholder="Enter code from email"
                style={{ ...fieldStyles.input, fontSize: "22px", letterSpacing: "10px", textAlign: "center", height: "52px" }}
              />
              <span style={fieldStyles.hint}>
                Didn't receive it?{" "}
                <button type="button"
                  onClick={() => { setStep(1); setSuccessMsg(""); setOtpError(""); setOtp(""); }}
                  style={{ background: "none", border: "none", color: "#EB5E28", cursor: "pointer", fontSize: "11px", fontWeight: "600", padding: 0 }}>
                  Go back and resend
                </button>
              </span>
            </div>

            <button type="submit"
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnLoading : {}) }}
              disabled={loading}>
              {loading
                ? <span style={styles.spinnerWrap}><Spinner /> Creating account...</span>
                : "Create Account ✓"}
            </button>
          </form>
        )}

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
      <label style={fieldStyles.label} htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} placeholder={placeholder} value={value}
        onChange={onChange} autoComplete="off"
        style={{ ...fieldStyles.input, ...(error ? fieldStyles.inputError : {}) }}
      />
      {hint && !error && <span style={fieldStyles.hint}>{hint}</span>}
      {error && <span style={fieldStyles.error}>{error}</span>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label} htmlFor={name}>{label}</label>
      <div style={fieldStyles.selectWrap}>
        <select
          id={name} name={name} value={value} onChange={onChange}
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
      <label style={fieldStyles.label} htmlFor={name}>{label}</label>
      <div style={fieldStyles.passWrap}>
        <input
          id={name} name={name} type={show ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={onChange}
          style={{ ...fieldStyles.input, ...(error ? fieldStyles.inputError : {}), paddingRight: "44px" }}
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.7s linear infinite" }}>
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
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" },
  backBtn: { display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "#403D39", fontSize: "14px", cursor: "pointer", padding: "4px 0", fontFamily: "'Space Grotesk', sans-serif", transition: "color 0.15s" },
  brand: { display: "flex", alignItems: "center", gap: "8px" },
  logoMark: { lineHeight: 0 },
  wordmark: { color: "#252422", fontSize: "16px", fontWeight: "700", letterSpacing: "0.06em" },
  headingBlock: { marginBottom: "1.75rem" },
  rolePill: { display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "rgba(235,94,40,0.14)", color: "#EB5E28", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", marginBottom: "10px", letterSpacing: "0.02em" },
  heading: { color: "#252422", fontSize: "24px", fontWeight: "600", margin: "0 0 0.4rem", letterSpacing: "-0.01em", lineHeight: "1.3" },
  subheading: { color: "#403D39", fontSize: "14px", margin: 0 },
  link: { color: "#EB5E28", textDecoration: "none", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  submitBtn: { width: "100%", height: "44px", backgroundColor: "#EB5E28", color: "#FFFCF2", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", marginTop: "4px", transition: "opacity 0.15s", letterSpacing: "0.01em" },
  submitBtnLoading: { opacity: 0.7, cursor: "not-allowed" },
  spinnerWrap: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  footer: { color: "rgba(64,61,57,0.68)", fontSize: "12px", textAlign: "center", opacity: 1, marginTop: "2rem" },
  successBanner: { backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #86EFAC", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
  errorBanner:   { backgroundColor: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "12px" },
};

const fieldStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { color: "#403D39", fontSize: "13px", fontWeight: "500", letterSpacing: "0.01em" },
  input: { width: "100%", height: "42px", backgroundColor: "rgba(255,252,242,0.9)", border: "1px solid rgba(64,61,57,0.18)", borderRadius: "8px", color: "#252422", fontSize: "14px", padding: "0 12px", fontFamily: "'Space Grotesk', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" },
  inputError: { borderColor: "#E24B4A" },
  hint: { color: "#77716a", fontSize: "11px" },
  error: { color: "#E24B4A", fontSize: "11px", fontWeight: "500" },
  selectWrap: { position: "relative" },
  select: { width: "100%", height: "42px", backgroundColor: "rgba(255,252,242,0.9)", border: "1px solid rgba(64,61,57,0.18)", borderRadius: "8px", fontSize: "14px", padding: "0 36px 0 12px", fontFamily: "'Space Grotesk', sans-serif", outline: "none", boxSizing: "border-box", appearance: "none", cursor: "pointer" },
  selectArrow: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  passWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" },
};

const mentorRegisterMediaStyles = `
  @media (max-width: 760px) {
    .mentor-register-bg {
      background-image:
        linear-gradient(180deg, rgba(255,252,242,0.94) 0%, rgba(255,252,242,0.82) 48%, rgba(255,252,242,0.72) 100%),
        url("/registermobile.png") !important;
      background-position: center top !important;
    }
  }
`;