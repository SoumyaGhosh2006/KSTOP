import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Auth Pages
import Register from "./page/Register";
import StudentRegister from "./page/auth/StudentRegister";
import MentorRegister from "./page/auth/MentorRegister";
import ParentRegister from "./page/auth/ParentRegister";
import HostelRegister from "./page/auth/HostelRegister";
import Login from "./page/Login";
import ForgotPassword from "./page/ForgotPassword";
import ResetPassword from "./page/ResetPassword";

// Dashboards
import StudentDashboard from "./page/dashboard/student/StudentDashboard";
import MentorDashboard from "./page/dashboard/mentor/MentorDashboard";
import HostelDashboard from "./page/dashboard/hostel/HostelDashboard";

// TODO: Uncomment when built
// import StudentLeaveQueue from "./page/dashboard/student/MyLeaves";
// import StudentGrievances from "./page/dashboard/student/MyGrievances";
// import StudentMessMenu from "./page/dashboard/student/MessMenu";
// etc.

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ──── Auth Routes ──── */}

          {/* Role Selection */}
          <Route path="/register" element={<Register />} />

          {/* Registration Forms */}
          <Route path="/studentregister" element={<StudentRegister />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/mentor" element={<MentorRegister />} />
          <Route path="/register/parent" element={<ParentRegister />} />
          <Route path="/register/hostel" element={<HostelRegister />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ──── Protected Dashboard Routes ──── */}

          {/* Student Dashboard & Pages */}
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          {/* <Route path="/dashboard/student/leaves" element={<StudentLeaveQueue />} /> */}
          {/* <Route path="/dashboard/student/leaves/:id" element={<LeaveDetail />} /> */}
          {/* <Route path="/dashboard/student/new-leave" element={<NewLeave />} /> */}
          {/* <Route path="/dashboard/student/grievances" element={<StudentGrievances />} /> */}
          {/* <Route path="/dashboard/student/mess-menu" element={<StudentMessMenu />} /> */}

          {/* Mentor Dashboard & Pages */}
          <Route path="/dashboard/mentor" element={<MentorDashboard />} />
          {/* <Route path="/dashboard/mentor/leave-queue" element={<MentorLeaveQueue />} /> */}
          {/* <Route path="/dashboard/mentor/mentees" element={<MenteesList />} /> */}
          {/* <Route path="/dashboard/mentor/grievances" element={<MentorGrievances />} /> */}

          {/* Hostel (Warden) Dashboard & Pages */}
          <Route path="/dashboard/hostel" element={<HostelDashboard />} />
          {/* <Route path="/dashboard/hostel/grievances" element={<HostelGrievances />} /> */}
          {/* <Route path="/dashboard/hostel/mess-menu" element={<HostelMessMenu />} /> */}
          {/* <Route path="/dashboard/hostel/feedback" element={<HostelFeedback />} /> */}

          {/* ──── Shared Routes ──── */}
          <Route
            path="/notifications"
            element={<div>Notifications Page (TODO)</div>}
          />

          {/* ──── Default Route ──── */}
          <Route path="/" element={<Navigate to="/register" replace />} />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={<div style={styles.notFound}>Page not found</div>}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

const styles = {
  notFound: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252422",
    color: "#FFFCF2",
    fontSize: "18px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
};
