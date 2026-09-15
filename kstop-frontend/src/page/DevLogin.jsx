import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const DEV_TOKEN = (role) => ["dev", "token", role].join("-");

/** Development quick-login interface. Backend separately guards dev authentication. */
export default function DevLogin() {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  function quickLoginAsHostel() {
    login(DEV_TOKEN("hostel"), { id: "hostel-test-123", name: "Hostel KP-1", email: "kp1@kiit.ac.in", role: "hostel", hostelId: "hostel-1" });
    navigate("/dashboard/hostel");
  }

  function quickLoginAsStudent() {
    login(DEV_TOKEN("student"), { id: "student-test-123", name: "Asha Kumar", email: "asha.kumar@kiit.ac.in", role: "student", hostelId: "hostel-1" });
    navigate("/dashboard/student");
  }

  function quickLoginAsParent() {
    login(DEV_TOKEN("parent"), { id: "parent-test-123", name: "Parent User", email: "parent@example.com", role: "parent", childRollNumber: "2205001" });
    navigate("/dashboard/parent");
  }

  function quickLoginAsMentor() {
    login(DEV_TOKEN("mentor"), { id: "mentor-test-123", name: "Dev Mentor", email: "dev.mentor.fcs@kiit.ac.in", role: "mentor" });
    navigate("/dashboard/mentor");
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <span style={styles.kicker}>Development access</span>
        <h1 style={styles.title}>K-STOP Dev Login</h1>
        <p style={styles.subtitle}>Quick-login for local development. This does not replace the real login flow.</p>
        <div style={styles.actions}>
          <button onClick={quickLoginAsStudent} style={styles.student}>Quick Login as Student</button>
          <button onClick={quickLoginAsMentor} style={styles.mentor}>Quick Login as Mentor</button>
          <button onClick={quickLoginAsParent} style={styles.parent}>Quick Login as Parent</button>
          <button onClick={quickLoginAsHostel} style={styles.hostel}>Quick Login as Hostel</button>
        </div>
        <button type="button" onClick={() => navigate("/login")} style={styles.back}>Back to real login</button>
      </section>
    </main>
  );
}

const baseButton = { width: "100%", padding: "12px 18px", fontSize: "15px", fontWeight: 700, cursor: "pointer", color: "white", border: "none", borderRadius: "8px" };
const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box", background: "#252422", fontFamily: "'Space Grotesk', system-ui, sans-serif" },
  card: { width: "min(100%, 520px)", padding: "32px", borderRadius: "14px", background: "#FFFCF2", color: "#252422", boxSizing: "border-box" },
  kicker: { display: "inline-block", padding: "5px 10px", borderRadius: "999px", background: "rgba(235, 94, 40, 0.12)", color: "#EB5E28", fontSize: "12px", fontWeight: 800 },
  title: { margin: "14px 0 8px", fontSize: "32px" },
  subtitle: { margin: "0 0 24px", color: "#403D39", lineHeight: 1.5 },
  actions: { display: "grid", gap: "10px" },
  student: { ...baseButton, background: "#666" },
  mentor: { ...baseButton, background: "#3a6ea5" },
  parent: { ...baseButton, background: "#2d8b53" },
  hostel: { ...baseButton, background: "#d95d39" },
  back: { width: "100%", marginTop: "18px", padding: "10px", border: "1px solid #CCC5B9", borderRadius: "8px", background: "transparent", color: "#403D39", cursor: "pointer", fontWeight: 700 },
};