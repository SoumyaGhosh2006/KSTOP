// ─────────────────────────────────────────────
//  lib/devAccounts.js
//  LOCATION: kstop-backend/lib/devAccounts.js
//
//  The Login page has "quick login" buttons for development that
//  use fake tokens (dev-token-student, dev-token-hostel). Those
//  tokens pass the auth middleware, but without a matching row in
//  the database every database write for these users fails.
//
//  This helper creates those demo accounts in the database the
//  first time they are needed. It ONLY runs in development and
//  ONLY for the two known dev ids — real accounts are untouched.
// ─────────────────────────────────────────────

const prisma = require("./prismaClient");

// A bcrypt-looking placeholder (correct 60-char format).
// These accounts can never log in with a password; the value just
// has to exist because the password column is required.
const DEV_PASSWORD_HASH =
  "$2b$12$devaccountnopasswordlogin0000000000000000000000000000";

function isDevelopment() {
  return (process.env.NODE_ENV || "development") === "development";
}

// Makes sure the dev mentor exists. The dev student's leave
// requests get assigned to this mentor.
async function ensureDevMentor() {
  return prisma.user.upsert({
    where: { email: "dev.mentor.fcs@kiit.ac.in" },
    update: {},
    create: {
      name: "Dev Mentor",
      email: "dev.mentor.fcs@kiit.ac.in",
      password: DEV_PASSWORD_HASH,
      role: "mentor",
    },
  });
}

// Makes sure the dev student exists (linked to a demo hostel and
// the demo mentor), so "Quick Login as Student" can submit real
// leave requests during development.
async function ensureDevStudent() {
  const hostel = await prisma.hostel.upsert({
    where: { name: "Hostel KP-1" },
    update: {},
    create: { name: "Hostel KP-1" },
  });

  await ensureDevMentor();

  return prisma.user.upsert({
    where: { id: "student-test-123" },
    update: {},
    create: {
      id: "student-test-123",
      name: "Asha Kumar",
      email: "asha.kumar@kiit.ac.in",
      password: DEV_PASSWORD_HASH,
      role: "student",
      rollNumber: "2205001",
      gender: "PreferNotToSay",
      mentorName: "Dev Mentor",
      hostelId: hostel.id,
    },
  });
}

// Call this with req.user.id before doing database work for a
// student. In development it creates the dev account if missing;
// in production it does nothing.
async function ensureDevStudentAccount(userId) {
  if (!isDevelopment() || userId !== "student-test-123") return;
  await ensureDevStudent();
}

async function ensureDevParent() {
  await ensureDevStudent(); // ensure the child exists first

  return prisma.user.upsert({
    where: { id: "parent-test-123" },
    update: {},
    create: {
      id: "parent-test-123",
      name: "Parent User",
      email: "parent@example.com",
      password: DEV_PASSWORD_HASH,
      role: "parent",
      childRollNumber: "2205001",
    },
  });
}

async function ensureDevParentAccount(userId) {
  if (!isDevelopment() || userId !== "parent-test-123") return;
  await ensureDevParent();
}

module.exports = { ensureDevStudentAccount, ensureDevParentAccount };
module.exports = { ensureDevStudentAccount };
