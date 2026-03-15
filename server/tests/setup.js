const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("../db");
const { execSync } = require("child_process");
const path = require("path");

function createTestApp() {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  app.use(session({
    store: new pgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: "test-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    name: "lextrack.sid",
  }));

  app.use("/api/auth", require("../routes/auth"));
  app.use("/api/cases", require("../routes/cases"));
  app.use("/api/permissions", require("../routes/permissions"));
  app.use("/api/inbound-email", require("../routes/inbound-email"));
  app.use("/api/portal/auth", require("../routes/portal-auth"));
  app.use("/api/external", require("../routes/external"));
  app.use("/api/task-flows", require("../routes/task-flows"));

  return app;
}

async function setupTestDB() {
  execSync("node schema.js", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
    timeout: 30000,
  });
}

async function cleanTestData() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isCI = process.env.NODE_ENV === "test" || process.env.CI === "true";
  const isReplit = !!process.env.REPL_ID;
  if (!isCI && !isReplit) {
    throw new Error("SAFETY: cleanTestData refused to run — set NODE_ENV=test or run on Replit/CI");
  }
  await pool.query(`
    TRUNCATE
      task_flow_executions, custom_task_flow_steps, custom_task_flows,
      permissions, tasks, case_documents, case_filings, case_voicemails,
      case_correspondence, case_transcripts, case_activity, deadlines,
      case_notes, case_parties, case_experts, case_misc_contacts,
      case_insurance_policies, case_medical_treatments, case_liens,
      case_damages, case_negotiations, time_entries, unmatched_filings_emails,
      client_users, cases, contacts, doc_templates, custom_reports,
      custom_dashboard_widgets, custom_agents, ai_training, calendar_feeds,
      chat_typing, chat_channel_members, chat_channels, chat_groups,
      sms_configs, jury_analyses, linked_cases, case_expenses,
      user_sessions, users
    CASCADE
  `);
}

let testUserIdCounter = 9000;

async function createTestUser(overrides = {}) {
  const bcrypt = require("bcryptjs");
  const userId = overrides.id || ++testUserIdCounter;
  const defaults = {
    name: "Test User",
    email: `test-${Date.now()}-${userId}@test.com`,
    role: "Attorney",
    roles: ["Attorney"],
    password: "TestPass1!",
  };
  const data = { ...defaults, ...overrides };
  const hash = await bcrypt.hash(data.password, 4);
  const { rows } = await pool.query(
    `INSERT INTO users (id, name, email, role, roles, password_hash, initials, must_change_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE) RETURNING *`,
    [userId, data.name, data.email, data.role, data.roles, hash, data.name.substring(0, 2).toUpperCase()]
  );
  return { ...rows[0], _plainPassword: data.password };
}

async function loginAgent(agent, email, password) {
  const res = await agent
    .post("/api/auth/login")
    .send({ email, password });
  return res;
}

async function createAuthenticatedAgent(app, userOverrides = {}) {
  const supertest = require("supertest");
  const user = await createTestUser(userOverrides);
  const agent = supertest.agent(app);
  await loginAgent(agent, user.email, user._plainPassword);
  return { agent, user };
}

module.exports = {
  createTestApp,
  setupTestDB,
  cleanTestData,
  createTestUser,
  loginAgent,
  createAuthenticatedAgent,
  pool,
};
