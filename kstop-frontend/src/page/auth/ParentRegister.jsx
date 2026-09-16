import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

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
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass    ] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── OTP step state ─────────────────────────────────────────
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
    if (!form.parentName) errs.parentName = "Parent name is required.";
    if (!form.wardName)   errs.wardName   = "Ward name is required.";
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

  // ── Step 1: validate then send OTP ────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setOtpLoading(true);
    setOtpError("");
    try {
      // Parent registration requires the backend to verify the supplied
      // email + phone + child roll number against the official registry.
      await api.post("/auth/send-otp", {
        email: form.email.trim().toLowerCase(),
        role: "parent",
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim(),
      });
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
        name:       form.parentName.trim(), // backend uses "name" for all roles
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
        role:       "parent",
        otp,
        wardName:   form.wardName.trim(),
        rollNumber: form.rollNumber.trim(),
        relation:   form.relation,
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
      <style>{parentRegisterMediaStyles}</style>
      <div className="parent-register-bg" style={styles.background} />
      <div style={styles.pointerLight} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => step === 2 ? setStep(1) : navigate("/register")}>
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
          <h1 style={styles.heading}>
            {step === 1 ? "Create your parent account." : "Verify your email."}
          </h1>
          <p style={styles.subheading}>
            {step === 1
              ? <> Already registered? <a href="/login" style={styles.link}>Log in</a> </>
              : `Enter the 6-digit code sent to ${form.email}`
            }
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: "3px", borderRadius: "2px",
              backgroundColor: step >= s ? "#EB5E28" : "rgba(64,61,57,0.15)",
              transition: "background-color 0.2s",
            }} />
          ))}
        </div>

        {successMsg && <div style={styles.successBanner}>{successMsg}</div>}
        {otpError   && <div style={styles.errorBanner}>{otpError}</div>}

        {/* ── STEP 1: form ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate style={styles.form}>
            <div style={styles.row}>
              <Field label="Parent name" name="parentName" type="text" placeholder="Anita Das"
                value={form.parentName} onChange={handleChange} error={errors.parentName} />
              <Field label="Ward name" name="wardName" type="text" placeholder="Soumya Das"
                value={form.wardName} onChange={handleChange} error={errors.wardName} />
            </div>

            <div style={styles.row}>
              <Field label="Ward roll number" name="rollNumber" type="text" placeholder="22053XXX"
                value={form.rollNumber} onChange={handleChange} error={errors.rollNumber}
                hint="Enter the student's KIIT roll number" />
              <SelectField label="Relation" name="relation" value={form.relation}
                onChange={handleChange} options={RELATIONS} error={errors.relation} />
            </div>

            <Field label="Email address" name="email" type="email" placeholder="parent@example.com"
              value={form.email} onChange={handleChange} error={errors.email}
              hint="We will use this for account recovery and alerts" />

            <Field label="Phone number" name="phone" type="tel" placeholder="9876543210"
              value={form.phone} onChange={handleChange} error={errors.phone}
              hint="Use the primary number linked to your ward" />

            <div style={styles.row}>
              <PasswordField label="Password" name="password" value={form.password}
                onChange={handleChange} error={errors.password}
                show={showPass} onToggle={() => setShowPass((v) => !v)} placeholder="Min. 8 characters" />
              <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} error={errors.confirmPassword}
                show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} placeholder="Re-enter password" />
            </div>

            <button type="submit"
              style={{ ...styles.submitBtn, ...(otpLoading ? styles.submitBtnLoading : {}) }}
              disabled={otpLoading}>
              {otpLoading
                ? <span style={styles.spinnerWrap}><Spinner /> Sending code...</span>
                : "Send Verification Code →"}
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
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", position: "relative", overflow: "hidden", background: "#FFFCF2", color: "#252422" },
  background: { position: "absolute", inset: 0, background: "radial-gradient(circle at var(--bg-x) var(--bg-y), rgba(235,94,40,0.12), transparent 34%), linear-gradient(135deg,#FFFCF2,#F4F1EA)", zIndex: 0 },
  pointerLight: { position: "absolute", inset: 0, background: "radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(235,94,40,0.07), transparent 24%)", pointerEvents: "none", zIndex: 1 },
  container: { position: "relative", zIndex: 2, width: "min(760px, calc(100% - 32px))", margin: "0 auto", padding: "34px 0 60px" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "52px" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: "7px", background: "transparent", border: "none", cursor: "pointer", color: "#403D39", fontSize: "13px" },
  brand: { display: "flex", alignItems: "center", gap: "8px" },
  logoMark: { display: "flex" },
  wordmark: { fontSize: "15px", fontWeight: "800", letterSpacing: "1.5px" },
  headingBlock: { marginBottom: "24px" },
  rolePill: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 10px", borderRadius: "999px", background: "rgba(235,94,40,0.1)", color: "#EB5E28", fontSize: "11px", fontWeight: "700", marginBottom: "12px" },
  heading: { margin: 0, fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.05, letterSpacing: "-1.5px" },
  subheading: { margin: "12px 0 0", color: "#78736D", fontSize: "14px" },
  link: { color: "#EB5E28", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  row: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px" },
  submitBtn: { marginTop: "8px", height: "52px", border: "none", borderRadius: "10px", background: "#252422", color: "#FFFCF2", fontWeight: "700", cursor: "pointer" },
  submitBtnLoading: { opacity: 0.65, cursor: "not-allowed" },
  spinnerWrap: { display: "inline-flex", alignItems: "center", gap: "8px" },
  successBanner: { marginBottom: "16px", padding: "12px 14px", borderRadius: "9px", background: "rgba(52,168,83,0.1)", color: "#27743a", fontSize: "13px" },
  errorBanner: { marginBottom: "16px", padding: "12px 14px", borderRadius: "9px", background: "rgba(217,48,37,0.08)", color: "#a61b13", fontSize: "13px" },
};

const fieldStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "700", color: "#403D39" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid rgba(64,61,57,0.2)", borderRadius: "9px", background: "rgba(255,255,255,0.7)", color: "#252422", padding: "0 14px", height: "46px", outline: "none" },
  hint: { fontSize: "10px", color: "#9a958d" },
};

function Field({ label, name, type, placeholder, value, onChange, error, hint }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label}>{label}</label>
      <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} style={fieldStyles.input} />
      {error ? <span style={{ ...fieldStyles.hint, color: "#a61b13" }}>{error}</span> : hint ? <span style={fieldStyles.hint}>{hint}</span> : null}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={fieldStyles.input}>
        {options.map((option) => <option key={option} value={option === "Select relation" ? "" : option}>{option}</option>)}
      </select>
      {error && <span style={{ ...fieldStyles.hint, color: "#a61b13" }}>{error}</span>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, error, show, onToggle, placeholder }) {
  return (
    <div style={fieldStyles.wrap}>
      <label style={fieldStyles.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input name={name} type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange} style={{ ...fieldStyles.input, paddingRight: "62px" }} />
        <button type="button" onClick={onToggle} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#78736D", cursor: "pointer", fontSize: "11px" }}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <span style={{ ...fieldStyles.hint, color: "#a61b13" }}>{error}</span>}
    </div>
  );
}

function Spinner() {
  return <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />;
}

const parentRegisterMediaStyles = `
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) {
  .parent-register-bg { background-size: cover; }
}
`;
