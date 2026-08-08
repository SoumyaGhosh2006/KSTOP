// middleware/authMiddleware.js
// LOCATION: kstop-backend/middleware/authMiddleware.js
//
// Two exports:
//   verifyToken      → checks JWT, attaches req.user
//   authorizeRoles   → factory that restricts a route to specific roles
//
// NOTE: Role enum in schema.prisma is LOWERCASE:
//   student | mentor | hostel | parent
// Make sure login.js signs the JWT with role exactly as stored in DB
// (i.e. lowercase) so this matches without extra conversion.

import jwt from 'jsonwebtoken';

// ── verifyToken ───────────────────────────────────────────────────────────
// Reads the Bearer token from the Authorization header, verifies it,
// and attaches the decoded payload to req.user.
//
// req.user will look like: { id, email, role, iat, exp }
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// ── authorizeRoles ────────────────────────────────────────────────────────
// Usage in a route file:
//   router.get('/mentor-only', verifyToken, authorizeRoles('mentor'), handler)
//   router.get('/multi-role',  verifyToken, authorizeRoles('mentor', 'hostel'), handler)
//
// Roles in the system (lowercase): student | mentor | hostel | parent
export const authorizeRoles = (...allowedRoles) => {
  // normalize once, in case someone passes 'MENTOR' by mistake
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!normalizedAllowed.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This action requires one of: ${normalizedAllowed.join(', ')}.`,
      });
    }

    next();
  };
};                      