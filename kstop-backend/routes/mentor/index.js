// ─────────────────────────────────────────────
//  routes/mentor/index.js
//  LOCATION: kstop-backend/routes/mentor/index.js
//
//  All mentor-specific API routes.
//  Every route verifies:
//    1. The user is authenticated (req.user exists via JWT middleware)
//    2. The user's role is "mentor"
//    3. The mentor can ONLY act on leaves/grievances where they are
//       the actual mentorId on that record — never someone else's.
//
//  Routes:
//    GET   /api/mentor/leave-queue         → leaves waiting on THIS mentor
//    PATCH /api/mentor/leave/:id/approve   → approve → generates QR gate pass
//    PATCH /api/mentor/leave/:id/reject    → reject with a reason
//    GET   /api/mentor/mentees             → all mentees + their stats
//    GET   /api/mentor/grievances          → grievances from THIS mentor's mentees
//    GET   /api/mentor/messages            → messages sent by parents to this mentor
//    GET   /api/mentor/notifications       → all notifications + unread count
//    PATCH /api/mentor/notifications/:id/read → mark one as read
//
//  IMPORTANT — a leave only shows up here AFTER the parent has
//  approved it (status = PENDING_MENTOR). If the parent rejects it,
//  the leave becomes REJECTED and never reaches this mentor at all.
//  That's enforced by routes/parent/index.js, not here — this file
//  just queries for status = PENDING_MENTOR.
// ─────────────────────────────────────────────

const express = require("express");
const qrcode = require("qrcode");
const crypto = require("crypto");
const prisma = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");
const { ensureDevMentorAccount } = require("../../lib/devAccounts");

const router = express.Router();

// Every route here needs a logged-in mentor user.
router.use(verifyToken);
router.use(authorizeRoles("mentor"));

// In development, make sure the demo mentor account exists before
// any route below runs — same idea as ensureDevParentAccount() in
// routes/parent/index.js. In production this does nothing.
router.use(async (req, res, next) => {
  try {
    await ensureDevMentorAccount(req.user.id);
    next();
  } catch (error) {
    console.error("[mentor] ensureDevMentorAccount failed:", error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
});

// Same wrapper as parent/index.js: turn unexpected DB errors into clean JSON.
function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[mentor] ${req.method} ${req.path} failed:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
      });
    }
  };
}

// ── Helper: verify a leave actually belongs to this mentor ──
async function verifyLeaveOwnership(leaveId, mentorId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) return { leave: null, error: "Leave not found." };
  if (leave.mentorId !== mentorId) return { leave: null, error: "Not authorized for this leave." };
  return { leave, error: null };
}

// ── Helper: put Medical leaves first, then low attendance (<75%),
// then everything else, all sorted newest-first within each group.
// (Matches the "Smart Leave Queue" behaviour described in the SRS.)
function sortByUrgency(leaves) {
  function rank(leave) {
    if (leave.type === "Medical") return 0;
    const attendance = leave.student?.attendancePercentage;
    if (typeof attendance === "number" && attendance < 75) return 1;
    return 2;
  }
  return [...leaves].sort((a, b) => rank(a) - rank(b));
}

// ── 1. GET /api/mentor/leave-queue ──
// Only leaves the PARENT has already approved show up here.
router.get("/leave-queue", asyncHandler(async (req, res) => {
  const leaves = await prisma.leave.findMany({
    where: {
      mentorId: req.user.id,
      status: "PENDING_MENTOR",
    },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          name: true,
          rollNumber: true,
          attendancePercentage: true,
          academicDetails: true,
          // Last 5 leaves for the expandable dropdown on each card
          // (see SRS: click a student's card → attendance, academic
          // details, and past leave history appear).
          leavesAsStudent: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, type: true, startDate: true, endDate: true, status: true },
          },
        },
      },
    },
  });

  // Rename student.leavesAsStudent -> student.recentLeaves, same as
  // the /mentees endpoint, so the frontend sees one consistent name.
  const shaped = leaves.map((leave) => {
    const { leavesAsStudent, ...restOfStudent } = leave.student;
    return { ...leave, student: { ...restOfStudent, recentLeaves: leavesAsStudent } };
  });

  return res.json({ success: true, leaves: sortByUrgency(shaped) });
}));

