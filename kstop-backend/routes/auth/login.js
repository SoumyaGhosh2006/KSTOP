// ─────────────────────────────────────────────
//  routes/auth/login.js
//  LOCATION: kstop-backend/routes/auth/login.js
//
//  POST /api/auth/login
//
//  One single login route handles ALL roles.
 
//  What it does:
//  1. Takes email + password from the request body
//  2. Finds the user in the database by email
//  3. Compares the submitted password against the stored hash
//  4. If correct → creates a JWT token and returns it
//  5. Frontend stores the token and uses "role" to redirect
//     to the correct dashboard
 
//  Request body:
//    email    — the email they registered with
//    password — plain text (we compare it to the hash)
//
//  Returns:
//    200 — login successful, includes token + user info
//    400 — missing fields
//    401 — wrong email or password
//    500 — unexpected server error
//
//  FIX APPLIED: JWT payload now uses "id" (not "userId").
//  authMiddleware.js reads req.user.id — so if we sign the token
//  with "userId", then req.user.id is always undefined and every
//  protected route silently fails. Now they match.
// ─────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const prisma = require("../../lib/prismaClient");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // ── 1. Check required fields ─────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Normalize the email (trim spaces, make lowercase)
    // This prevents "John@KIIT.ac.in" vs "john@kiit.ac.in" mismatch
    const normalizedEmail = email.trim().toLowerCase();

    // ── 2. Find user in database ─────────────────────────────
    // findUnique is fast because email has @unique in schema.prisma
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // ── 3. User not found ─────────────────────────────────────
    // SECURITY: We say the SAME message whether the email doesn't
    // exist or the password is wrong. If we said "email not found"
    // specifically, an attacker could test emails to see which ones
    // are registered. This is called user enumeration protection
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── 4. Check the password ─────────────────────────────────
    // bcrypt.compare() takes the plain text password the user typed,
    // hashes it the same way, and checks if it matches what's in the DB.
    // Returns true if correct, false if wrong.
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── 5. Create the JWT token ───────────────────────────────
    // A JWT is a signed "pass" that the frontend stores and sends
    // with every future request. It proves who the user is without
    // hitting the database every time.
    //
    // IMPORTANT: We sign with "id" (not "userId") because
    // authMiddleware.js reads req.user.id — both must use the same key.
    //
    // The token expires in 7 days → user stays logged in for a week.
    const token = jwt.sign(
      {
        id:   user.id,    // ← matches what authMiddleware.js reads as req.user.id
        role: user.role,  // ← used by authorizeRoles() to check access
      },
      process.env.JWT_SECRET,   // secret from your .env file — keep this private!
      { expiresIn: "7d" }       // token expires in 7 days
    );

    // ── 6. Return token and safe user info ────────────────────
    // NEVER return the password hash — only the fields the frontend needs.
    // Frontend uses "role" to redirect:
    //   student → /student/dashboard
    //   mentor  → /mentor/dashboard
    //   hostel  → /hostel/dashboard
    //   parent  → /parent/dashboard
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:               user.id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        // These are null for roles that don't use them (mentor/parent/hostel)
        hostelId:         user.hostelId         || null,
        assignedHostelId: user.assignedHostelId || null,
        rollNumber:       user.rollNumber       || null,
      },
    });

  } catch (error) {
    console.error("[login] Unexpected error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { login };