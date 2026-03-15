const supertest = require("supertest");
const { createTestApp, setupTestDB, cleanTestData, createTestUser, createAuthenticatedAgent, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


describe("GET /api/cases", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await supertest(app).get("/api/cases");
    expect(res.status).toBe(401);
  });

  it("should return empty list when no cases exist", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/cases");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return created cases", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    await agent.post("/api/cases").send({ title: "Smith v. Jones" });
    const res = await agent.get("/api/cases");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Smith v. Jones");
  });
});

describe("POST /api/cases", () => {
  it("should create a case with required fields", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.post("/api/cases").send({
      title: "New Case",
      clientName: "John Doe",
      caseType: "Auto Accident",
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New Case");
    expect(res.body.clientName).toBe("John Doe");
    expect(res.body.id).toBeDefined();
  });

  it("should reject missing title", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.post("/api/cases").send({ clientName: "No Title" });
    expect(res.status).toBe(400);
  });

  it("should reject invalid caseType", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.post("/api/cases").send({
      title: "Bad Type",
      caseType: "InvalidType",
    });
    expect(res.status).toBe(400);
  });

  it("should reject invalid status enum", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.post("/api/cases").send({
      title: "Bad Status",
      status: "FakeStatus",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/cases/:id", () => {
  it("should return a single case", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const createRes = await agent.post("/api/cases").send({ title: "Detail Case" });
    const res = await agent.get(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Detail Case");
  });

  it("should return 404 for non-existent case", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/cases/99999");
    expect(res.status).toBe(404);
  });

  it("should return 400 for non-numeric id", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/cases/abc");
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/cases/:id", () => {
  it("should update case fields", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const createRes = await agent.post("/api/cases").send({ title: "Original" });
    const res = await agent.put(`/api/cases/${createRes.body.id}`).send({
      title: "Updated Title",
      status: "Settlement",
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
    expect(res.body.status).toBe("Settlement");
  });

  it("should return 404 for non-existent case", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.put("/api/cases/99999").send({ title: "No Exist" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/cases/:id", () => {
  it("should soft-delete a case (management role required)", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const createRes = await agent.post("/api/cases").send({ title: "Delete Me" });
    const res = await agent.delete(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.deletedAt).toBeTruthy();
  });

  it("should return 403 for non-management role", async () => {
    const { agent: mgrAgent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const createRes = await mgrAgent.post("/api/cases").send({ title: "Protected" });

    const { agent: attAgent } = await createAuthenticatedAgent(app, {
      role: "Attorney",
      roles: ["Attorney"],
    });
    const res = await attAgent.delete(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(403);
  });

  it("should return 404 for already deleted case", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const createRes = await agent.post("/api/cases").send({ title: "Delete Twice" });
    await agent.delete(`/api/cases/${createRes.body.id}`);
    const res = await agent.delete(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/cases/:id/restore", () => {
  it("should restore a soft-deleted case", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const createRes = await agent.post("/api/cases").send({ title: "Restore Me" });
    await agent.delete(`/api/cases/${createRes.body.id}`);
    const res = await agent.post(`/api/cases/${createRes.body.id}/restore`);
    expect(res.status).toBe(200);
    expect(res.body.deletedAt).toBeNull();
  });
});

describe("GET /api/cases/conflict-check", () => {
  it("should find matching cases by client name", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    await agent.post("/api/cases").send({ title: "Johnson Case", clientName: "Johnson" });
    const res = await agent.get("/api/cases/conflict-check?name=Johnson");
    expect(res.status).toBe(200);
    expect(res.body.cases.length).toBeGreaterThan(0);
  });

  it("should return empty for short query", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/cases/conflict-check?name=J");
    expect(res.status).toBe(200);
    expect(res.body.cases).toEqual([]);
  });
});

describe("Confidential cases", () => {
  it("should deny access to confidential case for non-assigned user", async () => {
    const { agent: adminAgent, user: admin } = await createAuthenticatedAgent(app, {
      role: "App Admin",
      roles: ["App Admin"],
    });
    const createRes = await adminAgent.post("/api/cases").send({
      title: "Secret Case",
      confidential: true,
    });
    const caseId = createRes.body.id;

    const { agent: otherAgent } = await createAuthenticatedAgent(app, {
      role: "Attorney",
      roles: ["Attorney"],
    });
    const res = await otherAgent.get(`/api/cases/${caseId}`);
    expect(res.status).toBe(403);
  });

  it("should allow App Admin to access confidential case", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "App Admin",
      roles: ["App Admin"],
    });
    const createRes = await agent.post("/api/cases").send({
      title: "Admin Secret",
      confidential: true,
    });
    const res = await agent.get(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/cases?deleted=true", () => {
  it("should list soft-deleted cases", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const c = await agent.post("/api/cases").send({ title: "To Delete" });
    await agent.delete(`/api/cases/${c.body.id}`);
    const res = await agent.get("/api/cases?deleted=true");
    expect(res.status).toBe(200);
    expect(res.body.some(x => x.id === c.body.id)).toBe(true);
  });
});

describe("GET /api/cases?includeDeleted=true", () => {
  it("should return both active and deleted cases", async () => {
    const { agent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    await agent.post("/api/cases").send({ title: "Active Case" });
    const c2 = await agent.post("/api/cases").send({ title: "Deleted Case" });
    await agent.delete(`/api/cases/${c2.body.id}`);
    const res = await agent.get("/api/cases?includeDeleted=true");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe("GET /api/cases/pinned", () => {
  it("should return empty array by default", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/cases/pinned");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("PUT /api/cases/pinned", () => {
  it("should save and return pinned case IDs", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const c = await agent.post("/api/cases").send({ title: "Pin Me" });
    const res = await agent.put("/api/cases/pinned").send({ pinnedIds: [c.body.id] });
    expect(res.status).toBe(200);
    expect(res.body).toContain(c.body.id);

    const getRes = await agent.get("/api/cases/pinned");
    expect(getRes.body).toContain(c.body.id);
  });

  it("should reject non-array pinnedIds", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.put("/api/cases/pinned").send({ pinnedIds: "notarray" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/cases/:id — litigation toggle", () => {
  it("should toggle in_litigation and reassign tasks", async () => {
    const { agent, user } = await createAuthenticatedAgent(app);
    const createRes = await agent.post("/api/cases").send({
      title: "Lit Toggle Case",
      assignedAttorney: user.id,
    });
    const caseId = createRes.body.id;

    const updateRes = await agent.put(`/api/cases/${caseId}`).send({
      title: "Lit Toggle Case",
      inLitigation: true,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.inLitigation).toBe(true);

    const revertRes = await agent.put(`/api/cases/${caseId}`).send({
      title: "Lit Toggle Case",
      inLitigation: false,
    });
    expect(revertRes.status).toBe(200);
    expect(revertRes.body.inLitigation).toBe(false);
  });
});

describe("PUT /api/cases/:id — confidential access", () => {
  it("should deny update to confidential case for non-assigned user", async () => {
    const { agent: adminAgent } = await createAuthenticatedAgent(app, {
      role: "App Admin",
      roles: ["App Admin"],
    });
    const createRes = await adminAgent.post("/api/cases").send({
      title: "Confidential Update",
      confidential: true,
    });

    const { agent: otherAgent } = await createAuthenticatedAgent(app, {
      role: "Attorney",
      roles: ["Attorney"],
    });
    const res = await otherAgent.put(`/api/cases/${createRes.body.id}`).send({
      title: "Hacked Title",
    });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/cases/:id — confidential access", () => {
  it("should deny delete of confidential case for non-assigned manager", async () => {
    const { agent: adminAgent } = await createAuthenticatedAgent(app, {
      role: "App Admin",
      roles: ["App Admin"],
    });
    const createRes = await adminAgent.post("/api/cases").send({
      title: "Conf Delete",
      confidential: true,
    });

    const { agent: mgrAgent } = await createAuthenticatedAgent(app, {
      role: "Managing Partner",
      roles: ["Managing Partner"],
    });
    const res = await mgrAgent.delete(`/api/cases/${createRes.body.id}`);
    expect(res.status).toBe(403);
  });
});
