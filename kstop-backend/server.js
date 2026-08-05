// ─────────────────────────────────────────────
//  Starts the Express server.
//  All routes are mounted here.

// ─────────────────────────────────────────────

const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");


dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────

// Allow requests from the React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ── Routes ─────────────────────────────────────
// Auth routes — register, login, forgot/reset password
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// ── Health check ───────────────────────────────
// Visit http://localhost:5000/api/health to confirm server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "K-STOP backend is running" });
});

// ── Global error handler ───────────────────────
// Always returns clean JSON instead of an HTML crash page.
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── Start server ───────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ K-STOP backend running on http://localhost:${PORT}`);
});