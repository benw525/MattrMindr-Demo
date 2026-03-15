const { createTestApp, setupTestDB, cleanTestData, createAuthenticatedAgent, pool } = require("./setup");

let app;

beforeAll(async () => {
  await setupTestDB();
  app = createTestApp();
}, 30000);

beforeEach(async () => {
  await cleanTestData();
}, 10000);


describe("GET /api/task-flows", () => {
  it("should return empty list initially", async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get("/api/task-flows");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/task-flows", () => {
  it("should require admin role", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "Attorney", roles: ["Attorney"] });
    const res = await agent.post("/api/task-flows").send({
      name: "Test Flow",
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
    });
    expect(res.status).toBe(403);
  });

  it("should create a task flow as admin", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/task-flows").send({
      name: "New Case Flow",
      description: "Triggered on new case",
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
      triggerOn: "create",
      steps: [
        { title: "Initial Review", assignedRole: "Attorney", dueInDays: 3, priority: "High" },
        { title: "Client Contact", assignedRole: "Case Manager", dueInDays: 1, priority: "Medium" },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Case Flow");
    expect(res.body.steps.length).toBe(2);
    expect(res.body.steps[0].title).toBe("Initial Review");
  });

  it("should reject missing name", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.post("/api/task-flows").send({
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
    });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/task-flows/:id", () => {
  it("should update an existing flow", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const createRes = await agent.post("/api/task-flows").send({
      name: "Original",
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
      steps: [{ title: "Step 1", priority: "Low" }],
    });
    const flowId = createRes.body.id;

    const res = await agent.put(`/api/task-flows/${flowId}`).send({
      name: "Updated Flow",
      triggerCondition: { field: "stage", operator: "equals", value: "Litigation" },
      steps: [
        { title: "Updated Step", priority: "High", dueInDays: 5 },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Flow");
    expect(res.body.steps.length).toBe(1);
    expect(res.body.steps[0].title).toBe("Updated Step");
  });
});

describe("DELETE /api/task-flows/:id", () => {
  it("should delete a flow", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const createRes = await agent.post("/api/task-flows").send({
      name: "Delete Me",
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
    });
    const res = await agent.delete(`/api/task-flows/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should return 404 for non-existent flow", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });
    const res = await agent.delete("/api/task-flows/99999");
    expect(res.status).toBe(404);
  });
});

describe("evaluateFlowsForCase — trigger evaluation", () => {
  it("should trigger flow tasks when condition matches on case create", async () => {
    const { agent } = await createAuthenticatedAgent(app, { role: "App Admin", roles: ["App Admin"] });

    await agent.post("/api/task-flows").send({
      name: "Auto-Trigger Flow",
      triggerCondition: { field: "status", operator: "equals", value: "Active" },
      triggerOn: "create",
      isActive: true,
      steps: [
        { title: "Auto-Generated Task", assignedRole: "Attorney", dueInDays: 7, priority: "High" },
      ],
    });

    const caseRes = await agent.post("/api/cases").send({
      title: "Flow Trigger Case",
      status: "Active",
    });
    expect(caseRes.status).toBe(201);

    await new Promise(r => setTimeout(r, 2000));

    const { rows: tasks } = await pool.query(
      "SELECT * FROM tasks WHERE case_id = $1 AND is_generated = true AND title = 'Auto-Generated Task'",
      [caseRes.body.id]
    );
    expect(tasks.length).toBe(1);
    expect(tasks[0].priority).toBe("High");
  });
});
