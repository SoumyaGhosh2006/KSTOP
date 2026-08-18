// ─────────────────────────────────────────────
//  routes/auth/register.js
//  LOCATION: kstop-backend/routes/auth/register.js
//
//  POST /api/auth/register
//
//  Step 2 of registration. Step 1 is POST /auth/send-otp.
//  The user fills the form, gets an OTP by email, then submits
//  both the form data and the OTP together to this route.
//
//  EMAIL RULES (enforced here AND on the frontend):
//    student → must end with @kiit.ac.in
//              e.g.  22053001.student@kiit.ac.in
//
//    mentor  → must end with fcs@kiit.ac.in  ← TEACHER emails at KIIT
//              e.g.  priya.fcs@kiit.ac.in
//              Note: "fcs" stands for the faculty school domain at KIIT
//
//    hostel  → must end with @kiit.ac.in (same rule as students)
//              The email IS the hostel's official ID — one account per hostel.
//              e.g.  kp1@kiit.ac.in, kp2@kiit.ac.in, qc3@kiit.ac.in
//              There is no separate "warden" concept. The hostel's
//              official email is the only one that can register/login.
//
//    parent  → any email allowed (gmail, yahoo, etc.)
//              e.g.  parent@gmail.com
//
//  Required for ALL roles:
//    name, email, password, role, otp
//
//  Student-only extra fields:
//    rollNumber, hostelId, gender, mentorName
//
//  Hostel role: NO extra fields needed.
//  The hostel is identified by their email (e.g. kp1@kiit.ac.in).
//
//  Returns:
//    201 — account created successfully
//    400 — validation error / wrong OTP / duplicate email
//    500 — unexpected server error
// ─────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const prisma  = require("../../lib/prismaClient");

// bcrypt cost — 12 rounds is the industry standard for production
// Higher number = harder to crack if DB is stolen, but slower to hash
const SALT_ROUNDS = 12;

// Only these role values are accepted (must match schema.prisma Role enum)
const VALID_ROLES = ["student", "mentor", "hostel", "parent"];

// ── Email domain checker ──────────────────────────────────────
// Returns true if the email is valid for the given role, false if not.
// This is the single place where email rules live — easy to update later.
function isEmailValidForRole(email, role) {
  if (role === "parent") {
    // Parents can use any provider (gmail, yahoo, etc.)
    // We just check it has a basic "@" and "." — anything reasonable
    return email.includes("@") && email.split("@")[1]?.includes(".");
  }

  if (role === "mentor") {
    // KIIT teacher/faculty emails end with fcs@kiit.ac.in
    // e.g. john.fcs@kiit.ac.in or priya.fcs@kiit.ac.in
    return email.endsWith("fcs@kiit.ac.in");
  }

  if (role === "student" || role === "hostel") {
    // Both students and hostel staff use the same regular KIIT email format.
    // e.g. student:      22053001.student@kiit.ac.in
    //      hostel staff: kingspalace5@kiit.ac.in
    // Must end with @kiit.ac.in but NOT fcs@kiit.ac.in (that suffix is for teachers only)
    return email.endsWith("@kiit.ac.in") && !email.endsWith("fcs@kiit.ac.in");
  }

  return false;
}

// ── Friendly error message per role ──────────────────────────
// Returns a specific, helpful message depending on which role's
// email domain rule was violated.
function getEmailError(role) {
  if (role === "mentor") {
    return "Mentor/faculty email must end with 'fcs@kiit.ac.in' (e.g. priya.fcs@kiit.ac.in).";
  }
  if (role === "student") {
    return "Student email must end with '@kiit.ac.in' (e.g. 22053001.student@kiit.ac.in).";
  }
  if (role === "hostel") {
    return "Hostel staff email must end with '@kiit.ac.in' (e.g. kingspalace5@kiit.ac.in).";
  }
  return "Invalid email format.";
}

/**
 * Creates an account after validating the registration details and email OTP.
 * Responds with the new user's public details on success or an error message when validation, verification, or account creation fails.
 */
