import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
import NewLeave from "./page/dashboard/student/NewLeave";
import MyLeaves from "./page/dashboard/student/MyLeaves";
import MessMenu from "./page/dashboard/student/MessMenu";
import MyGrievances from "./page/dashboard/student/MyGrievances";
import MentorDashboard from "./page/dashboard/mentor/MentorDashboard";
import HostelDashboard from "./page/dashboard/hostel/HostelDashboard";
import MessMenuUpload from "./page/dashboard/hostel/MessMenuUpload";
import HostelQrScanner from "./page/dashboard/hostel/HostelQrScanner";
import HostelLeaveRecords from "./page/dashboard/hostel/HostelLeaveRecords";
import HostelGrievances from "./page/dashboard/hostel/HostelGrievances";

/**
 * Renders the application's public authentication pages and role-protected dashboard routes.
 */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ──── Public Auth Routes ──── */}
          <Route path="/register" element={<Register />} />
          <Route path="/studentregister" element={<StudentRegister />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/mentor" element={<MentorRegister />} />
          <Route path="/register/parent" element={<ParentRegister />} />
          <Route path="/register/hostel" element={<HostelRegister />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ──── Student Routes ──── */}
          <Route path="/dashboard/student" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/student/new-leave" element={
            <ProtectedRoute requiredRole="student">
              <NewLeave />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/student/leaves" element={
            <ProtectedRoute requiredRole="student">
              <MyLeaves />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/student/mess-menu" element={
            <ProtectedRoute requiredRole="student">
              <MessMenu />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/student/grievances" element={
            <ProtectedRoute requiredRole="student">
              <MyGrievances />
            </ProtectedRoute>
          } />

          {/* ──── Mentor Routes ──── */}
          <Route path="/dashboard/mentor" element={
            <ProtectedRoute requiredRole="mentor">
              <MentorDashboard />
            </ProtectedRoute>
          } />

          {/* ──── Hostel Routes ──── */}
          <Route path="/dashboard/hostel" element={
            <ProtectedRoute requiredRole="hostel">
              <HostelDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hostel/mess-menu" element={
            <ProtectedRoute requiredRole="hostel">
              <MessMenuUpload />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hostel/scan-qr" element={
            <ProtectedRoute requiredRole="hostel">
              <HostelQrScanner />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hostel/leave-records" element={
            <ProtectedRoute requiredRole="hostel">
              <HostelLeaveRecords />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hostel/grievances" element={
            <ProtectedRoute requiredRole="hostel">
              <HostelGrievances />
            </ProtectedRoute>
          } />

          {/* ──── Shared Routes ──── */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <div>Notifications Page (TODO)</div>
            </ProtectedRoute>
          } />

          {/* ──── Default & 404 ──── */}
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="*" element={
            <div style={styles.notFound}>Page not found</div>
          } />
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