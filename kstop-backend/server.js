// ─────────────────────────────────────────────
//  server.js
//  LOCATION: kstop-backend/server.js
//
//  This is the ENTRY POINT of the backend.
//  Run it with: node server.js  OR  npm run dev (if you have nodemon)
//
//  What this file does:
//  1. Creates the Express app
//  2. Sets up middleware (CORS, JSON parsing)
//  3. Connects all the route files
//  4. Starts listening on a port
// ─────────────────────────────────────────────

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config(); // loads your .env file into process.env

const app = express();  
const httpServer = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────

// CORS — allows the frontend (running on a different port/domain)
// to make requests to this backend without being blocked by the browser.
// In development: frontend is on localhost:5173, backend on localhost:5000
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Parse incoming JSON request bodies
// Without this, req.body is undefined in all your route handlers
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────

// Import the auth router (index.js inside routes/auth/)
// It handles: /send-otp, /register, /login, /forgot-password, /reset-password
const authRoutes = require("./routes/auth/index");
const hostelRoutes = require("./routes/hostel/index");
const leaveRoutes = require("./routes/leave/index");
const parentRoutes = require("./routes/parent/index");
const mentorRoutes = require("./routes/mentor/index");
const grievanceRoutes = require("./routes/grievance/index");
const { setupParentMentorChat } = require("./socket/parentMentorChat");
// Mount the auth router at /api/auth
// So POST /api/auth/login, POST /api/auth/register, etc.
app.use("/api/auth", authRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/grievance", grievanceRoutes);

// ── Health check route ────────────────────────────────────────
// Visit http://localhost:5000/api/health to confirm the server is running
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "K-STOP backend is running." });
});

// ── 404 handler ───────────────────────────────────────────────
// If no route matched, return a clean 404 instead of Express's default HTML error
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ── Global error handler ──────────────────────────────────────
// This catches errors thrown by middleware that runs BEFORE our
// route handlers — most importantly multer (menu image uploads).
// Examples: image larger than 5 MB, or a file type that is not
// JPEG/PNG. Without this, the browser received an HTML error page
// and the frontend could only show "Menu upload failed."
// The 4 parameters (err, req, res, next) are how Express knows
// this is an error handler — all four are required.
app.use((err, req, res, next) => {
  // Multer has its own error names, e.g. "LIMIT_FILE_SIZE".
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "The image is too large. Maximum size is 5 MB."
        : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  // Errors we created ourselves (e.g. "Only JPEG and PNG menu images are allowed.")
  console.error("[server] Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
});

// Parent <-> Mentor Socket.IO connection
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

setupParentMentorChat(io);

// ── Start the server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ K-STOP backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});