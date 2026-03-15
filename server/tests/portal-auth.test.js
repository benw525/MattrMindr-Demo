const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const { createTestApp, setupTestDB, cleanTestData, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


async function createClientUser(caseId, overrides = {}) {
  const defaults = {
    name: "Test Client",
    email: `client-${Date.now()}@test.com`,
    password: "ClientPass1!",
    is_active: true,
  };
  const data = { ...defaults, ...overrides };
  const hash = await bcrypt.hash(data.password, 4);
  const { rows } = await pool.query(
    `INSERT INTO client_users (case_id, name, email, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [caseId, data.name, data.email, hash, data.is_active]
  );
  return { ...rows[0], _plainPassword: data.password };
}

async function createTestCase() {
  const { rows } = await pool.query(
    `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
     VALUES ('P-001', 'Portal Case', 'Test Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident') RETURNING id`
  );
  return rows[0].id;
}

describe("POST /api/portal/auth/login", () => {
  it("should login client with valid credentials", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "portal@test.com" });
    const agent = supertest.agent(app);
    const res = await agent
      .post("/api/portal/auth/login")
      .send({ email: "portal@test.com", password: client._plainPassword });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Client");
    expect(res.body.caseId).toBe(caseId);
  });

  it("should return 401 for wrong password", async () => {
    const caseId = await createTestCase();
    await createClientUser(caseId, { email: "wrong-portal@test.com" });
    const res = await supertest(app)
      .post("/api/portal/auth/login")
      .send({ email: "wrong-portal@test.com", password: "WrongPass1!" });
    expect(res.status).toBe(401);
  });

  it("should return 401 for deactivated client", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, {
      email: "inactive@test.com",
      is_active: false,
    });
    const res = await supertest(app)
      .post("/api/portal/auth/login")
      .send({ email: "inactive@test.com", password: client._plainPassword });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/deactivated/i);
  });
});

describe("GET /api/portal/auth/me", () => {
  it("should return client info when authenticated", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "me-portal@test.com" });
    const agent = supertest.agent(app);
    await agent
      .post("/api/portal/auth/login")
      .send({ email: "me-portal@test.com", password: client._plainPassword });
    const res = await agent.get("/api/portal/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me-portal@test.com");
  });

  it("should return 401 when not authenticated", async () => {
    const res = await supertest(app).get("/api/portal/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/portal/auth/logout", () => {
  it("should clear client session", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "logout-portal@test.com" });
    const agent = supertest.agent(app);
    await agent
      .post("/api/portal/auth/login")
      .send({ email: "logout-portal@test.com", password: client._plainPassword });
    const logoutRes = await agent.post("/api/portal/auth/logout");
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get("/api/portal/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("Session isolation — client cannot access firm routes", () => {
  it("client session should not grant access to /api/auth/me", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "isolated@test.com" });
    const agent = supertest.agent(app);
    await agent
      .post("/api/portal/auth/login")
      .send({ email: "isolated@test.com", password: client._plainPassword });

    const firmRes = await agent.get("/api/auth/me");
    expect(firmRes.status).toBe(401);
  });

  it("client session should not grant access to /api/cases", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "isolated2@test.com" });
    const agent = supertest.agent(app);
    await agent
      .post("/api/portal/auth/login")
      .send({ email: "isolated2@test.com", password: client._plainPassword });

    const casesRes = await agent.get("/api/cases");
    expect(casesRes.status).toBe(401);
  });
});

describe("POST /api/portal/auth/change-password", () => {
  it("should change client password", async () => {
    const caseId = await createTestCase();
    const client = await createClientUser(caseId, { email: "chpw@test.com" });
    const agent = supertest.agent(app);
    await agent
      .post("/api/portal/auth/login")
      .send({ email: "chpw@test.com", password: client._plainPassword });

    const res = await agent
      .post("/api/portal/auth/change-password")
      .send({ currentPassword: client._plainPassword, newPassword: "NewClient1!" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
