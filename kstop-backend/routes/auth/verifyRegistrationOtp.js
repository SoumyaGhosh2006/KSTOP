const crypto = require("crypto");
const prisma = require("../../lib/prismaClient");

const MAX_OTP_ATTEMPTS = 5;
const attemptCounts = new Map();

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for OTP protection.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(String(otp).trim())
    .digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function clearAttempts(email) {
  attemptCounts.delete(email);
}

async function verifyRegistrationOtp(req, res, next) {
  try {
    const { email, otp } = req.body || {};

    if (!email || typeof email !== "string" || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await prisma.otp.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one.",
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "This code has already been used. Please request a new one.",
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      clearAttempts(normalizedEmail);
      await prisma.otp.deleteMany({ where: { email: normalizedEmail } });
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request a new one.",
      });
    }

    const submittedHash = hashOtp(otp);
    const valid = safeEqual(otpRecord.otp, submittedHash);

    if (!valid) {
      const nextAttempts = (attemptCounts.get(normalizedEmail) || 0) + 1;
      attemptCounts.set(normalizedEmail, nextAttempts);

      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        clearAttempts(normalizedEmail);
        await prisma.otp.deleteMany({ where: { email: normalizedEmail } });
        return res.status(429).json({
          success: false,
          message: "Too many verification attempts. Please request a new code.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Incorrect code. Please check and try again.",
      });
    }

    clearAttempts(normalizedEmail);

    // register.js already performs the final OTP state checks and deletes
    // the record after account creation. Pass the verified hash forward so
    // the existing comparison remains compatible without storing plaintext.
    req.body.otp = otpRecord.otp;
    next();
  } catch (error) {
    console.error("[verify-registration-otp] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { verifyRegistrationOtp, hashOtp, MAX_OTP_ATTEMPTS };
