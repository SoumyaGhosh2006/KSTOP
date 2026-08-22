import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  function quickLoginAsHostel() {
    login("dev-token-hostel", {
      id: "hostel-test-123",
      name: "Hostel KP-1",
      email: "kp1@kiit.ac.in",
      role: "hostel",
      hostelId: "hostel-1",
    });
    navigate("/dashboard/hostel");
  }

  function quickLoginAsStudent() {
    login("dev-token-student", {
      id: "student-test-123",
      name: "Asha Kumar",
      email: "asha.kumar@kiit.ac.in",
      role: "student",
      hostelId: "hostel-1",
    });
    navigate("/dashboard/student");
  }

  function quickLoginAsParent() {
    login("dev-token-parent", {
      id: "parent-test-123",
      name: "Parent User",
      email: "parent@example.com",
      role: "parent",
      childRollNumber: "2205001",
    });
    navigate("/dashboard/parent");
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Login page coming soon.</h1>
      <p>Dev quick-login:</p>
      <div
        style={{
          marginTop: "30px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={quickLoginAsHostel}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#d95d39",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Quick Login as Hostel
        </button>
        <button
          onClick={quickLoginAsStudent}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Quick Login as Student
        </button>

        <button
          onClick={quickLoginAsParent}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#2d8b53",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Quick Login as Parent
        </button>
      </div>
      <p style={{ marginTop: "20px", fontSize: "12px", color: "#999" }}>
        (Dev mode — will be replaced with real login form)
      </p>
    </div>
  );
}
