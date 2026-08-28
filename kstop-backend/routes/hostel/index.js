// ─────────────────────────────────────────────
//  routes/hostel/index.js
//  LOCATION: kstop-backend/routes/hostel/index.js
//
//  All routes a HOSTEL account can use:
//    GET    /api/hostel/summary              → numbers for the dashboard cards
//    POST   /api/hostel/mess-menu            → upload a mess menu image
//    GET    /api/hostel/mess-menus           → list all menus (students use this too)
//    GET    /api/hostel/leave-records        → list scanned/manual leave rows
//    POST   /api/hostel/leave-records        → add one leave row manually
//    POST   /api/hostel/scan-leave-qr        → store leave data from a QR code
//    DELETE /api/hostel/leave-records        → delete selected leave rows
//    GET    /api/hostel/grievances           → list complaints for this hostel
//    PATCH  /api/hostel/grievances/:id/status→ mark a complaint open/resolved
// ─────────────────────────────────────────────

const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const prisma  = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

// ── asyncHandler ──────────────────────────────────────────────
// A tiny wrapper for our route functions.
//
// WHY: If any database call inside a route fails (for example the
// table is missing, or the connection drops), Express would
// otherwise send an ugly HTML error page. The frontend then has no
// real message to show and just says "Could not add leave row."
//
// This wrapper catches the error and sends a clean JSON reply with
// the real reason, so the UI can show exactly what went wrong.
function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Log the full error in the backend terminal for debugging,
      // but send only a safe, readable message to the browser.
      console.error(`[hostel] ${req.method} ${req.path} failed:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
      });
    }
  };
}

// ── Upload folder setup ───────────────────────────────────────
// Menu images are stored on disk inside kstop-backend/uploads/mess-menus.
//
// IMPORTANT FIX: multer does NOT create this folder by itself.
// After a fresh `git clone` the folder does not exist, so every
// upload crashed with "ENOENT: no such file or directory" and the
// frontend showed "Menu upload failed."
// mkdirSync with { recursive: true } creates the folder if it is
// missing and does nothing if it already exists — safe to run
// every time the server starts.
const MENU_UPLOAD_DIR = path.join(__dirname, "../../uploads/mess-menus");
fs.mkdirSync(MENU_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: MENU_UPLOAD_DIR,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${req.user.id}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per image
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG and PNG menu images are allowed."));
    }
    callback(null, true);
  },
});

// Every route below requires a logged-in user (valid JWT token).
router.use(verifyToken);

// ── Dev-only demo accounts ────────────────────────────────────
// The Login page has two "quick login" buttons that use fake tokens
// (dev-token-hostel / dev-token-student). Those tokens work for the
// middleware, but the matching users did NOT exist in the database.
// Result: every database write for the dev hostel failed silently
// ("Could not add leave row.", "Menu upload failed.").
//
// FIX: in development, the first time the dev hostel account is
// used, we create it in the database on the fly. Real (registered)
// accounts are untouched. This block never runs in production.
const DEV_HOSTEL_USER = {
  id: "hostel-test-123",
  name: "Hostel KP-1",
  email: "kp1@kiit.ac.in",
};

function isDevelopment() {
  return (process.env.NODE_ENV || "development") === "development";
}

// Makes sure the dev hostel account exists in the database.
// Returns the user row (real or just-created), or null if the
// user id is unknown.
async function ensureDevHostelUser(userId) {
  if (!isDevelopment() || userId !== DEV_HOSTEL_USER.id) return null;

  return prisma.user.upsert({
    where: { id: DEV_HOSTEL_USER.id },
    update: {},
    create: {
      id: DEV_HOSTEL_USER.id,
      name: DEV_HOSTEL_USER.name,
      email: DEV_HOSTEL_USER.email,
      // Placeholder hash (valid bcrypt format, 60 chars) — this account
      // can never log in with a password; it exists only so the dev
      // quick-login buttons keep working end to end.
      password: "$2b$12$devhostelaccountnopasswordlogin0000000000000000000000",
      role: "hostel",
    },
  });
}

async function getHostelUser(userId) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      assignedHostelId: true,
      hostelId: true,
      email: true,
    },
  });

  // If the id is the dev quick-login account, create it on first use.
  if (!user) {
    await ensureDevHostelUser(userId);
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        assignedHostelId: true,
        hostelId: true,
        email: true,
      },
    });
  }

  return user;
}

// Every hostel action needs to know WHICH hostel it belongs to.
// 1. If the account is already linked to a hostel, use that.
// 2. Otherwise create/find a hostel with the same name as the
//    account and link them (one-time setup, then remembered).
async function getHostelIdForStaff(userId) {
  const user = await getHostelUser(userId);

  // No account found at all → we cannot know the hostel.
  // Throwing here means asyncHandler sends a clear message instead
  // of a confusing database crash.
  if (!user) {
    throw new Error(
      "Your hostel account was not found in the database. Please log out and log in again."
    );
  }

  if (user.assignedHostelId) return user.assignedHostelId;

  const hostel = await prisma.hostel.upsert({
    where: { name: user.name },
    update: {},
    create: { name: user.name },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { assignedHostelId: hostel.id },
  });

  return hostel.id;
}

// Builds the public URL where an uploaded menu image can be viewed.
function readImageUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/mess-menus/${filename}`;
}

