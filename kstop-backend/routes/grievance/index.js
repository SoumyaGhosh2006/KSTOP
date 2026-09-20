// ─────────────────────────────────────────────
//  routes/grievance/index.js
//  LOCATION: kstop-backend/routes/grievance/index.js
//
//  This file was MISSING entirely before — there was no way for a
//  student to actually create a grievance. routes/hostel/index.js
//  and routes/mentor/index.js could only VIEW/update grievances that
//  already existed, but nothing could create one in the first place.
//
//  Routes:
//    POST  /api/grievance/create              → student files a complaint
//    GET   /api/grievance/my-grievances        → student's own complaints
//    PATCH /api/grievance/:id/respond          → student records resolved/unresolved decision
// ─────────────────────────────────────────────

const express = require("express");
const prisma = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");
const { ensureDevStudentAccount } = require("../../lib/devAccounts");
const { calculateGrievancePriority, CATEGORY_BASE_SCORE } = require("../../lib/grievancePriority");
const { withGrievanceResolutionStatus, sortGrievances, getGrievanceViewWhere, getResolutionDate } = require("../../lib/grievanceStatus");

const router = express.Router();

router.use(verifyToken);

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[grievance] ${req.method} ${req.path} failed:`, error);
      res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
  };
}

// Priority is calculated by the isolated NLP-style scorer so the API
// does not need to know how urgency is derived.

// ── POST /api/grievance/create ──
// Body: { title, description, category }
router.post("/create", authorizeRoles("student"), asyncHandler(async (req, res) => {
  await ensureDevStudentAccount(req.user.id);

  const { title, description, category } = req.body;

  if (!title?.trim() || !description?.trim() || !category) {
    return res.status(400).json({
      success: false,
      message: "title, description, and category are all required.",
    });
  }

  if (!(category in CATEGORY_BASE_SCORE)) {
    return res.status(400).json({
      success: false,
      message: `category must be one of: ${Object.keys(CATEGORY_BASE_SCORE).join(", ")}`,
    });
  }

  const student = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!student.hostelId) {
    return res.status(400).json({
      success: false,
      message: "Your account has no hostel assigned, so a grievance can't be filed yet.",
    });
  }

  // Resolve the student's mentor by name — same live-lookup pattern
  // used everywhere else in this app (see routes/leave/index.js).
  const mentor = student.mentorName
    ? await prisma.user.findFirst({
        where: { role: "mentor", name: { equals: student.mentorName, mode: "insensitive" } },
      })
    : null;

  if (!mentor) {
    return res.status(400).json({
      success: false,
      message: "No mentor is linked to your account yet, so a grievance can't be filed.",
    });
  }

  const grievance = await prisma.grievance.create({
    data: {
      studentId: student.id,
      hostelId: student.hostelId,
      mentorId: mentor.id,
      title: title.trim(),
      description: description.trim(),
      category,
      priorityScore: calculateGrievancePriority({ title, description, category }),
    },
  });

  // Notify both the hostel staff and the mentor — same "notify
  // everyone who should see this" pattern used for leave events.
  const hostelStaff = await prisma.user.findMany({
    where: { role: "hostel", assignedHostelId: student.hostelId },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: [
      ...hostelStaff.map((staff) => ({
        userId: staff.id,
        type: "grievance-created",
        message: `New grievance filed: "${title.trim()}"`,
        relatedId: grievance.id,
      })),
      {
        userId: mentor.id,
        type: "grievance-created",
        message: `${student.name} filed a grievance: "${title.trim()}"`,
        relatedId: grievance.id,
      },
    ],
  });

  return res.status(201).json({ success: true, grievance });
}));

// ── GET /api/grievance/my-grievances ──
// Query: view=active|recent|history (default: active).
router.get("/my-grievances", authorizeRoles("student"), asyncHandler(async (req, res) => {
  await ensureDevStudentAccount(req.user.id);

  const view = ["active", "recent", "history"].includes(req.query.view)
    ? req.query.view
    : "active";

  const grievances = await prisma.grievance.findMany({
    where: {
      studentId: req.user.id,
      ...getGrievanceViewWhere(view),
    },
  });

  const shaped = grievances.map((grievance) => ({
    ...withGrievanceResolutionStatus(grievance),
    resolvedAt: getResolutionDate(grievance),
  }));

  return res.json({ success: true, view, grievances: sortGrievances(shaped) });
}));

// ── PATCH /api/grievance/:id/respond ──
// Body: { response: "CONFIRMED" | "DISPUTED" }
// The student can record either decision at any point. The overall
// dashboard status is derived from both staff and student decisions.
router.patch("/:id/respond", authorizeRoles("student"), asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!["CONFIRMED", "DISPUTED"].includes(response)) {
    return res.status(400).json({ success: false, message: 'response must be "CONFIRMED" or "DISPUTED".' });
  }

  const grievance = await prisma.grievance.findUnique({ where: { id: req.params.id } });

  if (!grievance || grievance.studentId !== req.user.id) {
    return res.status(403).json({ success: false, message: "Not authorized for this grievance." });
  }

  const updated = await prisma.grievance.update({
    where: { id: grievance.id },
    data: { studentStatus: response, studentRespondedAt: new Date() },
  });

  return res.json({
    success: true,
    grievance: withGrievanceResolutionStatus(updated),
  });
}));

module.exports = router;