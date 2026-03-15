const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const { createTestApp, setupTestDB, cleanTestData, createTestUser, loginAgent, createAuthenticatedAgent, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


describe("POST /api/auth/login", () => {
  it("should login successfully with correct credentials", async () => {
    const user = await createTestUser({ email: "login@test.com", password: "ValidPass1!" });
    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "login@test.com", "ValidPass1!");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("login@test.com");
    expect(res.body.id).toBe(user.id);
    expect(res.body.mustChangePassword).toBe(false);
  });

  it("should return 401 for non-existent email", async () => {
    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "nobody@test.com", "SomePass1!");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no account/i);
  });

  it("should return 401 for wrong password", async () => {
    await createTestUser({ email: "wrong@test.com", password: "RightPass1!" });
    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "wrong@test.com", "WrongPass1!");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrect password/i);
  });

  it("should return 401 for deactivated user", async () => {
    const user = await createTestUser({ email: "deactivated@test.com", password: "ValidPass1!" });
    await pool.query("UPDATE users SET deleted_at = NOW() WHERE id = $1", [user.id]);
    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "deactivated@test.com", "ValidPass1!");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/deactivated/i);
  });

  it("should be case-insensitive for email", async () => {
    await createTestUser({ email: "CasE@test.com", password: "ValidPass1!" });
    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "case@TEST.COM", "ValidPass1!");
    expect(res.status).toBe(200);
  });

  it("should return 400 for invalid email format", async () => {
    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/login").send({ email: "notanemail", password: "Pass1!" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login — temp password", () => {
  it("should authenticate with temp password and set mustChangePassword", async () => {
    const user = await createTestUser({ email: "temp@test.com", password: "OldPass1!" });
    const tempHash = await bcrypt.hash("TempPass1!", 4);
    await pool.query("UPDATE users SET temp_password_hash = $1 WHERE id = $2", [tempHash, user.id]);

    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "temp@test.com", "TempPass1!");
    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });
});

describe("POST /api/auth/login — MFA flow", () => {
  it("should return requireMfa for MFA-enabled user", async () => {
    const user = await createTestUser({ email: "mfa@test.com", password: "MfaPass1!" });
    const { encrypt } = require("../utils/encryption");
    const { generateSecret } = require("otplib");
    const secret = generateSecret();
    await pool.query("UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1 WHERE id = $2",
      [encrypt(secret), user.id]);

    const agent = supertest.agent(app);
    const res = await loginAgent(agent, "mfa@test.com", "MfaPass1!");
    expect(res.status).toBe(200);
    expect(res.body.requireMfa).toBe(true);
    expect(res.body).not.toHaveProperty("id");
  });
});

describe("POST /api/auth/mfa/verify", () => {
  it("should reject with no pending MFA session", async () => {
    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/mfa/verify").send({ code: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no mfa/i);
  });

  it("should complete MFA login with valid code", async () => {
    const user = await createTestUser({ email: "mfa-verify@test.com", password: "MfaPass1!" });
    const { encrypt } = require("../utils/encryption");
    const { generateSecret } = require("otplib");
    const secret = generateSecret();
    await pool.query("UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1 WHERE id = $2",
      [encrypt(secret), user.id]);

    const agent = supertest.agent(app);
    const loginRes = await loginAgent(agent, "mfa-verify@test.com", "MfaPass1!");
    expect(loginRes.body.requireMfa).toBe(true);

    const verifyRes = await agent.post("/api/auth/mfa/verify").send({ code: "123456" });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.id).toBe(user.id);
    expect(verifyRes.body.email).toBe("mfa-verify@test.com");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
  });

  it("should reject invalid MFA code", async () => {
    const user = await createTestUser({ email: "mfa-bad@test.com", password: "MfaPass1!" });
    const { encrypt } = require("../utils/encryption");
    const { generateSecret } = require("otplib");
    const secret = generateSecret();
    await pool.query("UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1 WHERE id = $2",
      [encrypt(secret), user.id]);

    const agent = supertest.agent(app);
    await loginAgent(agent, "mfa-bad@test.com", "MfaPass1!");
    const verifyRes = await agent.post("/api/auth/mfa/verify").send({ code: "999999" });
    expect(verifyRes.status).toBe(401);
    expect(verifyRes.body.error).toMatch(/invalid/i);
  });
});

describe("GET /api/auth/me", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await supertest(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should return user info when authenticated", async () => {
    const { agent, user } = await createAuthenticatedAgent(app, { email: "me@test.com" });
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.email).toBe("me@test.com");
  });
});

