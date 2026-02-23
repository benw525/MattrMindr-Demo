const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const toFrontend = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  phone: row.phone || "",
  email: row.email || "",
  fax: row.fax || "",
  address: row.address || "",
  deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.query.deleted === "true") {
      const { rows } = await pool.query(
        "SELECT * FROM contacts WHERE deleted_at IS NOT NULL AND deleted_at > NOW() - INTERVAL '30 days' ORDER BY category, name"
      );
      return res.json(rows.map(toFrontend));
    }
    let sql = "SELECT * FROM contacts WHERE deleted_at IS NULL";
    const params = [];
    if (req.query.category) {
      params.push(req.query.category);
      sql += ` AND category = $${params.length}`;
    }
    sql += " ORDER BY name";
    const { rows } = await pool.query(sql, params);
    return res.json(rows.map(toFrontend));
  } catch (err) {
    console.error("Contacts fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM contacts WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const d = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO contacts (name, category, phone, email, fax, address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [d.name, d.category, d.phone || "", d.email || "", d.fax || "", d.address || ""]
    );
    return res.status(201).json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const d = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE contacts SET name=$1, category=$2, phone=$3, email=$4, fax=$5, address=$6
       WHERE id=$7 AND deleted_at IS NULL RETURNING *`,
      [d.name, d.category, d.phone || "", d.email || "", d.fax || "", d.address || "", req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE contacts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found or already deleted" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact delete error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/restore", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE contacts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found or not deleted" });
    return res.json(toFrontend(rows[0]));
  } catch (err) {
    console.error("Contact restore error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
