import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Home, Clock, FileText, AlertCircle, MessageSquare, Bell } from "../Icons";

export default function ParentShell({
  title = "Parent Dashboard",
  eyebrow,
  backTo,
  actionButton,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await api.get("/parent/notifications");
        if (mounted) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        // silent fallback
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard/parent", icon: Home, end: true },
    { label: "Pending Approvals", path: "/dashboard/parent/pending-leaves", icon: Clock },
    { label: "Leave History", path: "/dashboard/parent/leave-history", icon: FileText },
    { label: "Grievances", path: "/dashboard/parent/grievances", icon: AlertCircle },
    { label: "Message Mentor", path: "/dashboard/parent/message-mentor", icon: MessageSquare },
    {
      label: "Notifications",
      path: "/dashboard/parent/notifications",
      icon: Bell,
      count: unreadCount,
    },
  ];

  return (
    <div className="parent-shell min-h-screen bg-[#fffcf2] text-[#252422] flex flex-col lg:pl-64">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roleTitle="Parent Portal"
        user={user}
        navItems={navItems}
        onLogout={handleLogout}
      />

      <Navbar
        title={title}
        subtitle={eyebrow || (user?.childRollNumber ? `Child Roll: ${user.childRollNumber}` : "Parent Portal")}
        backTo={backTo}
        onNavigateBack={backTo ? () => navigate(backTo) : undefined}
        onToggleSidebar={() => setSidebarOpen(true)}
        notificationCount={unreadCount}
        onNotificationClick={() => navigate("/dashboard/parent/notifications")}
        actionButton={actionButton}
      />

      <main className="parent-main flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
