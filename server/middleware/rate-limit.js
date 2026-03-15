const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many MFA attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many password reset requests. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const portalLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, mfaLimiter, forgotPasswordLimiter, portalLoginLimiter, apiLimiter };
