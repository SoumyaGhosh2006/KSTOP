// ─────────────────────────────────────────────
//  routes/auth/register.js
//  POST /api/auth/register

//  Handles new account creation for ALL roles.
//  UPDATED: now requires OTP verification before account creation.
//  Flow: user calls POST /auth/send-otp first → gets code by email
//        → then calls this route with otp included in the body.

//  Request body (common for all roles):
//    name     — full name
//    email    — must be @kiit.ac.in but only for parent it can end with @gmail.com
//    password — min 8 characters
//    role     — student | mentor | hostel | parent
//    otp      — 6-digit code sent to their email via /auth/send-otp
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

// bcrypt cost factor — 12 rounds is secure for production
const SALT_ROUNDS = 12;

// Only these role values are accepted
const VALID_ROLES = ["student", "mentor", "hostel", "parent"];

async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      otp,
      // Student-only fields — undefined for other roles
      rollNumber,
      hostelId,
      gender,
      mentorName,
      // Hostel staff-only field
      assignedHostelId,
    } = req.body;

    // ── Required field check ──
    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, role and otp are all required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ──  Role validation ─────
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // ── Email domain check ──────────────────
    // Parents can use any email (gmail, yahoo, etc.)
    // Everyone else must use their KIIT institutional email
    if (role !== "parent" && !normalizedEmail.endsWith("@kiit.ac.in")) {
      return res.status(400).json({
        success: false,
        message: "Students, mentors and hostel staff must use a @kiit.ac.in email.",
      });
    }

    // ──  Password length check ───────
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // ── Student-specific field check ────────
    // These fields are required only when role is student
    if (role === "student") {
      if (!rollNumber || !hostelId || !gender || !mentorName) {
        return res.status(400).json({
          success: false,
          message: "Students must provide rollNumber, hostelId, gender and mentorName.",
        });
      }
    }

    // ──  Hostel staff field check ─────────────
    // Hostel staff must be linked to a hostel
    if (role === "hostel") {
      if (!assignedHostelId) {
        return res.status(400).json({
          success: false,
          message: "Hostel staff must provide assignedHostelId.",
        });
      }
    }

    // ── OTP verification ──────────────────────
    // Must have called POST /auth/send-otp first for this email
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

    // ──────duplicate email check ───────────
    // Check before creating — email must be unique
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Hash the password ───────────────────
    // NEVER store plain text passwords
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ──. Build user data object ──────────────
    // roles don't get null junk fields in their records
    const userData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,

      // Only added if role is student
      ...(role === "student" && {
        rollNumber,
        hostelId,
        gender,
        mentorName,
      }),

      // Only added if role is hostel
      ...(role === "hostel" && {
        assignedHostelId,
      }),
    };

    // ── Create user in database ────────────
    const newUser = await prisma.user.create({
      data: userData,
    });

    // ── OTP is single-use — delete it now ──────
    await prisma.otp.delete({ where: { email: normalizedEmail } });

    // ──   Return success ─────────────────────
    // Never return the password hash — only safe fields
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