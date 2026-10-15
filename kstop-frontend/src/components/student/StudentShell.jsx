import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Home, Plus, FileText, QrCode, Utensils, AlertCircle } from "../Icons";

const STUDENT_NAV = [
  { label: "Dashboard", path: "/dashboard/student", icon: Home, end: true },
  { label: "Gate Pass", path: "/dashboard/student/gate-pass", icon: QrCode },
  { label: "Apply for Leave", path: "/dashboard/student/new-leave", icon: Plus },
  { label: "My Leaves", path: "/dashboard/student/leaves", icon: FileText },
  { label: "Mess Menu", path: "/dashboard/student/mess-menu", icon: Utensils },
  { label: "Grievances", path: "/dashboard/student/grievances", icon: AlertCircle },
];

export default function StudentShell({
  title = "Student Dashboard",
  subtitle,
  backTo,
  actionButton,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="student-shell min-h-screen bg-[#fffcf2] text-[#252422] flex flex-col lg:pl-64">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roleTitle="Student Portal"
        user={user}
        navItems={STUDENT_NAV}
        onLogout={handleLogout}
      />

      {/* Top Navbar */}
      <Navbar
        title={title}
        subtitle={subtitle || user?.hostelName || "Campus Life"}
        backTo={backTo}
        onNavigateBack={backTo ? () => navigate(backTo) : undefined}
        onToggleSidebar={() => setSidebarOpen(true)}
        actionButton={actionButton}
      />

      {/* Main Content Area */}
      <main className="student-main flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
