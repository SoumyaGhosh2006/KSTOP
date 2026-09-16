const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const genericLimitMessage = {
  success: false,
  message: "Too many requests. Please wait and try again later.",
};

function emailKeyGenerator(req) {
  const email = req.body?.email;

  if (typeof email === "string" && email.trim()) {
    return `email:${email.trim().toLowerCase()}`;
  }

  return `ip:${ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown")}`;
}

const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
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

const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
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
  message: genericLimitMessage,
});

module.exports = {
  loginIpLimiter,
  loginEmailLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordIpLimiter,
};
