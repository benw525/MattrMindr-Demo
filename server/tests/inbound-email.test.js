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


describe("POST /api/inbound-email — case-ID routing", () => {
  it("should store correspondence for valid case-ID email", async () => {
    const { rows } = await pool.query(
      `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
       VALUES ('C-001', 'Test Case', 'Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident') RETURNING id`
    );
    const caseId = rows[0].id;

    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", `case-${caseId}@mattrmindr.com`)
      .field("from", "sender@example.com")
      .field("subject", "Test Email")
      .field("text", "Hello World");
    expect(res.status).toBe(200);

    const { rows: corrs } = await pool.query(
      "SELECT * FROM case_correspondence WHERE case_id = $1", [caseId]
    );
    expect(corrs.length).toBe(1);
    expect(corrs[0].subject).toBe("Test Email");
    expect(corrs[0].from_email).toBe("sender@example.com");
  });

  it("should return 200 OK for unrecognized email address (no case match)", async () => {
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", "random@mattrmindr.com")
      .field("from", "sender@example.com")
      .field("subject", "Unknown")
      .field("text", "body");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/inbound-email — filings routing", () => {
  it("should store as unmatched filing when no case matches court number", async () => {
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", "filings@mattrmindr.com")
      .field("from", "court@example.com")
      .field("subject", "Filing 1-CV-2024-12345")
      .field("text", "Court document");
    expect(res.status).toBe(200);

    const { rows } = await pool.query("SELECT * FROM unmatched_filings_emails WHERE court_case_number = '1-CV-2024-12345'");
    expect(rows.length).toBe(1);
  });

  it("should match filing to case by court_case_number", async () => {
    await pool.query(
      `INSERT INTO cases (case_num, title, client_name, court_case_number, status, stage, case_type, type)
       VALUES ('C-100', 'Court Case', 'Client', '2-AB-2024-999', 'Active', 'Intake', 'Auto Accident', 'Auto Accident')`
    );

    const pdfBuffer = Buffer.from("%PDF-1.4 test content");
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", "filings@mattrmindr.com")
      .field("from", "court@example.com")
      .field("subject", "Filing 2-AB-2024-999")
      .field("text", "")
      .attach("attachment1", pdfBuffer, { filename: "order.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/inbound-email — voicemail detection", () => {
  it("should detect voicemail from subject", async () => {
    const { rows } = await pool.query(
      `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
       VALUES ('C-VM', 'VM Case', 'Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident') RETURNING id`
    );
    const caseId = rows[0].id;

    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", `case-${caseId}@mattrmindr.com`)
      .field("from", "voicemail@example.com")
      .field("subject", "New Voice Message from 555-1234")
      .field("text", "Voicemail transcript");
    expect(res.status).toBe(200);

    const { rows: corrs } = await pool.query(
      "SELECT * FROM case_correspondence WHERE case_id = $1", [caseId]
    );
    expect(corrs[0].is_voicemail).toBe(true);
  });
});

describe("POST /api/inbound-email — attachments", () => {
  it("should store attachment metadata with correspondence", async () => {
    const { rows } = await pool.query(
      `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
       VALUES ('C-ATT', 'Attach Case', 'Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident') RETURNING id`
    );
    const caseId = rows[0].id;

    const pdfBuffer = Buffer.from("%PDF-1.4 test attachment");
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", `case-${caseId}@mattrmindr.com`)
      .field("from", "docs@example.com")
      .field("subject", "Documents Attached")
      .field("text", "Please see attached")
      .attach("attachment1", pdfBuffer, { filename: "contract.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);

    const { rows: corrs } = await pool.query(
      "SELECT * FROM case_correspondence WHERE case_id = $1", [caseId]
    );
    expect(corrs.length).toBe(1);
    expect(corrs[0].subject).toBe("Documents Attached");
  });

  it("should handle multiple attachments", async () => {
    const { rows } = await pool.query(
      `INSERT INTO cases (case_num, title, client_name, status, stage, case_type, type)
       VALUES ('C-MULTI', 'Multi Attach', 'Client', 'Active', 'Intake', 'Auto Accident', 'Auto Accident') RETURNING id`
    );
    const caseId = rows[0].id;

    const pdf1 = Buffer.from("%PDF-1.4 file one");
    const pdf2 = Buffer.from("%PDF-1.4 file two");
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", `case-${caseId}@mattrmindr.com`)
      .field("from", "multi@example.com")
      .field("subject", "Multiple Files")
      .field("text", "Two files")
      .attach("attachment1", pdf1, { filename: "file1.pdf", contentType: "application/pdf" })
      .attach("attachment2", pdf2, { filename: "file2.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/inbound-email — non-existent case", () => {
  it("should gracefully handle non-existent case ID", async () => {
    const res = await supertest(app)
      .post("/api/inbound-email")
      .field("to", "case-999999@mattrmindr.com")
      .field("from", "sender@example.com")
      .field("subject", "Test")
      .field("text", "body");
    expect(res.status).toBe(200);
  });
});
