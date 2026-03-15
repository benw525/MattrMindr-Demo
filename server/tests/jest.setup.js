const noop = (req, res, next) => next();

jest.mock("../middleware/rate-limit", () => ({
  authLimiter: noop,
  mfaLimiter: noop,
  forgotPasswordLimiter: noop,
  portalLoginLimiter: noop,
  apiLimiter: noop,
}));

jest.mock("otplib", () => ({
  authenticator: {
    generateSecret: () => "JBSWY3DPEHPK3PXP",
    verify: ({ token, secret }) => token === "123456",
    generate: (secret) => "123456",
  },
  generateSecret: () => "JBSWY3DPEHPK3PXP",
  generateURI: () => "otpauth://totp/test",
  verifySync: ({ token, secret }) => ({ valid: token === "123456" }),
}));

jest.mock("qrcode", () => ({
  toDataURL: () => Promise.resolve("data:image/png;base64,mock"),
}));

jest.mock("../email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendTempPasswordEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));
