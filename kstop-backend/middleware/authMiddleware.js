// ─────────────────────────────────────────────
//  middleware/authMiddleware.js
//  LOCATION: kstop-backend/middleware/authMiddleware.js
//
//  This file has TWO exports used on every protected route:
//
//  1. verifyToken     → checks the JWT, attaches user info to req.user
//  2. authorizeRoles  → checks the user's role is allowed for that route
//
//  HOW IT'S USED in a route file:
//    const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");
//
//    // Only mentors can hit this route:
//    router.get("/leave-queue", verifyToken, authorizeRoles("mentor"), handler);
//
//    // Both mentors and hostel staff can hit this:
//    router.get("/something", verifyToken, authorizeRoles("mentor", "hostel"), handler);
//
//  IMPORTANT: Role values in the DB are LOWERCASE:
//    student | mentor | hostel | parent
//  The JWT is signed with these exact lowercase values in login.js,
//  so they will always match here.
//
//  FIX APPLIED: Changed from ES module syntax (import/export) to
//  CommonJS (require/module.exports) to match the rest of the backend.
//  The old file used "import jwt from 'jsonwebtoken'" which crashes
//  the server because server.js uses require().
// ─────────────────────────────────────────────

const jwt = require("jsonwebtoken");

const DEV_TOKENS = {
  "dev-token-hostel": { id: "hostel-test-123", role: "hostel" },
  "dev-token-student": { id: "student-test-123", role: "student" },
};

// ── verifyToken ───────────────────────────────────────────────
// This middleware runs before any protected route handler.
// It reads the token from the Authorization header,
// verifies it is valid and not expired, then saves the
// decoded user info onto req.user so route handlers can use it.
//
// After this runs, req.user looks like:
//   { id: "clx2abc123", role: "student", iat: ..., exp: ... }
const verifyToken = (req, res, next) => {
  // The frontend sends the token in the header like:
  //   Authorization: Bearer eyJhbGci...
  const authHeader = req.headers.authorization;

  // If there's no header or it doesn't start with "Bearer ", reject
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Split "Bearer eyJhbGci..." → take the part after the space
  const token = authHeader.split(" ")[1];

  // Dev-only mock tokens used by the quick login buttons on the frontend.
  // These are intentionally not real JWTs, so they must be accepted only in dev.
  const isDevelopment = (process.env.NODE_ENV || "development") === "development";
  if (isDevelopment && DEV_TOKENS[token]) {
    req.user = DEV_TOKENS[token];
    return next();
  }

  try {
    // jwt.verify checks the signature AND expiry at once
    // If valid, it returns the original payload we put in during login
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object
    // Route handlers can now do: req.user.id, req.user.role
    req.user = decoded;

    next(); // move on to the actual route handler
  } catch (err) {
    // Token expired → tell frontend to redirect to login
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    // Token was tampered with or invalid
    return res.status(401).json({ error: "Invalid token." });
  }
};

// ── authorizeRoles ────────────────────────────────────────────
// Call this AFTER verifyToken on any route that should only be
// accessible to certain roles.
//
// Example: authorizeRoles("mentor") lets only mentors through.
//          authorizeRoles("mentor", "hostel") lets both through.
//
// It returns a middleware function (that's why there's a function
// inside a function — it's called a "factory function").
const authorizeRoles = (...allowedRoles) => {
  // Normalize to lowercase so "MENTOR" and "mentor" both work
  const normalized = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    // verifyToken must run first — req.user should exist by now
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    // Check if the user's role is in the allowed list
    if (!normalized.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This route requires: ${normalized.join(", ")}.`,
      });
    }

    next(); // role is allowed — proceed to the route handler
  };
};

module.exports = { verifyToken, authorizeRoles };