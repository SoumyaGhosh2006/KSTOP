// ─────────────────────────────────────────────
//  routes/auth/login.js
 
//  POST /api/auth/login
  
//  Student, mentor, hostel staff and parent
//  all use this same single endpoint.
 
//  Request body:
//    email    — registered email
//    password — plain text (we compare against hash)
//
//  Returns:
//    200 — login successful, JWT token + user info
//    400 — missing fields
//    401 — wrong email or password
//    500 — unexpected server error
// ─────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const prisma = require("../../lib/prismaClient");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // ── 1. Required field check ────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ── 2. Find user by email ──────────────────
    // findUnique is fast because email has @unique in schema
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // ── 3. Check user exists ───────────────────
    // We give the message whether email or password
    // is wrong — this prevents attackers from knowing which
    // one failed (called "user enumeration protection")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── 4. Compare password against hash ───────
    // bcrypt.compare() hashes the plain text and checks
    // if it matches the stored hash — returns true/false
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── 5. Generate JWT token ──────────────────
    // The token contains the user's id and role.
    // It's signed with JWT_SECRET from your .env file.
    // Expires in 7 days — user stays logged in for a week.
    //
    // This token is sent back to the frontend and stored
    // in localStorage. Every future API request sends it
    // in the Authorization header so we know who's calling.
    const token = jwt.sign(
      {
        userId: user.id,
        role:   user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── 6. Return token and safe user info ─────
    // Never return the password hash
    // Frontend uses role to decide which dashboard to show
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        // Extra fields the frontend dashboard might need
        hostelId:        user.hostelId        || null,
        assignedHostelId: user.assignedHostelId || null,
        rollNumber:      user.rollNumber      || null,
      },
    });

  } catch (error) {
    console.error("[login] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { login };