import { useAuthContext } from "../context/AuthContext";

/**
 * Custom hook providing quick access to the current authenticated session,
 * user profile, token, and session lifecycle actions (login, logout).
 *
 * @returns {{
 *   user: object|null,
 *   token: string|null,
 *   isAuthenticated: boolean,
 *   login: (token: string, user: object) => void,
 *   logout: () => void
 * }}
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
