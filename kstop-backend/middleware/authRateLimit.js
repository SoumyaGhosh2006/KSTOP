const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const genericLimitMessage = {
  success: false,
  message: "Too many requests. Please wait and try again later.",
};

function clientIpKeyGenerator(req) {
  // K-STOP currently runs behind Render's Cloudflare edge. Render documents
  // CF-Connecting-IP as the reliable client IP header at that edge.
  const cloudflareIp = req.get("CF-Connecting-IP");

  if (cloudflareIp) {
    return `ip:${cloudflareIp.trim()}`;
  }

  return `ip:${ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown")}`;
}

function emailKeyGenerator(req) {
  const email = req.body?.email;

  if (typeof email === "string" && email.trim()) {
    return `email:${email.trim().toLowerCase()}`;
  }

  return clientIpKeyGenerator(req);
}

const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: clientIpKeyGenerator,
  message: genericLimitMessage,
});

const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  keyGenerator: emailKeyGenerator,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: genericLimitMessage,
});

const sendOtpIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  message: genericLimitMessage,
});

const sendOtpEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: emailKeyGenerator,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: genericLimitMessage,
});

const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  message: genericLimitMessage,
});

const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  keyGenerator: emailKeyGenerator,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: genericLimitMessage,
});

const resetPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  message: genericLimitMessage,
});

module.exports = {
  loginIpLimiter,
  loginEmailLimiter,
  sendOtpIpLimiter,
  sendOtpEmailLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordIpLimiter,
};
