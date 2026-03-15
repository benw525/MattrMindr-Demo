const supertest = require("supertest");
const { createTestApp, setupTestDB, cleanTestData, createAuthenticatedAgent, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


describe("GET /api/permissions/keys", () => {
  it("should return 403 for non-admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "Attorney", roles: ["Attorney"] });
    const res = await agent.get("/api/permissions/keys");
    expect(res.status).toBe(403);
  });

  it("should return permission keys for admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.get("/api/permissions/keys");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("key");
    expect(res.body[0]).toHaveProperty("category");
  });
});

describe("GET /api/permissions", () => {
  it("should require admin access", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "Paralegal", roles: ["Paralegal"] });
    const res = await agent.get("/api/permissions");
    expect(res.status).toBe(403);
  });

  it("should return permissions list for admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.get("/api/permissions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /api/permissions", () => {
  it("should create a permission", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/permissions").send({
      permission_key: "view_cases",
      target_type: "role",
      target_value: "Paralegal",
      granted: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.permission_key).toBe("view_cases");
    expect(res.body.granted).toBe(true);
  });

  it("should reject invalid permission_key", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/permissions").send({
      permission_key: "fake_permission",
      target_type: "role",
      target_value: "Attorney",
    });
    expect(res.status).toBe(400);
  });

  it("should reject invalid target_type", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/permissions").send({
      permission_key: "view_cases",
      target_type: "group",
      target_value: "team-1",
    });
    expect(res.status).toBe(400);
  });

  it("should reject missing fields", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/permissions").send({ permission_key: "view_cases" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/permissions/check", () => {
  it("should return isAdmin true for App Admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.get("/api/permissions/check");
    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);
  });

  it("should return permissions map for non-admin", async () => {
    const { agent, user } = await createAuthenticatedAgent(app, { role: "Paralegal", roles: ["Paralegal"] });

    const { agent: adminAgent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    await adminAgent.post("/api/permissions").send({
      permission_key: "view_cases",
      target_type: "role",
      target_value: "Paralegal",
      granted: true,
    });

    const res = await agent.get("/api/permissions/check");
    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(false);
    expect(res.body.permissions.view_cases).toBe(true);
  });

  it("should respect user-level overrides over role permissions", async () => {
    const { agent: adminAgent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const { agent, user } = await createAuthenticatedAgent(app, { role: "Attorney", roles: ["Attorney"] });

    await adminAgent.post("/api/permissions").send({
      permission_key: "delete_cases",
      target_type: "role",
      target_value: "Attorney",
      granted: true,
    });
    await adminAgent.post("/api/permissions").send({
      permission_key: "delete_cases",
      target_type: "user",
      target_value: String(user.id),
      granted: false,
    });

    const res = await agent.get("/api/permissions/check");
    expect(res.body.permissions.delete_cases).toBe(false);
  });
});

describe("DELETE /api/permissions/:id", () => {
  it("should delete a permission", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const createRes = await agent.post("/api/permissions").send({
      permission_key: "view_contacts",
      target_type: "role",
      target_value: "Paralegal",
    });
    const res = await agent.delete(`/api/permissions/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should return 404 for non-existent permission", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.delete("/api/permissions/99999");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/permissions/bulk", () => {
  it("should create multiple permissions at once", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/permissions/bulk").send({
      permissions: [
        { permission_key: "view_cases", target_type: "role", target_value: "Paralegal", granted: true },
        { permission_key: "view_contacts", target_type: "role", target_value: "Paralegal", granted: true },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});
