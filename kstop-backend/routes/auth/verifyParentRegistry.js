// ─────────────────────────────────────────────
//  routes/auth/verifyParentRegistry.js
//
//  Final parent-registration authorization check.
//  The parent registry is checked again at account creation so
//  /auth/register cannot bypass the registry by calling the API directly.
// ─────────────────────────────────────────────

const prisma = require("../../lib/prismaClient");

async function verifyParentRegistry(req, res, next) {
  try {
    const { email, role, phone, rollNumber } = req.body || {};

    // This middleware is only meaningful for parent registration.
    if (role !== "parent") {
      return next();
    }

    if (
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof rollNumber !== "string" ||
      !email.trim() ||
      !phone.trim() ||
      !rollNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Parent email, phone number, and child roll number are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedRollNumber = rollNumber.trim();

    const parentRecord = await prisma.parentRegistry.findFirst({
      where: {
        email: normalizedEmail,
        phone: normalizedPhone,
        childRollNumber: normalizedRollNumber,
      },
    });

    if (!parentRecord) {
      return res.status(400).json({
        success: false,
        message: "Parent details do not match our records.",
      });
    }

    next();
  } catch (error) {
    console.error("[verify-parent-registry] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { verifyParentRegistry };