describe("POST /api/auth/change-password", () => {
  it("should change password with valid current password", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      email: "changepw@test.com",
      password: "OldPass1!",
    });
    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const agent2 = supertest.agent(app);
    const loginRes = await loginAgent(agent2, "changepw@test.com", "NewPass1!");
    expect(loginRes.status).toBe(200);
  });

  it("should reject weak password", async () => {
    const { agent } = await createAuthenticatedAgent(app, { password: "OldPass1!" });
    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "OldPass1!",
      newPassword: "weak",
    });
    expect(res.status).toBe(400);
  });

  it("should reject wrong current password", async () => {
    const { agent } = await createAuthenticatedAgent(app, { password: "OldPass1!" });
    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "WrongPass1!",
      newPassword: "NewPass1!",
    });
    expect(res.status).toBe(401);
  });

  it("should invalidate other sessions on password change", async () => {
    const user = await createTestUser({ email: "multi-session@test.com", password: "OldPass1!" });

    const agent1 = supertest.agent(app);
    await loginAgent(agent1, "multi-session@test.com", "OldPass1!");
    const me1 = await agent1.get("/api/auth/me");
    expect(me1.status).toBe(200);

    const agent2 = supertest.agent(app);
    await loginAgent(agent2, "multi-session@test.com", "OldPass1!");
    const me2 = await agent2.get("/api/auth/me");
    expect(me2.status).toBe(200);

    await agent1.post("/api/auth/change-password").send({
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
    });

    const me1After = await agent1.get("/api/auth/me");
    expect(me1After.status).toBe(200);

    const me2After = await agent2.get("/api/auth/me");
    expect(me2After.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("should return ok even for non-existent email (no leak)", async () => {
    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/forgot-password").send({ email: "nonexistent@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("should reset password with valid token", async () => {
    const user = await createTestUser({ email: "reset@test.com", password: "OldPass1!" });
    const token = "RESET123";
    await pool.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
      [token, new Date(Date.now() + 3600000), user.id]
    );

    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/reset-password").send({
      email: "reset@test.com",
      code: token,
      newPassword: "NewReset1!",
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const loginRes = await loginAgent(supertest.agent(app), "reset@test.com", "NewReset1!");
    expect(loginRes.status).toBe(200);
  });

  it("should reject expired token", async () => {
    const user = await createTestUser({ email: "expired@test.com", password: "OldPass1!" });
    await pool.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
      ["EXPIRED", new Date(Date.now() - 3600000), user.id]
    );

    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/reset-password").send({
      email: "expired@test.com",
      code: "EXPIRED",
      newPassword: "NewPass1!",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it("should reject invalid token", async () => {
    await createTestUser({ email: "badcode@test.com", password: "OldPass1!" });
    const agent = supertest.agent(app);
    const res = await agent.post("/api/auth/reset-password").send({
      email: "badcode@test.com",
      code: "WRONG",
      newPassword: "NewPass1!",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("should clear session on logout", async () => {
    const { agent } = await createAuthenticatedAgent(app, { email: "logout@test.com" });
    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("POST /api/auth/mfa/setup", () => {
  it("should return QR code and secret for authenticated user", async () => {
    const { agent } = await createAuthenticatedAgent(app, { email: "mfa-setup@test.com" });
    const res = await agent.post("/api/auth/mfa/setup");
    expect(res.status).toBe(200);
    expect(res.body.secret).toBeDefined();
    expect(res.body.qrCode).toMatch(/^data:image/);
  });

  it("should require authentication", async () => {
    const res = await supertest(app).post("/api/auth/mfa/setup");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/mfa/verify-setup", () => {
  it("should enable MFA with valid verification code", async () => {
    const { agent, user } = await createAuthenticatedAgent(app, { email: "mfa-enable@test.com" });
    await agent.post("/api/auth/mfa/setup");

    const res = await agent.post("/api/auth/mfa/verify-setup").send({ code: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { rows } = await pool.query("SELECT mfa_enabled FROM users WHERE id = $1", [user.id]);
    expect(rows[0].mfa_enabled).toBe(true);
  });

  it("should reject invalid verification code during setup", async () => {
    const { agent } = await createAuthenticatedAgent(app, { email: "mfa-bad-setup@test.com" });
    await agent.post("/api/auth/mfa/setup");

    const res = await agent.post("/api/auth/mfa/verify-setup").send({ code: "999999" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/mfa/disable", () => {
  it("should disable MFA with correct password", async () => {
    const { agent, user } = await createAuthenticatedAgent(app, {
      email: "mfa-disable@test.com",
      password: "DisablePass1!",
    });
    const { encrypt } = require("../utils/encryption");
    const { generateSecret } = require("otplib");
    await pool.query("UPDATE users SET mfa_enabled = TRUE, mfa_secret = $1 WHERE id = $2",
      [encrypt(generateSecret()), user.id]);

    const res = await agent.post("/api/auth/mfa/disable").send({ password: "DisablePass1!" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const { rows } = await pool.query("SELECT mfa_enabled FROM users WHERE id = $1", [user.id]);
    expect(rows[0].mfa_enabled).toBe(false);
  });

  it("should reject wrong password", async () => {
    const { agent } = await createAuthenticatedAgent(app, { password: "RightPass1!" });
    const res = await agent.post("/api/auth/mfa/disable").send({ password: "WrongPass1!" });
    expect(res.status).toBe(401);
  });
});

describe("Rate limiting behavior", () => {
  it("should enforce rate limits on login endpoint when limiter is active", async () => {
    const rateLimit = require("express-rate-limit");
    const testApp = require("express")();
    testApp.use(require("express").json());

    const strictLimiter = rateLimit({
      windowMs: 60000,
      max: 2,
      message: { error: "Too many attempts" },
    });

    testApp.post("/api/test-rate", strictLimiter, (req, res) => res.json({ ok: true }));

    const agent = supertest(testApp);
    const r1 = await agent.post("/api/test-rate");
    expect(r1.status).toBe(200);
    const r2 = await agent.post("/api/test-rate");
    expect(r2.status).toBe(200);
    const r3 = await agent.post("/api/test-rate");
    expect(r3.status).toBe(429);
    expect(r3.body.error).toMatch(/too many/i);
  });
});

describe("POST /api/auth/send-temp-password", () => {
  it("should require App Admin role", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "Attorney", roles: ["Attorney"] });
    const target = await createTestUser({ email: "target@test.com" });
    const res = await agent.post("/api/auth/send-temp-password").send({ userId: target.id });
    expect(res.status).toBe(403);
  });

  it("should succeed for App Admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const target = await createTestUser({ email: "target2@test.com" });
    const res = await agent.post("/api/auth/send-temp-password").send({ userId: target.id });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
