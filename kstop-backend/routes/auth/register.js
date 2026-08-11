// ─────────────────────────────────────────────
//  routes/auth/register.js
//  POST /api/auth/register
//
//  Handles new account creation for ALL roles.
//  UPDATED: OTP verification required before account creation.
//  UPDATED: mentor email must end with fcs@kiit.ac.in
//
//  Email rules:
//    student → any username @kiit.ac.in      e.g. 2205001@kiit.ac.in
//    hostel  → any username @kiit.ac.in      e.g. reception@kiit.ac.in
//    mentor  → username must end with "fcs"  e.g. johndoefcs@kiit.ac.in
//    parent  → any email allowed             e.g. parent@gmail.com
//
//  Request body (common for all roles):
//    name     — full name
//    email    — see rules above
//    password — min 8 characters
//    role     — student | mentor | hostel | parent
//    otp      — 6-digit code from POST /auth/send-otp
//
//  Student extra fields:
//    rollNumber, hostelId, gender, mentorName
//
//  Hostel staff extra field:
//    assignedHostelId
//
//  Returns:
//    201 — account created successfully
//    400 — validation error, bad/expired OTP, or duplicate email
//    500 — unexpected server error
// ─────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const prisma  = require("../../lib/prismaClient");

const SALT_ROUNDS = 12;
const VALID_ROLES = ["student", "mentor", "hostel", "parent"];

// ── Email validation helper ───────────────────────────────────────────────
// Returns null if valid, or an error message string if invalid.
function validateEmail(email, role) {
  if (role === "parent") {
    // Parents can use any email domain
    return null;
  }

  if (role === "student" || role === "hostel") {
    // Must be @kiit.ac.in — any username is fine
    if (!email.endsWith("@kiit.ac.in")) {
      return role === "student"
        ? "Student accounts must use a @kiit.ac.in email address."
        : "Hostel staff accounts must use a @kiit.ac.in email address.";
    }
    return null;
  }

  if (role === "mentor") {
    // Full email must end with "fcs@kiit.ac.in"
    // e.g. johndoefcs@kiit.ac.in  → valid
    //      johndoe@kiit.ac.in     → invalid (missing fcs before @)
    //      johndoefcs@gmail.com   → invalid (wrong domain)
    if (!email.endsWith("fcs@kiit.ac.in")) {
      return "Mentor accounts must use a KIIT faculty email ending with fcs@kiit.ac.in (e.g. johndoefcs@kiit.ac.in).";
    }
    return null;
  }

  return null;
}

async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      otp,
      // Student-only fields
      rollNumber,
      hostelId,
      gender,
      mentorName,
      // Hostel staff-only field
      assignedHostelId,
    } = req.body;

    // ── Required field check ──────────────────────────────────
    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, role and otp are all required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Role validation ───────────────────────────────────────
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // ── Email domain validation ───────────────────────────────
    const emailError = validateEmail(normalizedEmail, role);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // ── Password length check ─────────────────────────────────
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // ── Student-specific field check ──────────────────────────
    if (role === "student") {
      if (!rollNumber || !hostelId || !gender || !mentorName) {
        return res.status(400).json({
          success: false,
          message: "Students must provide rollNumber, hostelId, gender and mentorName.",
        });
      }
    }

    // ── Hostel staff field check ──────────────────────────────
    if (role === "hostel") {
      if (!assignedHostelId) {
        return res.status(400).json({
          success: false,
          message: "Hostel staff must provide assignedHostelId.",
        });
      }
    }

    // ── OTP verification ──────────────────────────────────────
    const otpRecord = await prisma.otp.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email. Please request a new one.",
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "This OTP has already been used. Please request a new one.",
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await prisma.otp.delete({ where: { email: normalizedEmail } });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
      });
    }

    // ── Duplicate email check ─────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Hash the password ─────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Build user data object ────────────────────────────────
    const userData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,

      ...(role === "student" && {
        rollNumber,
        hostelId,
        gender,
        mentorName,
      }),

      ...(role === "hostel" && {
        assignedHostelId,
      }),
    };

    // ── Create user in database ───────────────────────────────
    const newUser = await prisma.user.create({
      data: userData,
    });

    // ── OTP is single-use — delete it now ─────────────────────
    await prisma.otp.delete({ where: { email: normalizedEmail } });

    // ── Return success ────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
      user: {
        id:   newUser.id,
        name: newUser.name,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("[register] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { register };