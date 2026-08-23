// ─────────────────────────────────────────────
//  routes/parent/index.js
//  LOCATION: kstop-backend/routes/parent/index.js
//
//  All parent-specific API routes.
//  Every route verifies:
//    1. The user is authenticated (req.user exists via JWT middleware)
//    2. The user's role is "parent"
//    3. The parent can ONLY access data for their linked childRollNumber
//
//  Routes:
//    GET  /api/parent/child-info       → child's name, hostel, mentor
//    GET  /api/parent/pending-leaves   → leaves with status PENDING_PARENT
//    GET  /api/parent/leave-history    → all leaves for the child
//    PATCH /api/parent/leave/:id/approve  → parent approves → PENDING_MENTOR
//    PATCH /api/parent/leave/:id/reject   → parent rejects → REJECTED
//    POST /api/parent/message-mentor     → send message to child's mentor
//    GET  /api/parent/messages           → message thread with mentor
//    GET  /api/parent/notifications      → all notifications + unread count
//    PATCH /api/parent/notifications/:id/read → mark as read
// ─────────────────────────────────────────────

const express = require("express");
const prisma = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");
const { ensureDevParentAccount } = require("../../lib/devAccounts");

const router = express.Router();

// Every route here needs a logged-in parent user.
router.use(verifyToken);
router.use(authorizeRoles("parent"));

// In development, make sure the demo parent account (and its linked
// demo child) exists before any route below runs — same idea as the
// ensureDevStudentAccount() call in routes/leave/index.js. In
// production this does nothing.
router.use(async (req, res, next) => {
  try {
    await ensureDevParentAccount(req.user.id);
    next();
  } catch (error) {
    console.error("[parent] ensureDevParentAccount failed:", error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
});

// Same wrapper as leave/index.js: turn unexpected DB errors into clean JSON.
function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[parent] ${req.method} ${req.path} failed:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
      });
    }
  };
}

// ── Helper: resolve the parent → child → mentor chain ──
async function resolveChildAndMentor(parent) {
  const child = await prisma.user.findUnique({
    where: { rollNumber: parent.childRollNumber },
  });

  if (!child || child.role !== "student") {
    return { child: null, mentor: null, error: "Linked student not found." };
  }

  const hostel = child.hostelId
    ? await prisma.hostel.findUnique({ where: { id: child.hostelId } })
    : null;

  let mentor = null;
  if (child.mentorName) {
    mentor = await prisma.user.findFirst({
      where: {
        role: "mentor",
        name: { equals: child.mentorName.trim(), mode: "insensitive" },
      },
    });
  }

  return {
    child: { ...child, hostel },
    mentor,
    error: null,
  };
}

// ── Helper: verify a leave belongs to the parent's child ──
async function verifyLeaveOwnership(leaveId, parent) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) return { leave: null, error: "Leave not found." };

  const child = await prisma.user.findUnique({
    where: { rollNumber: parent.childRollNumber },
  });
  if (!child || leave.studentId !== child.id) {
    return { leave: null, error: "Not authorized for this leave." };
  }
  return { leave, error: null };
}

// ── 1. GET /api/parent/child-info ──
router.get("/child-info", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent || !parent.childRollNumber) {
    return res.status(404).json({ success: false, message: "No child linked to this parent account." });
  }

  const { child, mentor, error } = await resolveChildAndMentor(parent);
  if (error) return res.status(404).json({ success: false, message: error });

  return res.json({
    success: true,
    child: {
      id: child.id,
      name: child.name,
      rollNumber: child.rollNumber,
      email: child.email,
      hostel: child.hostel ? { id: child.hostel.id, name: child.hostel.name } : null,
      mentor: mentor
        ? { id: mentor.id, name: mentor.name, email: mentor.email }
        : null,
    },
  });
}));

// ── 2. GET /api/parent/pending-leaves ──
router.get("/pending-leaves", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent || !parent.childRollNumber) {
    return res.status(404).json({ success: false, message: "No child linked." });
  }

  const child = await prisma.user.findUnique({ where: { rollNumber: parent.childRollNumber } });
  if (!child) {
    return res.status(404).json({ success: false, message: "Linked student not found." });
  }

  const leaves = await prisma.leave.findMany({
    where: {
      studentId: child.id,
      status: "PENDING_PARENT",
    },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { name: true, rollNumber: true } },
      mentor: { select: { name: true } },
    },
  });

  return res.json({ success: true, leaves });
}));

