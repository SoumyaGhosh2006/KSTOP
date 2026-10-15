import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

/**
 * Intelligent role-based notification router.
 * Redirects authenticated users to their portal's native notification feed or dashboard.
 */
export default function Notifications() {
  const { user } = useAuthContext();

  if (user?.role === "parent") {
    return <Navigate to="/dashboard/parent/notifications" replace />;
  }
  if (user?.role === "mentor") {
    return <Navigate to="/dashboard/mentor/notifications" replace />;
  }
  if (user?.role === "hostel") {
    return <Navigate to="/dashboard/hostel" replace />;
  }
  return <Navigate to="/dashboard/student" replace />;
}
