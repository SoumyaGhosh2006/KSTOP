// ─────────────────────────────────────────────
//  routes/auth/resetPassword.js
//  LOCATION: kstop-backend/routes/auth/resetPassword.js
//
//  POST /api/auth/reset-password
//
//  This is the FINAL step in the "forgot password" flow:
//
//  Full flow recap:
//  Step 1 → User visits /forgot-password, enters their email
//  Step 2 → forgotPassword.js generates a token, emails a reset link
//  Step 3 → User clicks the link → lands on /reset-password?token=abc123
//  Step 4 → User types new password → frontend calls THIS route
//  Step 5 → We validate the token, update the password, delete the token
//  Step 6 → User redirected to /login with a success message
//
//  Request body:
//    token       — the random hex string from the reset link URL
//    newPassword — the new password the user wants to set
//
//  Returns:
//    200 — password changed successfully
//    400 — missing fields / invalid token / expired token / password too short
//    500 — unexpected server error
//
//  FIX APPLIED: This was a stub that just returned 200.
//  Now fully implemented with token lookup, expiry check,
//  bcrypt hashing, and atomic DB update.
// ─────────────────────────────────────────────

const bcrypt = require("bcryptjs");
const prisma  = require("../../lib/prismaClient");

// Use the same cost factor as register.js
const SALT_ROUNDS = 12;

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    // ── 1. Check required fields ─────────────────────────────
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are both required.",
      });
    }

    // ── 2. Password length check ──────────────────────────────
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // ── 3. Look up the token in the database ──────────────────
    // The token is @unique in schema.prisma, so findUnique is fast.
    // We use "include: { user: true }" to also get the user's info
    // in one query instead of two.
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }, // joins the User table
    });

    // Token not found → it never existed, or was already deleted after use
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has already been used.",
      });
    }

    // ── 4. Check if the token has expired ────────────────────
    // Tokens are valid for 15 minutes (set in forgotPassword.js)
    const now = new Date();
    if (now > new Date(resetRecord.expiresAt)) {
      // Clean up the expired token — no point keeping it
      await prisma.passwordResetToken.delete({ where: { token } });

      return res.status(400).json({
        success: false,
        message: "This reset link has expired. Please request a new one.",
      });
    }

    // ── 5. Hash the new password ──────────────────────────────
    // Same process as registration — never store plain text
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // ── 6. Update password AND delete token in one transaction ─
    // prisma.$transaction() means: run both DB operations together.
    // If one fails, neither happens. The DB stays consistent.
    // (We don't want the token deleted but password NOT updated, or vice versa)
    await prisma.$transaction([
      // Update the user's password to the new hash
      prisma.user.update({
        where: { id: resetRecord.userId },
        data:  { password: hashedPassword },
      }),

      // Delete the token so it can never be reused
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    // ── 7. Return success ─────────────────────────────────────
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