// ── 2. PATCH /api/mentor/leave/:id/approve ──
// Final approval — generates the QR gate pass.
router.patch("/leave/:id/approve", asyncHandler(async (req, res) => {
  const { leave, error } = await verifyLeaveOwnership(req.params.id, req.user.id);
  if (error) {
    const status = error === "Leave not found." ? 404 : 403;
    return res.status(status).json({ success: false, message: error });
  }

  // QR contains just the token as JSON — the hostel's scanner
  // (routes/hostel/index.js, POST /scan-leave-qr) looks this qrToken
  // up in the Leave table itself to get fresh student/mentor/date
  // details, rather than trusting whatever the QR image says. This
  // format is REQUIRED to match exactly what that scanner expects —
  // don't change this to a plain string, it'll silently break scanning.
  const qrToken = crypto.randomBytes(16).toString("hex");
  const qrPayload = JSON.stringify({ qrToken });
  const qrCode = await qrcode.toDataURL(qrPayload); // base64 PNG, ready for an <img src="">

  const updated = await prisma.leave.update({
    where: { id: leave.id },
    data: {
      status: "APPROVED",
      mentorApproved: true,
      qrToken,
      qrCode,
    },
  });

  await prisma.notification.create({
    data: {
      userId: leave.studentId,
      type: "leave-approved",
      message: "Your leave request was approved! Your QR gate pass is ready.",
      relatedId: leave.id,
    },
  });

  return res.json({ success: true, leave: updated });
}));

// ── 3. PATCH /api/mentor/leave/:id/reject ──
// Body: { reason? }
router.patch("/leave/:id/reject", asyncHandler(async (req, res) => {
  const { leave, error } = await verifyLeaveOwnership(req.params.id, req.user.id);
  if (error) {
    const status = error === "Leave not found." ? 404 : 403;
    return res.status(status).json({ success: false, message: error });
  }

  const { reason } = req.body;

  const updated = await prisma.leave.update({
    where: { id: leave.id },
    data: {
      status: "REJECTED",
      mentorApproved: false,
      rejectionReason: reason?.trim() || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: leave.studentId,
      type: "leave-rejected",
      message: reason?.trim()
        ? `Your leave request was rejected by your mentor: ${reason.trim()}`
        : "Your leave request was rejected by your mentor.",
      relatedId: leave.id,
    },
  });

  return res.json({ success: true, leave: updated });
}));

// ── 4. GET /api/mentor/mentees ──
// Bulk view: every student whose mentorName matches this mentor,
// with attendance + academic details + their last 5 leaves for the
// expandable dropdown card (as described in the SRS: click a
// student's name → attendance %, academic details, leave history).
router.get("/mentees", asyncHandler(async (req, res) => {
  const mentor = await prisma.user.findUnique({ where: { id: req.user.id } });

  const mentees = await prisma.user.findMany({
    where: {
      role: "student",
      mentorName: { equals: mentor.name, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      rollNumber: true,
      gender: true,
      attendancePercentage: true,
      academicDetails: true,
      hostel: { select: { name: true } },
      _count: { select: { leavesAsStudent: true } },
      // Last 5 leaves, newest first — exactly what the dropdown
      // needs. Keeping this to 5 (not all leaves ever) keeps the
      // response small even for a student with a long history.
      leavesAsStudent: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
    orderBy: { rollNumber: "asc" },
  });

  // Rename leavesAsStudent -> recentLeaves in the response so the
  // frontend doesn't have to know Prisma's internal relation name.
  const shaped = mentees.map((m) => {
    const { leavesAsStudent, ...rest } = m;
    return { ...rest, recentLeaves: leavesAsStudent };
  });

  return res.json({ success: true, mentees: shaped });
}));

// ── 5. GET /api/mentor/grievances ──
// Only grievances raised by THIS mentor's own mentees — never every
// student's. Disputed ones always show first (student disagrees
// staff actually fixed it), then sorted by priorityScore.
router.get("/grievances", asyncHandler(async (req, res) => {
  const grievances = await prisma.grievance.findMany({
    where: { mentorId: req.user.id },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    include: {
      student: { select: { name: true, rollNumber: true } },
      hostel: { select: { name: true } },
    },
  });

  // Disputed cases float to the top regardless of score — a student
  // saying "this ISN'T actually fixed" is always the most urgent thing
  // a mentor should see, more urgent than an unscored new complaint.
  const disputed = grievances.filter((g) => g.studentStatus === "DISPUTED");
  const rest = grievances.filter((g) => g.studentStatus !== "DISPUTED");

  return res.json({ success: true, grievances: [...disputed, ...rest] });
}));

// ── 6. GET /api/mentor/messages ──
// All parent → mentor messages addressed to this mentor, newest first.
router.get("/messages", asyncHandler(async (req, res) => {
  const messages = await prisma.parentMessage.findMany({
    where: { mentorId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, messages });
}));

// ── 7. GET /api/mentor/notifications ──
router.get("/notifications", asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return res.json({ success: true, notifications, unreadCount });
}));

// ── 8. PATCH /api/mentor/notifications/:id/read ──
router.patch("/notifications/:id/read", asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });

  return res.json({ success: true, notification: updated });
}));

module.exports = router;