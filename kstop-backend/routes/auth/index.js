// ─────────────────────────────────────────────
//  routes/auth/index.js
//  LOCATION: kstop-backend/routes/auth/index.js
//
//  This file collects all auth routes into one router,
//  which is then mounted in server.js at /api/auth.
// ─────────────────────────────────────────────

const express = require("express");
const router  = express.Router();

// Import each route handler function
const { sendOtp }        = require("./sendOtp");
const { verifyRegistrationOtp } = require("./verifyRegistrationOtp");
const { register }       = require("./register");
const { login }          = require("./login");
const { forgotPassword } = require("./forgotPassword");
const { resetPassword }  = require("./resetPassword");
const {
  loginIpLimiter,
  loginEmailLimiter,
  sendOtpIpLimiter,
  sendOtpEmailLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordIpLimiter,
} = require("../../middleware/authRateLimit");

// ── POST /api/auth/send-otp ───────────────────────────────────
// Step 1 of registration.
// Sends a 6-digit code to the user's email.
router.post("/send-otp", sendOtpIpLimiter, sendOtpEmailLimiter, sendOtp);

// ── POST /api/auth/register ───────────────────────────────────
// The OTP middleware verifies the submitted code before the existing
// registration handler runs. The handler remains responsible for the
// final account-creation transaction and OTP cleanup.
router.post("/register", verifyRegistrationOtp, register);

// ── POST /api/auth/login ──────────────────────────────────────
// Universal login for all roles (student, mentor, hostel, parent).
// Two limits are applied: one per source IP and one per account identity.
router.post("/login", loginIpLimiter, loginEmailLimiter, login);

// ── POST /api/auth/forgot-password ───────────────────────────
// User enters their email. The endpoint must not reveal whether the
// account exists. Both IP and email-based limits reduce abuse.
router.post(
  "/forgot-password",
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  forgotPassword
);

// ── POST /api/auth/reset-password ────────────────────────────
// User submits their new password along with the token from the email link.
router.post("/reset-password", resetPasswordIpLimiter, resetPassword);

module.exports = router;