// ── 3. GET /api/parent/leave-history ──
router.get("/leave-history", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent || !parent.childRollNumber) {
    return res.status(404).json({ success: false, message: "No child linked." });
  }

  const child = await prisma.user.findUnique({ where: { rollNumber: parent.childRollNumber } });
  if (!child) {
    return res.status(404).json({ success: false, message: "Linked student not found." });
  }

  const leaves = await prisma.leave.findMany({
    where: { studentId: child.id },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { name: true, rollNumber: true } },
      mentor: { select: { name: true } },
    },
  });

  return res.json({ success: true, leaves });
}));

// ── 4. PATCH /api/parent/leave/:id/approve ──
router.patch("/leave/:id/approve", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  const { leave, error } = await verifyLeaveOwnership(req.params.id, parent);
  if (error) {
    const status = error === "Leave not found." ? 404 : 403;
    return res.status(status).json({ success: false, message: error });
  }

  const updated = await prisma.leave.update({
    where: { id: leave.id },
    data: {
      status: "PENDING_MENTOR",
      parentApproved: true,
    },
  });

  // Notify mentor
  const child = await prisma.user.findUnique({ where: { rollNumber: parent.childRollNumber } });
  if (child && child.mentorName) {
    const mentor = await prisma.user.findFirst({
      where: {
        role: "mentor",
        name: { equals: child.mentorName.trim(), mode: "insensitive" },
      },
    });
    if (mentor) {
      await prisma.notification.create({
        data: {
          userId: mentor.id,
          type: "leave-approved-by-parent",
          message: `Parent ${parent.name} approved a leave for student ${child.name}. Please review.`,
          relatedId: leave.id,
        },
      });
    }
  }

  return res.json({ success: true, leave: updated });
}));

// ── 5. PATCH /api/parent/leave/:id/reject ──
router.patch("/leave/:id/reject", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  const { leave, error } = await verifyLeaveOwnership(req.params.id, parent);
  if (error) {
    const status = error === "Leave not found." ? 404 : 403;
    return res.status(status).json({ success: false, message: error });
  }

  const updated = await prisma.leave.update({
    where: { id: leave.id },
    data: {
      status: "REJECTED",
      parentApproved: false,
    },
  });

  // Notify student
  const child = await prisma.user.findUnique({ where: { rollNumber: parent.childRollNumber } });
  if (child) {
    await prisma.notification.create({
      data: {
        userId: child.id,
        type: "leave-rejected-by-parent",
        message: `Your leave request was rejected by your parent (${parent.name}).`,
        relatedId: leave.id,
      },
    });
  }

  return res.json({ success: true, leave: updated });
}));

// ── 6. POST /api/parent/message-mentor ──
router.post("/message-mentor", asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Message cannot be empty." });
  }

  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent || !parent.childRollNumber) {
    return res.status(404).json({ success: false, message: "No child linked." });
  }

  const { child, mentor, error } = await resolveChildAndMentor(parent);
  if (error) return res.status(404).json({ success: false, message: error });
  if (!mentor) {
    return res.status(404).json({ success: false, message: "Mentor not found for this student." });
  }

  const msg = await prisma.parentMessage.create({
    data: {
      parentId: parent.id,
      mentorId: mentor.id,
      studentId: child.id,
      message: message.trim(),
    },
  });

  // Notify mentor
  await prisma.notification.create({
    data: {
      userId: mentor.id,
      type: "parent-message",
      message: `Parent ${parent.name} sent a message regarding ${child.name}.`,
      relatedId: msg.id,
    },
  });

  return res.json({ success: true, message: msg });
}));

// ── 7. GET /api/parent/messages ──
router.get("/messages", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent || !parent.childRollNumber) {
    return res.status(404).json({ success: false, message: "No child linked." });
  }

  const { mentor, error } = await resolveChildAndMentor(parent);
  if (error) return res.status(404).json({ success: false, message: error });

  const messages = await prisma.parentMessage.findMany({
    where: {
      parentId: parent.id,
      mentorId: mentor ? mentor.id : "",
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ success: true, messages });
}));

// ── 8. GET /api/parent/notifications ──
router.get("/notifications", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!parent) {
    return res.status(404).json({ success: false, message: "Parent not found." });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: parent.id },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return res.json({ success: true, notifications, unreadCount });
}));

// ── 9. PATCH /api/parent/notifications/:id/read ──
router.patch("/notifications/:id/read", asyncHandler(async (req, res) => {
  const parent = await prisma.user.findUnique({ where: { id: req.user.id } });

  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (!notification || notification.userId !== parent.id) {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });

  return res.json({ success: true, notification: updated });
}));

module.exports = router;