// QR codes can contain a JSON string; this turns the raw text into
// a usable object. Returns null when the text is not valid JSON.
function parseQrPayload(payload) {
  if (typeof payload === "object" && payload !== null) return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Different QR generators use slightly different field names
// (rollNumber vs rollNo, etc.). This maps all of them to the exact
// field names our database table expects.
function normalizeLeaveRecord(data) {
  return {
    studentName: data.studentName || data.name || "",
    rollNumber: data.rollNumber || data.rollNo || "",
    contactNumber: data.contactNumber || data.contact || "",
    leaveStartDate: new Date(data.leaveStartDate || data.startDate),
    leaveEndDate: new Date(data.leaveEndDate || data.endDate),
    parentsPhoneNumber: data.parentsPhoneNumber || data.parentPhoneNumber || data.parentContact || "",
    mentorName: data.mentorName || "",
    approved: Boolean(data.approved ?? data.approveStatus ?? true),
  };
}

// Checks a normalized record and returns a list of problems.
// An empty list means the record is good to save.
function validateLeaveRecord(record) {
  const missingFields = [];

  for (const field of [
    "studentName",
    "rollNumber",
    "contactNumber",
    "parentsPhoneNumber",
    "mentorName",
  ]) {
    if (!record[field]) missingFields.push(field);
  }

  if (Number.isNaN(record.leaveStartDate.getTime())) missingFields.push("leaveStartDate");
  if (Number.isNaN(record.leaveEndDate.getTime())) missingFields.push("leaveEndDate");

  // A leave that ends before it starts is a typo — reject it early
  // with a clear message instead of storing nonsense data.
  if (
    !missingFields.includes("leaveStartDate") &&
    !missingFields.includes("leaveEndDate") &&
    record.leaveEndDate < record.leaveStartDate
  ) {
    missingFields.push("leaveEndDate (end date cannot be before the start date)");
  }

  return missingFields;
}

// Shared by "manual add" and "QR scan": validates the data and
// saves one row in the hostel leave table.
async function createLeaveRecordFromBody(userId, body) {
  const hostelId = await getHostelIdForStaff(userId);
  const record = normalizeLeaveRecord(body);
  const missingFields = validateLeaveRecord(record);

  if (missingFields.length) {
    return {
      error: `Missing or invalid fields: ${missingFields.join(", ")}`,
    };
  }

  const createdRecord = await prisma.hostelLeaveRecord.create({
    data: { ...record, hostelId, source: body.source || "manual" },
  });

  return { record: createdRecord };
}

// ── GET /api/hostel/summary ───────────────────────────────────
// Fills the three cards on the hostel dashboard:
// leave record count, open grievance count, latest menu.
router.get("/summary", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const [latestMenu, leaveCount, openGrievances] = await Promise.all([
    prisma.messMenu.findFirst({
      where: { hostelId },
      orderBy: { createdAt: "desc" },
      include: { hostel: { select: { name: true } } },
    }),
    // FIX: this used to say ".ccount" (typo) which crashed the whole
    // dashboard summary with a 500 error. It is ".count".
    prisma.hostelLeaveRecord.count({ where: { hostelId } }),
    prisma.grievance.count({
      where: {
        hostelId,
        NOT: {
          staffStatus: "RESOLVED",
          studentStatus: "CONFIRMED",
        },
      },
    }),
  ]);

  res.json({ success: true, latestMenu, leaveCount, openGrievances });
}));

// ── POST /api/hostel/mess-menu ────────────────────────────────
// Receives one image file (field name "menuImage"), stores it on
// disk, and saves its URL in the MessMenu table.
router.post(
  "/mess-menu",
  authorizeRoles("hostel"),
  upload.single("menuImage"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a JPEG or PNG menu image." });
    }

    const hostelId = await getHostelIdForStaff(req.user.id);
    const menu = await prisma.messMenu.create({
      data: {
        hostelId,
        imageUrl: readImageUrl(req, req.file.filename),
        uploadedBy: req.user.id,
      },
      include: { hostel: { select: { name: true } } },
    });

    res.status(201).json({ success: true, menu });
  })
);

// ── GET /api/hostel/mess-menus ────────────────────────────────
// Every logged-in user can view uploaded hostel mess menus.
router.get("/mess-menus", asyncHandler(async (req, res) => {
  const menus = await prisma.messMenu.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      hostel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    success: true,
    menus,
  });
}));


// ── GET /api/hostel/leave-records ─────────────────────────────
// Returns all leave rows for this hostel, newest first.
router.get("/leave-records", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const records = await prisma.hostelLeaveRecord.findMany({
    where: { hostelId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, records });
}));

