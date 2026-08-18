// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

/**
 * Enforces authentication and an optional role requirement for a route.
 * Unauthenticated users and users with an unmatched role are redirected to `/login`.
 *
 * @param {React.ReactNode} children - Content to render for an authorized user.
 * @param {string} [requiredRole] - Role required to access the route.
 * @return {React.ReactNode} The protected content or a redirect to `/login`.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthContext();

  // Not logged in at all
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role (e.g. student trying to access hostel dashboard)
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}