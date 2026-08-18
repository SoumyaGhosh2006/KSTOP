// src/context/AuthContext.jsx
import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

// ─── Helper: read saved session from localStorage ───────────────────────────
function readStoredSession() {
  try {
    const token = localStorage.getItem("kstop_token");
    const user = JSON.parse(localStorage.getItem("kstop_user"));
    if (token && user) return { token, user };
  } catch {
    // corrupted data — ignore
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  // Initialize state from localStorage so refresh doesn't log the user out
  const [session, setSession] = useState(() => readStoredSession());

  function login(token, user) {
    // Save to localStorage so session survives page refresh
    localStorage.setItem("kstop_token", token);
    localStorage.setItem("kstop_user", JSON.stringify(user));
    setSession({ token, user });
  }

  function logout() {
    localStorage.removeItem("kstop_token");
    localStorage.removeItem("kstop_user");
    setSession({ token: null, user: null });
  }

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      login,
      logout,
    }),
    [session]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}