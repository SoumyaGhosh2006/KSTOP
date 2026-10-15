import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../utils/api";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Home, Clock, Users, AlertCircle, MessageSquare, Bell, Send, FileText } from "../Icons";

export default function MentorShell({
  title = "Mentor Dashboard",
  subtitle,
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
        const res = await api.get("/mentor/notifications");
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
    { label: "Dashboard", path: "/dashboard/mentor", icon: Home, end: true },
    { label: "Leave Queue", path: "/dashboard/mentor/leave-queue", icon: Clock },
    { label: "My Mentees", path: "/dashboard/mentor/mentees", icon: Users },
    { label: "Counseling Log", path: "/dashboard/mentor/counseling", icon: FileText },
    { label: "Grievances", path: "/dashboard/mentor/grievances", icon: AlertCircle },
    { label: "Parent Messages", path: "/dashboard/mentor/messages", icon: MessageSquare },
    { label: "Announcements", path: "/dashboard/mentor/announcements", icon: Send },
    {
      label: "Notifications",
      path: "/dashboard/mentor/notifications",
      icon: Bell,
      count: unreadCount,
    },
  ];

  return (
    <div className="mentor-shell min-h-screen bg-[#fffcf2] text-[#252422] flex flex-col lg:pl-64">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        roleTitle="Mentor Portal"
        user={user}
        navItems={navItems}
        onLogout={handleLogout}
      />

      <Navbar
        title={title}
        subtitle={subtitle || "Faculty Command Center"}
        backTo={backTo}
        onNavigateBack={backTo ? () => navigate(backTo) : undefined}
        onToggleSidebar={() => setSidebarOpen(true)}
        notificationCount={unreadCount}
        onNotificationClick={() => navigate("/dashboard/mentor/notifications")}
        actionButton={actionButton}
      />

      <main className="mentor-main flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
