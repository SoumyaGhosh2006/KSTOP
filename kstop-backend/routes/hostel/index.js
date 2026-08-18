const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../../lib/prismaClient");
const { verifyToken, authorizeRoles } = require("../../middleware/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/mess-menus"),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${req.user.id}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG and PNG menu images are allowed."));
    }
    callback(null, true);
  },
});

router.use(verifyToken);

/**
 * Retrieves a user's identity, hostel assignments, and email address.
 * @param {string|number} userId - The user's identifier.
 * @returns {Object|null} The selected user details, or `null` when no matching user exists.
 */
async function getHostelUser(userId) {
  return prisma.user.findUnique({
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

/**
 * Resolves the hostel assigned to a staff member, creating and assigning one based on the staff member's name when necessary.
 * @param {string|number} userId - The staff member's user ID.
 * @return {string|number|null} The assigned hostel ID, or `null` if the user cannot be found.
 */
async function getHostelIdForStaff(userId) {
  const user = await getHostelUser(userId);
  if (!user) return null;

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

/**
 * Builds the public URL for an uploaded mess-menu image.
 * @param {object} req - The Express request used to determine the protocol and host.
 * @param {string} filename - The uploaded image filename.
 * @return {string} The image's public URL.
 */
function readImageUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/mess-menus/${filename}`;
}

/**
 * Converts QR payload data into a usable value.
 * @param {*} payload - An object or JSON-encoded payload.
 * @return {*} The original object, the parsed JSON value, or `null` when parsing fails.
 */
function parseQrPayload(payload) {
  if (typeof payload === "object" && payload !== null) return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Normalizes leave data into the standard leave-record fields.
 * @param {Object} data - Leave data using supported field names and aliases.
 * @returns {Object} A normalized leave record with converted dates and an approval status.
 */
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

/**
 * Identifies missing or invalid fields in a leave record.
 * @param {Object} record - The leave record to validate.
 * @returns {string[]} The names of required fields that are missing or contain invalid dates.
 */
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

  return missingFields;
}

/**
 * Creates a hostel leave record from submitted leave details.
 * @param {string|number} userId - The hostel staff user's identifier.
 * @param {Object} body - Leave details and optional record source.
 * @return {Promise<Object>} An object containing either the created record or an error message for missing or invalid fields.
 */
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

router.get("/summary", authorizeRoles("hostel"), async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const [latestMenu, leaveCount, openGrievances] = await Promise.all([
    prisma.messMenu.findFirst({
      where: { hostelId },
      orderBy: { createdAt: "desc" },
      include: { hostel: { select: { name: true } } },
    }),
    prisma.hostelLeaveRecord.ccount({ where: { hostelId } }),
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
});

router.post(
  "/mess-menu",
  authorizeRoles("hostel"),
  upload.single("menuImage"),
  async (req, res) => {
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
  }
);

router.get("/mess-menus", async (req, res) => {
  const menus = await prisma.messMenu.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      hostel: { select: { id: true, name: true } },
      foodRatings: { select: { rating: true } },
    },
  });

  res.json({ success: true, menus });
});

router.post("/mess-menus/:menuId/rate", authorizeRoles("student"), async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 stars." });
  }

  const user = await getHostelUser(req.user.id);
  const menu = await prisma.messMenu.findUnique({ where: { id: req.params.menuId } });

  if (!menu || menu.hostelId !== user?.hostelId) {
    return res.status(403).json({
      success: false,
      message: "Only students from this hostel can rate this menu.",
    });
  }

  const foodRating = await prisma.foodRating.upsert({
    where: {
      menuId_studentId_foodItem: {
        menuId: menu.id,
        studentId: req.user.id,
        foodItem: "Overall menu",
      },
    },
    update: { rating },
    create: {
      menuId: menu.id,
      studentId: req.user.id,
      foodItem: "Overall menu",
      rating,
    },
  });

  res.json({ success: true, rating: foodRating });
});

router.get("/leave-records", authorizeRoles("hostel"), async (req, res) => {
  const hostelId = await getHostelIdForStaff(req.user.id);
  const records = await prisma.hostelLeaveRecord.findMany({
    where: { hostelId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, records });
});

router.post("/leave-records", authorizeRoles("hostel"), async (req, res) => {
  const result = await createLeaveRecordFromBody(req.user.id, req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  res.status(201).json({ success: true, record: result.record });
});

router.post("/scan-leave-qr", authorizeRoles("hostel"), async (req, res) => {
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
});

router.delete("/leave-records", authorizeRoles("hostel"), async (req, res) => {
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
});

router.get("/grievances", authorizeRoles("hostel"), async (req, res) => {
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
});

router.patch("/grievances/:id/status", authorizeRoles("hostel"), async (req, res) => {
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
});

module.exports = router;
