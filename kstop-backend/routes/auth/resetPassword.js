// ─────────────────────────────────────────────
//  routes/auth/resetPassword.js
//  POST /api/auth/reset-password
//
//  Final step of the forgot-password flow.
//  The raw reset token comes from the emailed link; only its hash
//  is stored in the database.
// ─────────────────────────────────────────────

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../../lib/prismaClient");

// Use the same cost factor as register.js
const SALT_ROUNDS = 12;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are both required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has already been used.",
      });
    }

    const now = new Date();
    if (now > new Date(resetRecord.expiresAt)) {
      await prisma.passwordResetToken.delete({ where: { token: tokenHash } });

      return res.status(400).json({
        success: false,
        message: "This reset link has expired. Please request a new one.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token: tokenHash },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[reset-password] Unexpected error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { resetPassword };
