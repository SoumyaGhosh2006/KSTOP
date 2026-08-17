// ─────────────────────────────────────────────
//  routes/auth/index.js
//  LOCATION: kstop-backend/routes/auth/index.js
//
//  This file collects all auth routes into one router,
//  which is then mounted in server.js at /api/auth.

//  Full list of available endpoints:

//  POST /api/auth/send-otp         ← STEP 1 of registration
//  POST /api/auth/register         ← STEP 2 of registration
//  POST /api/auth/login            ← login for all roles
//  POST /api/auth/forgot-password  ← request a password reset email
//  POST /api/auth/reset-password   ← set the new password using the token
// ─────────────────────────────────────────────

const express = require("express");
const router  = express.Router();

// Import each route handler function
const { sendOtp }        = require("./sendOtp");
const { register }       = require("./register");
const { login }          = require("./login");
const { forgotPassword } = require("./forgotPassword");
const { resetPassword }  = require("./resetPassword");

// ── POST /api/auth/send-otp ───────────────────────────────────
// Step 1 of registration.
// Sends a 6-digit code to the user's email.
// They enter that code in Step 2 (/register).
router.post("/send-otp", sendOtp);

// ── POST /api/auth/register ───────────────────────────────────

// User submits their form data + the OTP from their email.
// We verify the OTP then create the account.
router.post("/register", register);

// ── POST /api/auth/login ──────────────────────────────────────
// Universal login for all roles (student, mentor, hostel, parent).
// Returns a JWT token + user info.
// Frontend uses "role" to redirect to the correct dashboard.
router.post("/login", login);

// ── POST /api/auth/forgot-password ───────────────────────────
// User enters their email.
// We generate a reset token and email them a link.
// Always returns 200 — even if email not found — so we don't
// reveal which emails are registered.
router.post("/forgot-password", forgotPassword);

// ── POST /api/auth/reset-password ────────────────────────────
// User submits their new password along with the token from the email link.
// We validate the token, update the password, then delete the token.
router.post("/reset-password", resetPassword);

module.exports = router;