const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const openai = require("../utils/openai");
const { vectorSearch } = require("../utils/embeddings");

const router = express.Router();

const USE_VECTOR_SEARCH = process.env.USE_VECTOR_SEARCH !== "false";

router.post("/", requireAuth, async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    if (USE_VECTOR_SEARCH) {
      const hasEmbeddings = await pool.query("SELECT EXISTS(SELECT 1 FROM case_embeddings LIMIT 1)");
      if (hasEmbeddings.rows[0].exists) {
        return await vectorSearchHandler(query, res);
      }
    }
    return await bruteForceSearchHandler(query, res);
  } catch (err) {
    console.error("AI search error:", err);
    return res.status(500).json({ error: "AI search failed. Please try again." });
  }
});

async function vectorSearchHandler(query, res) {
  const candidates = await vectorSearch(query, 20);

  if (!candidates.length) {
    return res.json({ results: [] });
  }

  const caseIds = candidates.map(c => c.caseId);
  const { rows: cases } = await pool.query(
    `SELECT id, title, case_num, client_name, type, status, stage, county, court,
            injury_type, case_value_estimate, settlement_amount, lead_attorney
     FROM cases WHERE id = ANY($1) AND deleted_at IS NULL`,
    [caseIds]
  );
  const caseMap = new Map(cases.map(c => [c.id, c]));

  const contextBlocks = candidates
    .filter(c => caseMap.has(c.caseId))
    .map(c => {
      const caseData = caseMap.get(c.caseId);
      const parts = [`ID:${c.caseId}`, `"${caseData.title}"`];
      if (caseData.case_num) parts.push(`Case#:${caseData.case_num}`);
      if (caseData.client_name) parts.push(`Client:${caseData.client_name}`);
      if (caseData.type) parts.push(`Type:${caseData.type}`);
      if (caseData.status) parts.push(`Status:${caseData.status}`);
      if (caseData.injury_type) parts.push(`Injury:${caseData.injury_type}`);
      parts.push(`Similarity:${c.maxSimilarity.toFixed(3)}`);
      const matchSummary = c.matches.slice(0, 5).map(m =>
        `[${m.contentType}] ${m.preview.substring(0, 150)}`
      ).join("\n  ");
      parts.push(`\nMatches:\n  ${matchSummary}`);
      return parts.join(" | ");
    });

  const systemPrompt = `You are a legal case search assistant for a personal injury law firm. The user searched for cases and the system found candidate matches using semantic similarity. Your job is to rank and filter these candidates.

RULES:
- Return ONLY a JSON array of matching cases
- Each result must have: "id" (number), "title" (string), "reason" (string explaining WHY this case matched in 1-2 sentences)
- Return at most 20 results, ranked by relevance
- If no candidates truly match the query, return an empty array []
- The "reason" should be specific about what data matched the query
- Do NOT include markdown formatting, just raw JSON
- Filter out candidates that were matched by coincidence rather than genuine relevance`;

  const userPrompt = `Search query: "${query}"

Candidate cases (${contextBlocks.length} pre-filtered by semantic similarity):
${contextBlocks.join("\n\n")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 4096,
    store: false,
  });

  const raw = (completion.choices[0]?.message?.content || "[]").trim();
  let results;
  try {
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    results = JSON.parse(jsonStr);
  } catch {
    results = [];
  }

  if (!Array.isArray(results)) results = [];
  const validIds = new Set(caseIds);
  results = results
    .filter(r => r && typeof r.id === "number" && validIds.has(r.id))
    .map(r => ({
      id: r.id,
      title: r.title || caseMap.get(r.id)?.title || "Unknown",
      reason: r.reason || "Matched based on case data",
    }));

  return res.json({ results });
}

async function bruteForceSearchHandler(query, res) {
  const [casesResult, notesResult, activityResult, tasksResult, deadlinesResult, linksResult, usersResult, partiesResult, expertsResult, corrResult, docsResult, transcriptsResult] = await Promise.all([
    pool.query("SELECT * FROM cases WHERE deleted_at IS NULL AND confidential = FALSE ORDER BY title"),
    pool.query("SELECT case_id, body, type FROM case_notes ORDER BY created_at DESC"),
    pool.query("SELECT case_id, action, detail FROM case_activity ORDER BY ts DESC"),
    pool.query("SELECT case_id, title, status, priority, due FROM tasks"),
    pool.query("SELECT case_id, title, date, type FROM deadlines"),
    pool.query("SELECT case_id, label, category FROM case_links"),
    pool.query("SELECT id, name, role FROM users"),
    pool.query("SELECT case_id, party_type, data FROM case_parties"),
    pool.query("SELECT case_id, data FROM case_experts"),
    pool.query("SELECT case_id, subject, from_email, to_emails FROM case_correspondence ORDER BY received_at DESC"),
    pool.query("SELECT case_id, filename FROM case_documents WHERE deleted_at IS NULL ORDER BY created_at DESC"),
    pool.query("SELECT case_id, filename FROM case_transcripts WHERE deleted_at IS NULL ORDER BY created_at DESC"),
  ]);

  const cases = casesResult.rows;

  const notesByCase = {};
  for (const n of notesResult.rows) {
    if (!notesByCase[n.case_id]) notesByCase[n.case_id] = [];
    if (notesByCase[n.case_id].length < 5) {
      notesByCase[n.case_id].push({ type: n.type, body: (n.body || "").substring(0, 120) });
    }
  }

  const activityByCase = {};
  for (const a of activityResult.rows) {
    if (!activityByCase[a.case_id]) activityByCase[a.case_id] = [];
    if (activityByCase[a.case_id].length < 3) {
      activityByCase[a.case_id].push({ action: a.action, detail: (a.detail || "").substring(0, 100) });
    }
  }

  const tasksByCase = {};
  for (const t of tasksResult.rows) {
    if (!tasksByCase[t.case_id]) tasksByCase[t.case_id] = [];
    if (tasksByCase[t.case_id].length < 8) {
      tasksByCase[t.case_id].push(`${t.title}(${t.status},${t.priority}${t.due ? ",due:" + (t.due instanceof Date ? t.due.toISOString().split("T")[0] : t.due) : ""})`);
    }
  }

  const deadlinesByCase = {};
  for (const d of deadlinesResult.rows) {
    if (!deadlinesByCase[d.case_id]) deadlinesByCase[d.case_id] = [];
    deadlinesByCase[d.case_id].push(`${d.title}(${d.type},${d.date instanceof Date ? d.date.toISOString().split("T")[0] : d.date || ""})`);
  }

  const linksByCase = {};
  for (const l of linksResult.rows) {
    if (!linksByCase[l.case_id]) linksByCase[l.case_id] = [];
    if (linksByCase[l.case_id].length < 5) {
      linksByCase[l.case_id].push(`${l.label || ""}(${l.category || ""})`);
    }
  }

  const partiesByCase = {};
  for (const p of partiesResult.rows) {
    if (!partiesByCase[p.case_id]) partiesByCase[p.case_id] = [];
    const d = typeof p.data === "string" ? JSON.parse(p.data) : (p.data || {});
    const name = d.entityName || [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") || "";
    if (name) {
      const info = [name];
      if (p.party_type) info.push(`(${p.party_type})`);
      if (d.representedBy) info.push(`rep:${d.representedBy}`);
      if (d.email) info.push(d.email);
      if (d.phone) info.push(d.phone);
      if (d.isOurClient) info.push("OurClient");
      partiesByCase[p.case_id].push(info.join(" "));
    }
  }

  const expertsByCase = {};
  for (const ex of expertsResult.rows) {
    if (!expertsByCase[ex.case_id]) expertsByCase[ex.case_id] = [];
    const d = typeof ex.data === "string" ? JSON.parse(ex.data) : (ex.data || {});
    const info = [];
    if (d.name) info.push(d.name);
    if (d.type) info.push(`(${d.type})`);
    if (d.company) info.push(d.company);
    if (d.specialty) info.push(d.specialty);
    if (info.length) expertsByCase[ex.case_id].push(info.join(" "));
  }

  const corrByCase = {};
  for (const cr of corrResult.rows) {
    if (!corrByCase[cr.case_id]) corrByCase[cr.case_id] = [];
    if (corrByCase[cr.case_id].length < 5) {
      const info = [];
      if (cr.subject) info.push(`"${cr.subject}"`);
      if (cr.from_email) info.push(`from:${cr.from_email}`);
      if (info.length) corrByCase[cr.case_id].push(info.join(" "));
    }
  }

  const docsByCase = {};
  for (const doc of docsResult.rows) {
    if (!docsByCase[doc.case_id]) docsByCase[doc.case_id] = [];
    if (docsByCase[doc.case_id].length < 10) {
      docsByCase[doc.case_id].push(doc.filename);
    }
  }

  const transcriptsByCase = {};
  for (const tr of transcriptsResult.rows) {
    if (!transcriptsByCase[tr.case_id]) transcriptsByCase[tr.case_id] = [];
    if (transcriptsByCase[tr.case_id].length < 10) {
      transcriptsByCase[tr.case_id].push(tr.filename);
    }
  }

  const usersMap = {};
  for (const u of usersResult.rows) usersMap[u.id] = u.name;

  const caseSummaries = cases.map(c => {
    const parts = [];
    parts.push(`ID:${c.id}`);
    parts.push(`"${c.title}"`);
    if (c.case_num) parts.push(`Case#:${c.case_num}`);
    if (c.client_name) parts.push(`Client:${c.client_name}`);
    if (c.county) parts.push(`County:${c.county}`);
    if (c.court) parts.push(`Court:${c.court}`);
    parts.push(`Type:${c.type || "Auto Accident"}`);
    parts.push(`Status:${c.status}`);
    if (c.stage) parts.push(`Stage:${c.stage}`);
    if (c.state_jurisdiction) parts.push(`State:${c.state_jurisdiction}`);
    if (c.injury_type) parts.push(`Injury:${c.injury_type}`);
    if (c.injury_description) parts.push(`InjuryDesc:${c.injury_description}`);
    if (c.incident_location) parts.push(`Location:${c.incident_location}`);
    if (c.case_value_estimate) parts.push(`Value:${c.case_value_estimate}`);
    if (c.settlement_amount) parts.push(`Settlement:${c.settlement_amount}`);
    if (c.demand_amount) parts.push(`Demand:${c.demand_amount}`);
    if (c.liability_assessment) parts.push(`Liability:${c.liability_assessment}`);
    if (c.lead_attorney && usersMap[c.lead_attorney]) parts.push(`LeadAtty:${usersMap[c.lead_attorney]}`);
    if (c.second_attorney && usersMap[c.second_attorney]) parts.push(`2ndAtty:${usersMap[c.second_attorney]}`);
    if (c.case_manager && usersMap[c.case_manager]) parts.push(`CaseMgr:${usersMap[c.case_manager]}`);
    if (c.judge) parts.push(`Judge:${c.judge}`);
    if (c.trial_date) parts.push(`Trial:${c.trial_date.toISOString().split("T")[0]}`);
    if (c.accident_date) parts.push(`AccidentDate:${c.accident_date.toISOString().split("T")[0]}`);
    if (c.statute_of_limitations_date) parts.push(`SOL:${c.statute_of_limitations_date.toISOString().split("T")[0]}`);
    if (c.next_court_date) parts.push(`NextCourt:${c.next_court_date.toISOString().split("T")[0]}`);
    if (c.disposition_type) parts.push(`Disposition:${c.disposition_type}`);

    const customFields = Array.isArray(c.custom_fields) ? c.custom_fields : [];
    for (const cf of customFields.slice(0, 3)) {
      if (cf.value) parts.push(`${cf.label}:${cf.value}`);
    }

    const notes = notesByCase[c.id] || [];
    if (notes.length) {
      parts.push("Notes:[" + notes.map(n => `${n.type}:"${n.body}"`).join("; ") + "]");
    }

    const acts = activityByCase[c.id] || [];
    if (acts.length) {
      parts.push("Activity:[" + acts.map(a => `${a.action}:"${a.detail}"`).join("; ") + "]");
    }

    const tasks = tasksByCase[c.id] || [];
    if (tasks.length) {
      parts.push("Tasks:[" + tasks.join("; ") + "]");
    }

    const dls = deadlinesByCase[c.id] || [];
    if (dls.length) {
      parts.push("Deadlines:[" + dls.join("; ") + "]");
    }

    const lnks = linksByCase[c.id] || [];
    if (lnks.length) {
      parts.push("Links:[" + lnks.join("; ") + "]");
    }

    const parties = partiesByCase[c.id] || [];
    if (parties.length) {
      parts.push("Parties:[" + parties.join("; ") + "]");
    }

    const exps = expertsByCase[c.id] || [];
    if (exps.length) {
      parts.push("Experts:[" + exps.join("; ") + "]");
    }

    const corr = corrByCase[c.id] || [];
    if (corr.length) {
      parts.push("Emails:[" + corr.join("; ") + "]");
    }

    const docs = docsByCase[c.id] || [];
    if (docs.length) {
      parts.push("Documents:[" + docs.join("; ") + "]");
    }

    const transcripts = transcriptsByCase[c.id] || [];
    if (transcripts.length) {
      parts.push("Transcripts:[" + transcripts.join("; ") + "]");
    }

    return parts.join(" | ");
  });

  const systemPrompt = `You are a legal case search assistant for a personal injury law firm case management system. The user will ask a question and you must find matching cases from the data provided.

RULES:
- Return ONLY a JSON array of matching cases
- Each result must have: "id" (number), "title" (string), "reason" (string explaining WHY this case matched in 1-2 sentences)
- Return at most 20 results, ranked by relevance
- If no cases match, return an empty array []
- The "reason" should be specific about what data matched the query
- Do NOT include markdown formatting, just raw JSON
- Search across ALL fields: title, client, injury type, case value, settlement, notes, activity, tasks, deadlines, parties, staff, dates, documents, transcripts, etc.
- Document and transcript filename matches are highly relevant (weight 2x) — prioritize cases where filenames match the search query`;

  let caseDataText = caseSummaries.join("\n");
  const MAX_CHARS = 700000;
  if (caseDataText.length > MAX_CHARS) {
    caseDataText = caseDataText.substring(0, MAX_CHARS);
    const lastNewline = caseDataText.lastIndexOf("\n");
    if (lastNewline > MAX_CHARS * 0.9) caseDataText = caseDataText.substring(0, lastNewline);
  }

  const userPrompt = `Search query: "${query}"

Case data (${caseSummaries.length} cases):
${caseDataText}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 4096,
    store: false,
  });

  const raw = (completion.choices[0]?.message?.content || "[]").trim();
  let results;
  try {
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    results = JSON.parse(jsonStr);
  } catch {
    results = [];
  }

  if (!Array.isArray(results)) results = [];
  const validIds = new Set(cases.map(c => c.id));
  results = results
    .filter(r => r && typeof r.id === "number" && validIds.has(r.id))
    .map(r => ({
      id: r.id,
      title: r.title || cases.find(c => c.id === r.id)?.title || "Unknown",
      reason: r.reason || "Matched based on case data",
    }));

  return res.json({ results });
}

module.exports = router;
