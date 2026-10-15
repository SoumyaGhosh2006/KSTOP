import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Home, QrCode, FileText, Upload, Star, AlertCircle } from "../Icons";

const HOSTEL_NAV = [
  { label: "Dashboard", path: "/dashboard/hostel", icon: Home, end: true },
  { label: "Gate QR Scanner", path: "/dashboard/hostel/scan-qr", icon: QrCode },
  { label: "Leave Records", path: "/dashboard/hostel/leave-records", icon: FileText },
  { label: "Mess Menu", path: "/dashboard/hostel/mess-menu", icon: Upload },
  { label: "Mess Feedback", path: "/dashboard/hostel/mess-feedback", icon: Star },
  { label: "Grievances", path: "/dashboard/hostel/grievances", icon: AlertCircle },
];

export default function HostelShell({
  title = "Hostel Dashboard",
  eyebrow,
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

  const enrichedUser = user
    ? {
        ...user,
        hostelName:
          user.assignedHostelName || user.hostelName || user.name || "Campus Hostel",
      }
    : null;

  return (
    <div className="hostel-shell min-h-screen bg-[#fffcf2] text-[#252422] flex flex-col lg:pl-64">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roleTitle="Hostel Portal"
        user={enrichedUser}
        navItems={HOSTEL_NAV}
        onLogout={handleLogout}
      />

      <Navbar
        title={title}
        subtitle={eyebrow || enrichedUser?.hostelName || "Operations Console"}
        backTo={backTo}
        onNavigateBack={backTo ? () => navigate(backTo) : undefined}
        onToggleSidebar={() => setSidebarOpen(true)}
        actionButton={actionButton}
      />

      <main className="hostel-main flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
