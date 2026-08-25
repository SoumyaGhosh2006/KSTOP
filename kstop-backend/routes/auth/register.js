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
    // e.g. johnfcs@kiit.ac.in or priyafcs@kiit.ac.in (no dot before fcs)
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
      mentorName, // now OPTIONAL for students — see step 7d below
      assignedHostelId,
      // Mentor-only — the roll number range + gender they're allotted.
      // e.g. rollRangeStart=2205001, rollRangeEnd=2205050, genderScope="Male"
      rollRangeStart,
      rollRangeEnd,
      genderScope,
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
    // NOTE: mentorName is no longer required here. Mentors are now
    // auto-assigned by roll number range + gender (see step 7d) —
    // mentorName only needs to be typed manually as a fallback if
    // no mentor's range covers this student yet.
    if (role === "student") {
      if (!rollNumber || !hostelId || !gender) {
        return res.status(400).json({
          success: false,
          message: "Students must also provide: rollNumber, hostelId, and gender.",
        });
      }
    }

    // ── 5c. Mentor-specific required fields ────────────────────
    // The mentor picks the roll number range they've been allotted
    // and which gender they mentor. Students inside that range with
    // that gender get auto-assigned to them at registration.
    if (role === "mentor") {
      if (!rollRangeStart || !rollRangeEnd || !genderScope) {
        return res.status(400).json({
          success: false,
          message: "Mentors must also provide: rollRangeStart, rollRangeEnd, and genderScope.",
        });
      }
      if (genderScope !== "Male" && genderScope !== "Female") {
        return res.status(400).json({
          success: false,
          message: 'genderScope must be exactly "Male" or "Female".',
        });
      }
      const startNum = parseInt(rollRangeStart, 10);
      const endNum = parseInt(rollRangeEnd, 10);
      if (Number.isNaN(startNum) || Number.isNaN(endNum) || startNum > endNum) {
        return res.status(400).json({
          success: false,
          message: "rollRangeStart must be a number less than or equal to rollRangeEnd.",
        });
      }
    }

    // ── 5b. Parent-specific required field ─────────────────────
    // The parent registration form (ParentRegister.jsx) sends the
    // child's roll number using the same "rollNumber" field name —
    // for a parent, it means "my child's roll number", not their own.
    if (role === "parent") {
      if (!rollNumber) {
        return res.status(400).json({
          success: false,
          message: "Please provide your child's roll number.",
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

    // ── 7b. Roll number checks ─────────────────────────────────
    // Roll numbers are @unique in the database now, so two students
    // can never share one — check it here first so the error message
    // is clear instead of a raw database error.
    if (role === "student") {
      const existingRollNumber = await prisma.user.findUnique({
        where: { rollNumber: rollNumber.trim() },
      });
      if (existingRollNumber) {
        return res.status(400).json({
          success: false,
          message: "An account with this roll number already exists.",
        });
      }
    }

    // A parent must be linked to a REAL, already-registered student.
    // Otherwise a parent account would exist pointing at nobody, and
    // the leave-approval flow would never find them.
    if (role === "parent") {
      const linkedChild = await prisma.user.findFirst({
        where: { rollNumber: rollNumber.trim(), role: "student" },
      });
      if (!linkedChild) {
        return res.status(400).json({
          success: false,
          message: `No student found with roll number "${rollNumber.trim()}". Ask your child to register first, then try again.`,
        });
      }
    }

    // ── 7c. Mentor: warn if this exact range+gender is already taken ──
    // We only check for an EXACT duplicate, not partial overlap —
    // proper overlap detection is more complex than this demo needs.
    // Overlapping-but-not-identical ranges are a known limitation,
    // not something this checks for.
    let resolvedMentorName = mentorName?.trim() || null;

    if (role === "mentor") {
      const startNum = parseInt(rollRangeStart, 10);
      const endNum = parseInt(rollRangeEnd, 10);
      const duplicateRange = await prisma.user.findFirst({
        where: {
          role: "mentor",
          mentorRollRangeStart: startNum,
          mentorRollRangeEnd: endNum,
          mentorGenderScope: genderScope,
        },
      });
      if (duplicateRange) {
        return res.status(400).json({
          success: false,
          message: `Another mentor already covers roll numbers ${startNum}–${endNum} for ${genderScope} students.`,
        });
      }
    }

    let studentHostel = null;
    let assignedHostel = null;

    if (role === "student") {
      studentHostel = await prisma.hostel.upsert({
        where: { name: hostelId.trim() },
        update: {},
        create: { name: hostelId.trim() },
      });

      // ── 7d. Auto-assign a mentor by roll number range + gender ──
      // Find a mentor whose range covers this roll number AND whose
      // genderScope matches this student (or is null, meaning "any
      // gender" — used by the dev/demo mentor).
      const rollAsInt = parseInt(rollNumber.trim(), 10);
      if (!Number.isNaN(rollAsInt)) {
        const matchedMentor = await prisma.user.findFirst({
          where: {
            role: "mentor",
            mentorRollRangeStart: { lte: rollAsInt },
            mentorRollRangeEnd: { gte: rollAsInt },
            OR: [{ mentorGenderScope: gender }, { mentorGenderScope: null }],
          },
        });
        if (matchedMentor) {
          resolvedMentorName = matchedMentor.name; // auto-match wins over manual entry
        }
      }

      // No auto-match AND nothing typed manually — can't proceed,
      // every student needs a mentor for the leave-approval flow.
      if (!resolvedMentorName) {
        return res.status(400).json({
          success: false,
          message: "No mentor is currently allotted your roll number range. Please enter your mentor's name manually, or contact your hostel admin.",
        });
      }
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
        mentorName: resolvedMentorName,       // auto-matched by range+gender, or manual fallback
      }),

      ...(role === "mentor" && {
        mentorRollRangeStart: parseInt(rollRangeStart, 10),
        mentorRollRangeEnd: parseInt(rollRangeEnd, 10),
        mentorGenderScope: genderScope, // "Male" or "Female" — validated above
      }),

      ...(role === "hostel" && assignedHostel && {
        assignedHostelId: assignedHostel.id,
      }),

      // Spread parent fields only if role is parent
      ...(role === "parent" && {
        childRollNumber: rollNumber.trim(), // already verified to exist above
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