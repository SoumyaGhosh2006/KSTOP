// ─────────────────────────────────────────────
//  Creates a single shared Prisma client instance.
//it ensures that the client is not re-instantiated on every request
//so that render.com free trial does not run out of connections
//by keeping the connection alive and reusing it across requests
// ─────────────────────────────────────────────

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;