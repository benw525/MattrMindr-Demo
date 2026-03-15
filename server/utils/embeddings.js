const pool = require("../db");
const openai = require("./openai");

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_TEXT_LENGTH = 8000;
const DEBOUNCE_MS = 2000;
const MAX_QUEUE_SIZE = 100;

const embeddingQueue = new Map();
let flushTimer = null;

async function embedText(text) {
  if (!text || !text.trim()) return null;
  const truncated = text.substring(0, MAX_TEXT_LENGTH);
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncated,
      store: false,
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("Embedding generation error:", err.message);
    return null;
  }
}

function buildCaseSummaryText(caseRow) {
  const parts = [];
  if (caseRow.title) parts.push(`Title: ${caseRow.title}`);
  if (caseRow.case_num) parts.push(`Case#: ${caseRow.case_num}`);
  if (caseRow.client_name) parts.push(`Client: ${caseRow.client_name}`);
  if (caseRow.type) parts.push(`Type: ${caseRow.type}`);
  if (caseRow.status) parts.push(`Status: ${caseRow.status}`);
  if (caseRow.stage) parts.push(`Stage: ${caseRow.stage}`);
  if (caseRow.county) parts.push(`County: ${caseRow.county}`);
  if (caseRow.court) parts.push(`Court: ${caseRow.court}`);
  if (caseRow.state_jurisdiction) parts.push(`State: ${caseRow.state_jurisdiction}`);
  if (caseRow.injury_type) parts.push(`Injury: ${caseRow.injury_type}`);
  if (caseRow.injury_description) parts.push(`Injury Description: ${caseRow.injury_description}`);
  if (caseRow.incident_description) parts.push(`Incident: ${caseRow.incident_description}`);
  if (caseRow.incident_location) parts.push(`Location: ${caseRow.incident_location}`);
  if (caseRow.liability_assessment) parts.push(`Liability: ${caseRow.liability_assessment}`);
  if (caseRow.judge) parts.push(`Judge: ${caseRow.judge}`);
  if (caseRow.disposition_type) parts.push(`Disposition: ${caseRow.disposition_type}`);
  if (caseRow.referring_attorney) parts.push(`Referring Attorney: ${caseRow.referring_attorney}`);
  if (caseRow.referral_source) parts.push(`Referral: ${caseRow.referral_source}`);
  if (caseRow.police_report_number) parts.push(`Police Report: ${caseRow.police_report_number}`);
  if (caseRow.weather_conditions) parts.push(`Weather: ${caseRow.weather_conditions}`);
  if (caseRow.case_value_estimate) parts.push(`Estimated Value: $${caseRow.case_value_estimate}`);
  if (caseRow.settlement_amount) parts.push(`Settlement: $${caseRow.settlement_amount}`);
  if (caseRow.demand_amount) parts.push(`Demand: $${caseRow.demand_amount}`);
  if (caseRow.accident_date) {
    const d = caseRow.accident_date instanceof Date ? caseRow.accident_date.toISOString().split("T")[0] : caseRow.accident_date;
    parts.push(`Accident Date: ${d}`);
  }
  if (caseRow.court_case_number) parts.push(`Court Case#: ${caseRow.court_case_number}`);
  if (caseRow.client_address) parts.push(`Client Address: ${caseRow.client_address}`);
  if (caseRow.client_email) parts.push(`Client Email: ${caseRow.client_email}`);

  const customFields = Array.isArray(caseRow.custom_fields) ? caseRow.custom_fields : [];
  for (const cf of customFields.slice(0, 5)) {
    if (cf.value) parts.push(`${cf.label}: ${cf.value}`);
  }

  return parts.join("\n");
}

async function upsertCaseEmbedding(caseId, contentType, text, sourceId = null) {
  const embedding = await embedText(text);
  if (!embedding) return;

  const preview = text.substring(0, 300);
  const vectorStr = `[${embedding.join(",")}]`;

  await pool.query(
    `INSERT INTO case_embeddings (case_id, content_type, content_preview, embedding, source_id, updated_at)
     VALUES ($1, $2, $3, $4::vector, $5, NOW())
     ON CONFLICT (case_id, content_type, source_id)
     DO UPDATE SET content_preview = EXCLUDED.content_preview, embedding = EXCLUDED.embedding, updated_at = NOW()`,
    [caseId, contentType, preview, vectorStr, sourceId]
  );
}

async function removeCaseEmbeddings(caseId, contentType = null, sourceId = null) {
  if (contentType && sourceId !== null) {
    await pool.query(
      "DELETE FROM case_embeddings WHERE case_id = $1 AND content_type = $2 AND source_id = $3",
      [caseId, contentType, sourceId]
    );
  } else if (contentType) {
    await pool.query(
      "DELETE FROM case_embeddings WHERE case_id = $1 AND content_type = $2",
      [caseId, contentType]
    );
  } else {
    await pool.query("DELETE FROM case_embeddings WHERE case_id = $1", [caseId]);
  }
}

