#!/usr/bin/env node
const pool = require("../db");
const { isR2Configured, uploadToR2, headObject } = require("../r2");
const { randomUUID } = require("crypto");

const BATCH_SIZE = 100;
const TABLES = [
  {
    table: "case_documents",
    dataCol: "file_data",
    r2Col: "r2_file_key",
    keyPrefix: "documents",
    caseIdCol: "case_id",
    filenameCol: "filename",
    contentTypeCol: "content_type",
  },
  {
    table: "case_filings",
    dataCol: "file_data",
    r2Col: "r2_file_key",
    keyPrefix: "filings",
    caseIdCol: "case_id",
    filenameCol: "original_filename",
    contentTypeCol: "content_type",
  },
  {
    table: "case_voicemails",
    dataCol: "audio_data",
    r2Col: "r2_file_key",
    keyPrefix: "voicemails",
    caseIdCol: "case_id",
    filenameCol: null,
    contentTypeCol: "audio_mime",
  },
  {
    table: "doc_templates",
    dataCol: "docx_data",
    r2Col: "r2_file_key",
    keyPrefix: "templates",
    caseIdCol: null,
    filenameCol: "name",
    contentTypeCol: null,
  },
  {
    table: "medical_records",
    dataCol: "file_data",
    r2Col: "r2_file_key",
    keyPrefix: "medical-records",
    caseIdCol: "case_id",
    filenameCol: "filename",
    contentTypeCol: "mime_type",
  },
  {
    table: "trial_timeline_events",
    dataCol: "file_data",
    r2Col: "r2_file_key",
    keyPrefix: "demonstratives",
    caseIdCol: null,
    sessionIdCol: "trial_session_id",
    filenameCol: "file_name",
    contentTypeCol: "file_type",
  },
  {
    table: "case_transcripts",
    dataCol: "audio_data",
    r2Col: "r2_audio_key",
    keyPrefix: "transcripts",
    caseIdCol: "case_id",
    filenameCol: "filename",
    contentTypeCol: "content_type",
  },
  {
    table: "case_transcripts",
    dataCol: "video_data",
    r2Col: "r2_video_key",
    keyPrefix: "transcripts-video",
    caseIdCol: "case_id",
    filenameCol: "filename",
    contentTypeCol: "video_content_type",
  },
  {
    table: "custom_agents",
    dataCol: "instruction_file",
    r2Col: "r2_instruction_key",
    keyPrefix: "custom-agents",
    caseIdCol: null,
    filenameCol: "instruction_filename",
    contentTypeCol: null,
  },
  {
    table: "users",
    dataCol: "profile_picture",
    r2Col: "r2_profile_picture_key",
    keyPrefix: "profile-pictures",
    caseIdCol: null,
    filenameCol: null,
    contentTypeCol: "profile_picture_type",
  },
];

async function migrateTable(cfg) {
  const { table, dataCol, r2Col, keyPrefix, caseIdCol, filenameCol, contentTypeCol } = cfg;
  const sessionIdCol = cfg.sessionIdCol || null;

  const countRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM ${table} WHERE ${dataCol} IS NOT NULL AND ${r2Col} IS NULL`
  );
  const total = parseInt(countRes.rows[0].cnt, 10);
  if (total === 0) {
    console.log(`  ${table}: 0 rows to migrate — skipping`);
    return { table, migrated: 0, errors: 0 };
  }
  console.log(`  ${table}: ${total} rows to migrate`);

  let migrated = 0;
  let errors = 0;

  while (true) {
    let query;
    if (sessionIdCol) {
      query = `SELECT t.id, t.${dataCol}, ts.case_id` +
        (filenameCol ? `, t.${filenameCol}` : "") +
        (contentTypeCol ? `, t.${contentTypeCol}` : "") +
        ` FROM ${table} t JOIN trial_sessions ts ON ts.id = t.${sessionIdCol}
         WHERE t.${dataCol} IS NOT NULL AND t.${r2Col} IS NULL
         ORDER BY t.id LIMIT ${BATCH_SIZE}`;
    } else {
      const selectCols = ["id", dataCol];
      if (caseIdCol) selectCols.push(caseIdCol);
      if (filenameCol) selectCols.push(filenameCol);
      if (contentTypeCol) selectCols.push(contentTypeCol);
      query = `SELECT ${selectCols.join(", ")} FROM ${table}
         WHERE ${dataCol} IS NOT NULL AND ${r2Col} IS NULL
         ORDER BY id LIMIT ${BATCH_SIZE}`;
    }

    const { rows } = await pool.query(query);
    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        const caseId = caseIdCol ? row[caseIdCol] : (sessionIdCol ? row.case_id : null);
        const filename = filenameCol ? (row[filenameCol] || "file") : "file";
        const contentType = contentTypeCol ? (row[contentTypeCol] || "application/octet-stream") : "application/octet-stream";
        const buffer = row[dataCol];

        let key;
        if (table === "users") {
          key = `${keyPrefix}/${row.id}/${randomUUID()}`;
        } else if (table === "doc_templates" || table === "custom_agents") {
          key = `${keyPrefix}/${row.id}/${randomUUID()}/${filename}`;
        } else {
          key = `${keyPrefix}/${caseId}/${randomUUID()}/${filename}`;
        }

        await uploadToR2(key, buffer, contentType);

        const head = await headObject(key);
        if (!head || head.contentLength !== buffer.length) {
          throw new Error(`HEAD verification failed: expected ${buffer.length} bytes, got ${head ? head.contentLength : "null"}`);
        }

        await pool.query(
          `UPDATE ${table} SET ${r2Col} = $1, ${dataCol} = NULL WHERE id = $2`,
          [key, row.id]
        );

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`    ${table}: ${migrated}/${total} migrated...`);
        }
      } catch (err) {
        errors++;
        console.error(`    ${table} id=${row.id}: upload failed — ${err.message}`);
      }
    }
  }

  console.log(`  ${table}: done — ${migrated} migrated, ${errors} errors`);
  return { table, migrated, errors };
}

async function main() {
  if (!isR2Configured()) {
    console.error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.");
    process.exit(1);
  }

  console.log("=== BYTEA → R2 Migration ===\n");

  const results = [];
  for (const cfg of TABLES) {
    try {
      const result = await migrateTable(cfg);
      results.push(result);
    } catch (err) {
      console.error(`  ${cfg.table}: FATAL — ${err.message}`);
      results.push({ table: cfg.table, migrated: 0, errors: -1 });
    }
  }

  console.log("\n=== Summary ===");
  let totalMigrated = 0;
  let totalErrors = 0;
  for (const r of results) {
    console.log(`  ${r.table}: ${r.migrated} migrated, ${r.errors} errors`);
    totalMigrated += r.migrated;
    totalErrors += Math.max(r.errors, 0);
  }
  console.log(`\nTotal: ${totalMigrated} files migrated, ${totalErrors} errors`);

  await pool.end();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
