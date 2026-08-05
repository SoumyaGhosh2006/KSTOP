// ─────────────────────────────────────────────
//  Auth router — groups all auth endpoints
//  and exports them as a single Express router.
//
//  Mounted at: /api/auth in server.js
//
//  So the full URLs are:
//  POST /api/auth/register
//  POST /api/auth/login
//  POST /api/auth/forgot-password
//  POST /api/auth/reset-password
// ─────────────────────────────────────────────

const express        = require("express");
const router         = express.Router();

const { register }       = require("./register");
const { login }          = require("./login");
const { forgotPassword } = require("./forgotPassword");
const { resetPassword }  = require("./resetPassword");

// POST /api/auth/register
// Creates a new account — works for all roles
router.post("/register", register);

// POST /api/auth/login
// Universal login — returns JWT + role for redirect
router.post("/login", login);

// POST /api/auth/forgot-password
// Sends a password reset email via Resend
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
// Sets a new password using the emailed token
router.post("/reset-password", resetPassword);

module.exports = router;