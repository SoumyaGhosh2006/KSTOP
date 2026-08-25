// ─────────────────────────────────────────────
//  routes/leave/index.js
//  LOCATION: kstop-backend/routes/leave/index.js
//
//  Routes for a STUDENT's leave requests:
//    POST /api/leave           → submit a new leave request
//    GET  /api/leave/my-leaves → list the student's own requests
//
//  Approval flow (from schema.prisma):
//    student submits → PENDING_PARENT → parent approves →
//    PENDING_MENTOR → mentor approves → APPROVED (+ QR gate pass)
//
//  This file covers the first step (submit + list). Parent and
//  mentor approval screens can build on top of the same table.
// ─────────────────────────────────────────────

const express = require("express");
const prisma  = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");
const { ensureDevStudentAccount } = require("../../lib/devAccounts");

const router = express.Router();

// Every route here needs a logged-in user.
router.use(verifyToken);

// Same wrapper idea as the hostel routes: turn unexpected database
// errors into a clean JSON message instead of an HTML error page.
function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[leave] ${req.method} ${req.path} failed:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
      });
    }
  };
}

// These must match the LeaveType enum in prisma/schema.prisma.
// The frontend dropdown sends one of these exact values.
const VALID_LEAVE_TYPES = ["Medical", "Vacation", "FamilyEmergency", "Other"];

// ── POST /api/leave ───────────────────────────────────────────
// The "Apply for Leave" form sends its data here.
// Body: { type, startDate, endDate, contactNumber, place, purpose, arrivalDetails? }
router.post("/", authorizeRoles("student"), asyncHandler(async (req, res) => {
  const { type, startDate, endDate, contactNumber, place, purpose, arrivalDetails } = req.body;

  // ── 1. Basic validation ────────────────────────────────────
  // Check everything BEFORE touching the database, so the student
  // gets a clear message about what to fix in the form.
  const problems = [];

  if (!VALID_LEAVE_TYPES.includes(type)) {
    problems.push("leave type (choose Medical, Vacation, FamilyEmergency or Other)");
  }
  if (!contactNumber?.trim()) problems.push("contact number");
  if (!place?.trim()) problems.push("place");
  if (!purpose?.trim()) problems.push("purpose");

  // new Date("garbage") gives an "Invalid Date" — getTime() is NaN.
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime())) problems.push("start date");
  if (Number.isNaN(end.getTime())) problems.push("end date");
  if (problems.length === 0 && end < start) {
    problems.push("end date (it cannot be before the start date)");
  }

  if (problems.length) {
    return res.status(400).json({
      success: false,
      message: `Please fix these fields: ${problems.join(", ")}.`,
    });
  }

  // ── 2. Find the student ────────────────────────────────────
  // In development, create the quick-login demo account on first use.
  await ensureDevStudentAccount(req.user.id);

  const student = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Your student account was not found. Please log out and log in again.",
    });
  }

  // ── 3. Find the mentor ─────────────────────────────────────
  // The Leave table requires a mentor, because the mentor is the
  // final approver. We match the mentor by the name stored on the
  // student's profile (case-insensitive, so "dev mentor" also works).
  if (!student.mentorName?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Your account has no mentor assigned. Please contact your hostel admin first.",
    });
  }

  const mentor = await prisma.user.findFirst({
    where: {
      role: "mentor",
      name: { equals: student.mentorName.trim(), mode: "insensitive" },
    },
  });

  if (!mentor) {
    return res.status(400).json({
      success: false,
      message: `Your mentor "${student.mentorName}" has not registered on K-STOP yet. Ask them to register, then try again.`,
    });
  }

   // ── 4. Save the leave request ──────────────────────────────
  const leave = await prisma.leave.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
      type,
      startDate: start,
      endDate: end,
      contactNumber: contactNumber.trim(),
      place: place.trim(),
      purpose: purpose.trim(),
      arrivalDetails: arrivalDetails?.trim() || null,
    },
    include: {
      mentor: { select: { name: true } },
    },
  });

  // ── 5. Notify the parent ───────────────────────────────────
  const parent = await prisma.user.findFirst({
    where: {
      role: "parent",
      childRollNumber: student.rollNumber,
    },
  });

  if (parent) {
    await prisma.notification.create({
      data: {
        userId: parent.id,
        type: "leave-submitted",
        message: `${student.name} submitted a ${type} leave request (${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}). Please review and approve.`,
        relatedId: leave.id,
      },
    });
  }

  res.status(201).json({ success: true, leave });
}));

// ── GET /api/leave/my-leaves ──────────────────────────────────
// Returns the student's own leave requests, newest first.
// The "My Leaves" page can use this to show real data.
router.get("/my-leaves", authorizeRoles("student"), asyncHandler(async (req, res) => {
  await ensureDevStudentAccount(req.user.id);

  const leaves = await prisma.leave.findMany({
    where: { studentId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      mentor: { select: { name: true } },
    },
  });

  res.json({ success: true, leaves });
}));

// ── GET /api/leave/active-qr ──────────────────────────────────
// Powers the QR gate-pass card on the student dashboard's home page.
//
// Returns the student's current APPROVED leave — but ONLY if its
// endDate hasn't passed yet. Once the leave period is over, this
// route stops returning it, which is what makes the card disappear
// from the dashboard automatically.
//
// IMPORTANT: this does NOT delete the leave or its qrCode from the
// database — the record stays forever for the hostel's/mentor's
// history and audit trail. This route just stops SURFACING it once
// it's no longer current. If the student later gets a NEW leave
// approved, this route automatically starts returning that one
// instead (whichever APPROVED leave is most recent).
router.get("/active-qr", authorizeRoles("student"), asyncHandler(async (req, res) => {
  await ensureDevStudentAccount(req.user.id);

  // Midnight today — so a leave ending TODAY still counts as active
  // for the whole day, instead of vanishing right at 12:00am.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const activeLeave = await prisma.leave.findFirst({
    where: {
      studentId: req.user.id,
      status: "APPROVED",
      endDate: { gte: startOfToday },
    },
    orderBy: { createdAt: "desc" }, // most recently approved, if somehow more than one
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      purpose: true,
      place: true,
      qrCode: true,
    },
  });

  res.json({ success: true, activeLeave: activeLeave || null });
}));

module.exports = router;