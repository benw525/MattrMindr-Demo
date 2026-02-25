const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const toFrontend = (row) => ({
  id: row.id,
  contactId: row.contact_id,
  staffType: row.staff_type,
  data: row.data || {},
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

router.get("/:contactId", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM contact_staff WHERE contact_id = $1 ORDER BY created_at",
      [req.params.contactId]
    );
    return res.json(rows.map(toFrontend));
  } catch (err) {
    console.error("Contact staff fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { contactId, staffType, data } = req.body;
  if (!contactId) return res.status(400).json({ error: "contactId required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO contact_staff (contact_id, staff_type, data) VALUES ($1, $2, $3) RETURNING *",
      [contactId, staffType || "Other", data || {}]
    );
    return res.status(201).json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact staff create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { staffType, data } = req.body;
  try {
    const sets = [];
    const params = [];
    if (staffType !== undefined) { params.push(staffType); sets.push(`staff_type = $${params.length}`); }
    if (data !== undefined) { params.push(JSON.stringify(data)); sets.push(`data = $${params.length}::jsonb`); }
    if (sets.length === 0) return res.status(400).json({ error: "Nothing to update" });
    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE contact_staff SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact staff update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM contact_staff WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Contact staff delete error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
