const pool = require("../db");
const { upsertCaseEmbedding, buildCaseSummaryText } = require("../utils/embeddings");

const BATCH_SIZE = 10;
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillCases() {
  const { rows: cases } = await pool.query(
    "SELECT * FROM cases WHERE deleted_at IS NULL ORDER BY id"
  );
  console.log(`Found ${cases.length} cases to embed`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < cases.length; i += BATCH_SIZE) {
    const batch = cases.slice(i, i + BATCH_SIZE);
    for (const c of batch) {
      try {
        const text = buildCaseSummaryText(c);
        if (text.trim()) {
          await upsertCaseEmbedding(c.id, "case_summary", text);
          success++;
        }
      } catch (err) {
        console.error(`Failed to embed case ${c.id}:`, err.message);
        failed++;
      }
    }
    console.log(`Cases: ${Math.min(i + BATCH_SIZE, cases.length)}/${cases.length} processed (${success} ok, ${failed} failed)`);
    if (i + BATCH_SIZE < cases.length) await sleep(DELAY_MS);
  }

  return { success, failed };
}

async function backfillNotes() {
  const { rows: notes } = await pool.query(
    "SELECT id, case_id, body, type FROM case_notes WHERE deleted_at IS NULL AND case_id IS NOT NULL ORDER BY id"
  );
  console.log(`Found ${notes.length} notes to embed`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const batch = notes.slice(i, i + BATCH_SIZE);
    for (const n of batch) {
      try {
        const text = `Note (${n.type}): ${n.body || ""}`;
        if (text.trim().length > 10) {
          await upsertCaseEmbedding(n.case_id, "note", text, n.id);
          success++;
        }
      } catch (err) {
        console.error(`Failed to embed note ${n.id}:`, err.message);
        failed++;
      }
    }
    console.log(`Notes: ${Math.min(i + BATCH_SIZE, notes.length)}/${notes.length} processed (${success} ok, ${failed} failed)`);
    if (i + BATCH_SIZE < notes.length) await sleep(DELAY_MS);
  }

  return { success, failed };
}

async function backfillDocuments() {
  const { rows: docs } = await pool.query(
    "SELECT id, case_id, filename, extracted_text, doc_type FROM case_documents WHERE deleted_at IS NULL AND extracted_text IS NOT NULL AND extracted_text != '' ORDER BY id"
  );
  console.log(`Found ${docs.length} documents with text to embed`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    for (const d of batch) {
      try {
        const text = `Document: ${d.filename} (${d.doc_type || "Other"})\n${(d.extracted_text || "").substring(0, 6000)}`;
        if (text.trim().length > 20) {
          await upsertCaseEmbedding(d.case_id, "document", text, d.id);
          success++;
        }
      } catch (err) {
        console.error(`Failed to embed document ${d.id}:`, err.message);
        failed++;
      }
    }
    console.log(`Documents: ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length} processed (${success} ok, ${failed} failed)`);
    if (i + BATCH_SIZE < docs.length) await sleep(DELAY_MS);
  }

  return { success, failed };
}

async function backfillTranscripts() {
  const { rows: transcripts } = await pool.query(
    "SELECT id, case_id, filename, transcript FROM case_transcripts WHERE deleted_at IS NULL AND status = 'completed' ORDER BY id"
  );
  console.log(`Found ${transcripts.length} transcripts to embed`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < transcripts.length; i += BATCH_SIZE) {
    const batch = transcripts.slice(i, i + BATCH_SIZE);
    for (const t of batch) {
      try {
        const segments = Array.isArray(t.transcript) ? t.transcript : [];
        const transcriptText = segments.map(s => s.text).join(" ").substring(0, 6000);
        const text = `Transcript: ${t.filename}\n${transcriptText}`;
        if (text.trim().length > 20) {
          await upsertCaseEmbedding(t.case_id, "transcript", text, t.id);
          success++;
        }
      } catch (err) {
        console.error(`Failed to embed transcript ${t.id}:`, err.message);
        failed++;
      }
    }
    console.log(`Transcripts: ${Math.min(i + BATCH_SIZE, transcripts.length)}/${transcripts.length} processed (${success} ok, ${failed} failed)`);
    if (i + BATCH_SIZE < transcripts.length) await sleep(DELAY_MS);
  }

  return { success, failed };
}

async function main() {
  console.log("Starting embedding backfill...\n");

  const caseResult = await backfillCases();
  console.log(`\nCases complete: ${caseResult.success} embedded, ${caseResult.failed} failed\n`);

  const noteResult = await backfillNotes();
  console.log(`\nNotes complete: ${noteResult.success} embedded, ${noteResult.failed} failed\n`);

  const docResult = await backfillDocuments();
  console.log(`\nDocuments complete: ${docResult.success} embedded, ${docResult.failed} failed\n`);

  const transcriptResult = await backfillTranscripts();
  console.log(`\nTranscripts complete: ${transcriptResult.success} embedded, ${transcriptResult.failed} failed\n`);

  const { rows: countRows } = await pool.query("SELECT COUNT(*) as total FROM case_embeddings");
  console.log(`\nBackfill complete! Total embeddings in database: ${countRows[0].total}`);

  await pool.end();
}

main().catch(err => {
  console.error("Backfill failed:", err);
  pool.end().then(() => process.exit(1));
});