async function vectorSearch(queryText, limit = 20) {
  const embedding = await embedText(queryText);
  if (!embedding) return [];

  const vectorStr = `[${embedding.join(",")}]`;
  const { rows } = await pool.query(
    `SELECT ce.case_id, ce.content_type, ce.content_preview, ce.source_id,
            1 - (ce.embedding <=> $1::vector) as similarity
     FROM case_embeddings ce
     JOIN cases c ON ce.case_id = c.id
     WHERE c.deleted_at IS NULL AND c.confidential = FALSE
     ORDER BY ce.embedding <=> $1::vector
     LIMIT $2`,
    [vectorStr, limit * 3]
  );

  const caseMap = new Map();
  for (const row of rows) {
    if (!caseMap.has(row.case_id)) {
      caseMap.set(row.case_id, {
        caseId: row.case_id,
        maxSimilarity: row.similarity,
        matches: [],
      });
    }
    const entry = caseMap.get(row.case_id);
    if (row.similarity > entry.maxSimilarity) {
      entry.maxSimilarity = row.similarity;
    }
    entry.matches.push({
      contentType: row.content_type,
      preview: row.content_preview,
      similarity: row.similarity,
      sourceId: row.source_id,
    });
  }

  return Array.from(caseMap.values())
    .sort((a, b) => b.maxSimilarity - a.maxSimilarity)
    .slice(0, limit);
}

function queueEmbeddingUpdate(caseId, contentType, sourceId = null) {
  const key = `${caseId}:${contentType}:${sourceId || "null"}`;
  embeddingQueue.set(key, { caseId, contentType, sourceId });

  if (embeddingQueue.size > MAX_QUEUE_SIZE) {
    processQueue();
    return;
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => processQueue(), DEBOUNCE_MS);
}

async function processQueue() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const items = Array.from(embeddingQueue.values());
  embeddingQueue.clear();

  for (const item of items) {
    try {
      await processEmbeddingItem(item);
    } catch (err) {
      console.error(`Embedding update failed for case ${item.caseId}/${item.contentType}:`, err.message);
    }
  }
}

async function processEmbeddingItem(item) {
  const { caseId, contentType, sourceId } = item;

  if (contentType === "case_summary") {
    const { rows } = await pool.query("SELECT * FROM cases WHERE id = $1 AND deleted_at IS NULL", [caseId]);
    if (!rows.length) {
      await removeCaseEmbeddings(caseId, "case_summary");
      return;
    }
    const text = buildCaseSummaryText(rows[0]);
    if (text.trim()) {
      await upsertCaseEmbedding(caseId, "case_summary", text);
    } else {
      await removeCaseEmbeddings(caseId, "case_summary");
    }
  } else if (contentType === "note") {
    const { rows } = await pool.query(
      "SELECT id, body, type FROM case_notes WHERE id = $1 AND deleted_at IS NULL",
      [sourceId]
    );
    if (!rows.length) {
      await removeCaseEmbeddings(caseId, "note", sourceId);
      return;
    }
    const text = `Note (${rows[0].type}): ${rows[0].body || ""}`;
    if (text.trim().length > 10) {
      await upsertCaseEmbedding(caseId, "note", text, sourceId);
    } else {
      await removeCaseEmbeddings(caseId, "note", sourceId);
    }
  } else if (contentType === "document") {
    const { rows } = await pool.query(
      "SELECT id, filename, extracted_text, doc_type FROM case_documents WHERE id = $1 AND deleted_at IS NULL",
      [sourceId]
    );
    if (!rows.length) {
      await removeCaseEmbeddings(caseId, "document", sourceId);
      return;
    }
    const text = `Document: ${rows[0].filename} (${rows[0].doc_type || "Other"})\n${(rows[0].extracted_text || "").substring(0, 6000)}`;
    if (text.trim().length > 20) {
      await upsertCaseEmbedding(caseId, "document", text, sourceId);
    } else {
      await removeCaseEmbeddings(caseId, "document", sourceId);
    }
  } else if (contentType === "transcript") {
    const { rows } = await pool.query(
      "SELECT id, filename, transcript FROM case_transcripts WHERE id = $1 AND deleted_at IS NULL",
      [sourceId]
    );
    if (!rows.length) {
      await removeCaseEmbeddings(caseId, "transcript", sourceId);
      return;
    }
    const segments = Array.isArray(rows[0].transcript) ? rows[0].transcript : [];
    const transcriptText = segments.map(s => s.text).join(" ").substring(0, 6000);
    const text = `Transcript: ${rows[0].filename}\n${transcriptText}`;
    if (text.trim().length > 20) {
      await upsertCaseEmbedding(caseId, "transcript", text, sourceId);
    } else {
      await removeCaseEmbeddings(caseId, "transcript", sourceId);
    }
  }
}

module.exports = {
  embedText,
  buildCaseSummaryText,
  upsertCaseEmbedding,
  removeCaseEmbeddings,
  vectorSearch,
  queueEmbeddingUpdate,
  processQueue,
};