// ── POST /api/hostel/leave-records ────────────────────────────
// The "Manual add" form on the Leave Data page calls this.
router.post("/leave-records", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const result = await createLeaveRecordFromBody(req.user.id, req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  res.status(201).json({ success: true, record: result.record });
}));

// ── POST /api/hostel/scan-leave-qr ────────────────────────────
// Receives the raw text decoded from a QR code.
// Two kinds of QR are supported:
//   1. A QR that carries a qrToken → we look up the approved leave
//      in the Leave table and copy the student's details.
//   2. A QR that carries the student fields directly as JSON.
router.post("/scan-leave-qr", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const payload = parseQrPayload(req.body.qrData);

  if (!payload) {
    return res.status(400).json({ success: false, message: "The QR code did not contain readable leave data." });
  }

  if (payload.qrToken) {
    const leave = await prisma.leave.findFirst({
      where: {
        qrToken: payload.qrToken,
        status: "APPROVED",
        parentApproved: true,
        mentorApproved: true,
      },
      include: {
        student: true,
        mentor: true,
      },
    });

    if (!leave) {
      return res.status(404).json({ success: false, message: "No approved leave request matched this QR code." });
    }

    const hostelId = await getHostelIdForStaff(req.user.id);

    // DUPLICATE CHECK: this exact leave may have already been scanned
    // before (accidental double-tap, camera catching the same code
    // twice, etc). There's no leaveId column on HostelLeaveRecord to
    // check directly, so we match on the same combination that
    // uniquely identifies this leave: roll number + exact start/end
    // dates + source "qr". If a match exists, return it instead of
    // creating a second row.
    const alreadyScanned = await prisma.hostelLeaveRecord.findFirst({
      where: {
        hostelId,
        rollNumber: leave.student.rollNumber || "",
        leaveStartDate: leave.startDate,
        leaveEndDate: leave.endDate,
        source: "qr",
      },
    });

    if (alreadyScanned) {
      return res.status(200).json({
        success: true,
        record: alreadyScanned,
        message: "This leave was already scanned and recorded — no duplicate created.",
      });
    }

    const createdRecord = await prisma.hostelLeaveRecord.create({
      data: {
        hostelId,
        studentName: leave.student.name,
        rollNumber: leave.student.rollNumber || "",
        contactNumber: leave.contactNumber,
        leaveStartDate: leave.startDate,
        leaveEndDate: leave.endDate,
        parentsPhoneNumber: payload.parentsPhoneNumber || payload.parentPhoneNumber || "",
        mentorName: leave.mentor.name || leave.student.mentorName || "",
        approved: true,
        source: "qr",
      },
    });

    return res.status(201).json({ success: true, record: createdRecord });
  }

  const result = await createLeaveRecordFromBody(req.user.id, { ...payload, source: "qr" });

  if (result.error) {
    return res.status(400).json({ success: false, message: result.error });
  }

  return res.status(201).json({ success: true, record: result.record });
}));

// ── DELETE /api/hostel/leave-records ──────────────────────────
// Deletes the rows the user ticked in the leave table.
// Only rows belonging to THIS hostel can be deleted.
router.delete("/leave-records", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) {
    return res.status(400).json({ success: false, message: "Select at least one row to delete." });
  }

  const hostelId = await getHostelIdForStaff(req.user.id);
  await prisma.hostelLeaveRecord.deleteMany({
    where: {
      hostelId,
      id: { in: ids },
    },
  });

  res.json({ success: true });
}));

// ── GET /api/hostel/grievances ────────────────────────────────
// Complaints for this hostel, most urgent first.
router.get("/grievances", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const grievances = await prisma.grievance.findMany({
    where: { hostelId },
    orderBy: [
      { priorityScore: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      student: {
        select: {
          name: true,
          rollNumber: true,
          hostelId: true,
        },
      },
    },
  });

  res.json({ success: true, grievances });
}));

// ── PATCH /api/hostel/grievances/:id/status ───────────────────
// Staff marks a complaint OPEN or RESOLVED.
router.patch("/grievances/:id/status", authorizeRoles("hostel"), asyncHandler(async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const status = req.body.status;

  if (!["OPEN", "RESOLVED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be OPEN or RESOLVED." });
  }

  const grievance = await prisma.grievance.findFirst({
    where: { id: req.params.id, hostelId },
  });

  if (!grievance) {
    return res.status(404).json({ success: false, message: "Grievance not found for this hostel." });
  }

  const updatedGrievance = await prisma.grievance.update({
    where: { id: grievance.id },
    data: {
      staffStatus: status,
      staffResolvedAt: status === "RESOLVED" ? new Date() : null,
    },
    include: {
      student: { select: { name: true, rollNumber: true } },
    },
  });

  res.json({ success: true, grievance: updatedGrievance });
}));

module.exports = router;