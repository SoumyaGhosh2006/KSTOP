// ─────────────────────────────────────────────
//  lib/prismaClient.js
//  LOCATION: kstop-backend/lib/prismaClient.js
//
//  Creates ONE shared Prisma instance for the whole backend.
//  Every route imports it with:
//    const prisma = require("../../lib/prismaClient");
//
//  WHY ONE INSTANCE:
//  Prisma opens a DB connection pool. Creating a new PrismaClient()
//  in every file would open too many connections and crash Postgres.
//  One shared instance = one pool = correct behaviour.
//
//  The global trick stops Nodemon hot-reloads from creating
//  duplicate instances during development.
// ─────────────────────────────────────────────

const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

module.exports = prisma;