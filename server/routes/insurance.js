const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const toFrontend = (row) => ({
  id: row.id,
  caseId: row.case_id,
  insuranceType: row.insurance_type,
  data: row.data || {},
  createdAt: row.created_at,
});

router.get("/:caseId", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM case_insurance WHERE case_id = $1 ORDER BY created_at ASC",
      [req.params.caseId]
    );
    return res.json(rows.map(toFrontend));
  } catch (err) {
    console.error("Insurance fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { caseId, insuranceType, data } = req.body;
    if (!caseId || !insuranceType) {
      return res.status(400).json({ error: "caseId and insuranceType are required" });
    }
    const { rows } = await pool.query(
      "INSERT INTO case_insurance (case_id, insurance_type, data) VALUES ($1, $2, $3) RETURNING *",
      [caseId, insuranceType, JSON.stringify(data || {})]
    );
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Insurance create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { insuranceType, data } = req.body;
    const { rows } = await pool.query(
      "UPDATE case_insurance SET insurance_type = COALESCE($1, insurance_type), data = COALESCE($2, data) WHERE id = $3 RETURNING *",
      [insuranceType || null, data ? JSON.stringify(data) : null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Insurance record not found" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Insurance update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM case_insurance WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Insurance record not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Insurance delete error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