async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      otp,
      // Student-only — these will be undefined for other roles
      rollNumber,
      hostelId,
      gender,
      mentorName,
      assignedHostelId,
      // Note: hostel role needs NO extra fields.
      // Their email (e.g. kp1@kiit.ac.in) already identifies which hostel they are.
    } = req.body;

    // ── 1. Required fields check ─────────────────────────────
    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, role, and OTP are all required.",
      });
    }

    // Trim and lowercase the email for consistency
    const normalizedEmail = email.trim().toLowerCase();

    // ── 2. Role must be one of the four valid options ─────────
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // ── 3. Email domain rule per role ─────────────────────────
    // Mentor must use fcs@kiit.ac.in, student/hostel use @kiit.ac.in,
    // parent can use anything. See isEmailValidForRole() above.
    if (!isEmailValidForRole(normalizedEmail, role)) {
      return res.status(400).json({
        success: false,
        message: getEmailError(role),
      });
    }

    // ── 4. Password length ────────────────────────────────────
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // ── 5. Student-specific required fields ───────────────────
    if (role === "student") {
      if (!rollNumber || !hostelId || !gender || !mentorName) {
        return res.status(400).json({
          success: false,
          message: "Students must also provide: rollNumber, hostelId, gender, and mentorName.",
        });
      }
    }

    // ── 6. OTP verification ───────────────────────────────────
    // User should have called /send-otp before reaching this route.
    // We check the OTP we stored in the DB for their email.
    const otpRecord = await prisma.otp.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord) {
      // No OTP found — they skipped /send-otp or used a different email
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one.",
      });
    }

    if (otpRecord.verified) {
      // This OTP was already used — single-use only
      return res.status(400).json({
        success: false,
        message: "This code has already been used. Please request a new one.",
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      // OTP has expired — clean it up, ask for a new one
      await prisma.otp.delete({ where: { email: normalizedEmail } });
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      // OTP entered doesn't match what we stored
      return res.status(400).json({
        success: false,
        message: "Incorrect code. Please check and try again.",
      });
    }

    // ── 7. Check for duplicate email ──────────────────────────
    // /send-otp checks this too, but someone could register between
    // those two calls, so we check again here to be safe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    let studentHostel = null;
    let assignedHostel = null;

    if (role === "student") {
      studentHostel = await prisma.hostel.upsert({
        where: { name: hostelId.trim() },
        update: {},
        create: { name: hostelId.trim() },
      });
    }

    if (role === "hostel" && assignedHostelId) {
      assignedHostel = await prisma.hostel.upsert({
        where: { name: assignedHostelId.trim() },
        update: {},
        create: { name: assignedHostelId.trim() },
      });
    }

    // ── 8. Hash the password ──────────────────────────────────
    // NEVER store passwords as plain text in the database.
    // bcrypt turns "mypassword123" into an unreadable hash like:
    // "$2a$12$LQv3c1yqBWVHxkd0LHAkCO..."
    // Even if someone steals the database, they can't reverse the hash.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── 9. Build the user record ──────────────────────────────
    // We only include role-specific fields for the right role.
    // A mentor or hostel account shouldn't have rollNumber, for example.
    const userData = {
      name:     name.trim(),
      email:    normalizedEmail,
      password: hashedPassword,
      role,

      // Spread student fields only if role is student
      ...(role === "student" && {
        rollNumber: rollNumber.trim(),
        hostelId: studentHostel.id,           // FK -> Hostel.id
        gender,             // must match Gender enum: Male | Female | PreferNotToSay
        mentorName: mentorName.trim(),
      }),

      ...(role === "hostel" && assignedHostel && {
        assignedHostelId: assignedHostel.id,
      }),
    };

    // ── 10. Save user to database ─────────────────────────────
    const newUser = await prisma.user.create({ data: userData });

    // ── 11. Delete the OTP — it's single-use ─────────────────
    // Once the account is created, this OTP must never work again.
    await prisma.otp.delete({ where: { email: normalizedEmail } });

    // ── 12. Return success ────────────────────────────────────
    // Don't return the password hash — only safe public fields.
    return res.status(201).json({
      success: true,
      message: "Account created successfully! You can now log in.",
      user: {
        id:   newUser.id,
        name: newUser.name,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("[register] Unexpected error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { register };

