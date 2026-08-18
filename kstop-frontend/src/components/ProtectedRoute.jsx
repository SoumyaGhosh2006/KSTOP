// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

/**
 * Wraps any route that requires authentication.
 * 
 * Usage in App.jsx:
 *   <Route path="/dashboard/hostel" element={
 *     <ProtectedRoute requiredRole="hostel">
 *       <HostelDashboard />
 *     </ProtectedRoute>
 *   } />
 * 
 * - If not logged in → redirects to /login
 * - If logged in but wrong role → redirects to /login
 * - If logged in with correct role → renders the page normally
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