// ─────────────────────────────────────────────
//  lib/devAccounts.js
//  LOCATION: kstop-backend/lib/devAccounts.js
//
//  Development-only account definitions and helpers.
//
//  This module is the single source of truth for development
//  authentication identities used by the backend.
//
//  IMPORTANT:
//  - These accounts are only valid in development mode.
//  - They are never production credentials.
//  - Production users are resolved from the database.
// ─────────────────────────────────────────────

const prisma = require("./prismaClient");

// A bcrypt-looking placeholder.
// Development accounts cannot log in using a password.
// The value only exists because the password column is required.
const DEV_PASSWORD_HASH =
  "$2b$12$devaccountnopasswordlogin0000000000000000000000000000";

// Single source of truth for development authentication identities.
//
// Other parts of the backend should use this instead of creating
// their own copies of development tokens and IDs.
const DEV_ACCOUNTS = Object.freeze({
  hostel: Object.freeze({
    token: "dev-token-hostel",
    id: "hostel-test-123",
    role: "hostel",
  }),

  student: Object.freeze({
    token: "dev-token-student",
    id: "student-test-123",
    role: "student",
  }),

  parent: Object.freeze({
    token: "dev-token-parent",
    id: "parent-test-123",
    role: "parent",
  }),

  mentor: Object.freeze({
    token: "dev-token-mentor",
    id: "mentor-test-123",
    role: "mentor",
  }),
});

function isDevelopment() {
  return (process.env.NODE_ENV || "development") === "development";
}

function getDevAccountByToken(token) {
  if (!token) return null;

  return (
    Object.values(DEV_ACCOUNTS).find(
      (account) => account.token === token
    ) || null
  );
}

function getDevAccountByRole(role) {
  if (!role) return null;

  return DEV_ACCOUNTS[String(role).toLowerCase()] || null;
}

// Makes sure the dev mentor exists.
async function ensureDevMentor() {
  const account = DEV_ACCOUNTS.mentor;

  return prisma.user.upsert({
    where: { id: account.id },

    update: {
      mentorRollRangeStart: 2205001,
      mentorRollRangeEnd: 2205050,
    },

    create: {
      id: account.id,
      name: "Dev Mentor",
      email: "dev.mentor.fcs@kiit.ac.in",
      password: DEV_PASSWORD_HASH,
      role: account.role,
      mentorRollRangeStart: 2205001,
      mentorRollRangeEnd: 2205050,
    },
  });
}

// Makes sure the dev student exists.
async function ensureDevStudent() {
  const account = DEV_ACCOUNTS.student;

  const hostel = await prisma.hostel.upsert({
    where: { name: "Hostel KP-1" },
    update: {},
    create: { name: "Hostel KP-1" },
  });

  await ensureDevMentor();

  return prisma.user.upsert({
    where: { id: account.id },

    update: {
      rollNumber: "2205001",
      mentorName: "Dev Mentor",
      hostelId: hostel.id,
      attendancePercentage: 72,
      academicDetails: "CGPA 8.1 · 0 backlogs · CSE Core",
    },

    create: {
      id: account.id,
      name: "Asha Kumar",
      email: "asha.kumar@kiit.ac.in",
      password: DEV_PASSWORD_HASH,
      role: account.role,
      rollNumber: "2205001",
      gender: "PreferNotToSay",
      mentorName: "Dev Mentor",
      hostelId: hostel.id,
      attendancePercentage: 72,
      academicDetails: "CGPA 8.1 · 0 backlogs · CSE Core",
    },
  });
}

// Development-only helper for student database access.
async function ensureDevStudentAccount(userId) {
  if (!isDevelopment() || userId !== DEV_ACCOUNTS.student.id) {
    return;
  }

  await ensureDevStudent();
}

async function ensureDevParent() {
  const account = DEV_ACCOUNTS.parent;

  await ensureDevStudent();

  return prisma.user.upsert({
    where: { id: account.id },

    update: {
      childRollNumber: "2205001",
    },

    create: {
      id: account.id,
      name: "Parent User",
      email: "parent@example.com",
      password: DEV_PASSWORD_HASH,
      role: account.role,
      childRollNumber: "2205001",
    },
  });
}

// Development-only helper for parent database access.
async function ensureDevParentAccount(userId) {
  if (!isDevelopment() || userId !== DEV_ACCOUNTS.parent.id) {
    return;
  }

  await ensureDevParent();
}

// Development-only helper for mentor database access.
async function ensureDevMentorAccount(userId) {
  if (!isDevelopment() || userId !== DEV_ACCOUNTS.mentor.id) {
    return;
  }

  await ensureDevMentor();
}

module.exports = {
  DEV_ACCOUNTS,
  getDevAccountByToken,
  getDevAccountByRole,
  ensureDevStudentAccount,
  ensureDevParentAccount,
  ensureDevMentorAccount,
};