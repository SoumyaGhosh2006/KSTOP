// ─────────────────────────────────────────────
//  src/utils/api.js
//  LOCATION: kstop-frontend/src/utils/api.js
//
//  Central place for all backend API calls.

//  Instead of writing the full URL and headers in every component,
//  we set them up once here. If the backend URL ever changes,
//  we update it in ONE place, not in every file.
//
//  WHAT IT DOES AUTOMATICALLY:
//  1. Adds the backend base URL to every request
//  2. Attaches the JWT token to every request (so you don't have to)
//  3. If the server says 401 (token expired), it logs the user out
//     and redirects to login automatically
//
//  HOW TO USE IT:
//    import api from "../../utils/api";
//
//    // GET request:
//    const res = await api.get("/leave/my-leaves");
//
//    // POST request:
//    const res = await api.post("/auth/login", { email, password });
//
//  SETUP: Add this to kstop-frontend/.env:
//    VITE_API_URL=http://localhost:5000/api
//  (Change the port if your Express server uses a different one)
// ─────────────────────────────────────────────

import axios from "axios";

// Base URL from .env file
// In development:  http://localhost:5000/api
// In production:   https://your-render-app.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create a configured axios instance
// Every call made through "api" will use these defaults
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────
// This runs automatically BEFORE every request we make.
// If the user is logged in (token exists), it adds the
// Authorization header so the backend knows who's calling.
//
// Without this, we'd have to manually write:
//   headers: { Authorization: `Bearer ${token}` }
// on every single API call. The interceptor does it for us.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kstop_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────
// This runs automatically AFTER every response.
// If the server returns 401 (Unauthorized), it means the token
// expired. We clear storage and redirect to login.
api.interceptors.response.use(
  (response) => response, // success: just pass it through unchanged

  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear everything and go to login
      localStorage.removeItem("kstop_token");
      localStorage.removeItem("kstop_user");
      window.location.href = "/login";
    }
    // Re-throw so the calling component can still catch and show errors
    return Promise.reject(error);
  }
);

export default api;