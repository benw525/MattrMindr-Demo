const supertest = require("supertest");
const { createTestApp, setupTestDB, cleanTestData, createTestUser, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


describe("POST /api/external/auth/login", () => {
  it("should return JWT token for valid credentials", async () => {
    await createTestUser({ email: "ext@test.com", password: "ExtPass1!" });
    const res = await supertest(app)
      .post("/api/external/auth/login")
      .send({ email: "ext@test.com", password: "ExtPass1!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("ext@test.com");
  });

  it("should return 401 for wrong password", async () => {
    await createTestUser({ email: "ext2@test.com", password: "ExtPass1!" });
    const res = await supertest(app)
      .post("/api/external/auth/login")
      .send({ email: "ext2@test.com", password: "Wrong1!" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/external/auth/verify", () => {
  it("should verify a valid token", async () => {
    await createTestUser({ email: "verify@test.com", password: "VerPass1!" });
    const loginRes = await supertest(app)
      .post("/api/external/auth/login")
      .send({ email: "verify@test.com", password: "VerPass1!" });
    const token = loginRes.body.token;

    const res = await supertest(app)
      .post("/api/external/auth/verify")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("should reject missing Authorization header", async () => {
    const res = await supertest(app).post("/api/external/auth/verify");
    expect(res.status).toBe(401);
  });

  it("should reject invalid token", async () => {
    const res = await supertest(app)
      .post("/api/external/auth/verify")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/external/cases", () => {
  it("should return cases for authenticated user", async () => {
    const user = await createTestUser({ email: "extcases@test.com", password: "ExtPass1!", role: "App Admin", roles: ["App Admin"] });
    await pool.query(
      `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
       VALUES ('E-001', 'External Case', 'Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident')`
    );

    const loginRes = await supertest(app)
      .post("/api/external/auth/login")
      .send({ email: "extcases@test.com", password: "ExtPass1!" });

    const res = await supertest(app)
      .get("/api/external/cases")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.cases.length).toBeGreaterThan(0);
  });

  it("should return 401 without token", async () => {
    const res = await supertest(app).get("/api/external/cases");
    expect(res.status).toBe(401);
  });
});
