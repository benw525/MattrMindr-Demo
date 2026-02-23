const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const USER_FIELDS = "id, name, role, roles, email, initials, phone, cell, ext, avatar, offices";

function normalizeUser(r) {
  return {
    ...r,
    roles: r.roles && r.roles.length ? r.roles : [r.role],
    offices: r.offices || [],
  };
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM users ORDER BY name`);
    return res.json(rows.map(normalizeUser));
  } catch (err) {
    console.error("Users fetch error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { name, role, roles, email, initials, phone, cell, ext, avatar, offices } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  try {
    const { rows: mx } = await pool.query("SELECT COALESCE(MAX(id), 0) AS max_id FROM users");
    const nextId = (parseInt(mx[0].max_id) || 0) + 1;
    const primaryRole = (roles && roles.length) ? roles[0] : (role || "Attorney");
    const rolesArr = (roles && roles.length) ? roles : [primaryRole];
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, role, roles, email, initials, phone, cell, ext, avatar, offices)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${USER_FIELDS}`,
      [nextId, name.trim(), primaryRole, rolesArr, email || "", initials || "", phone || "", cell || "", ext || "", avatar || "#4C7AC9", offices || []]
    );
    return res.status(201).json(normalizeUser(rows[0]));
  } catch (err) {
    console.error("User create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const requesterId = req.session.userId;

  if (requesterId !== targetId) {
    const { rows: rq } = await pool.query("SELECT roles FROM users WHERE id = $1", [requesterId]);
    const isAdmin = rq.length > 0 && (rq[0].roles || []).includes("App Admin");
    if (!isAdmin) return res.status(403).json({ error: "Not authorized to edit this profile" });
  }

  const { name, email, phone, cell, ext } = req.body;
  const newName = name?.trim() || null;

  const sets = [];
  const vals = [];
  let idx = 1;
  if (newName) {
    const initials = newName.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 3).toUpperCase();
    sets.push(`name = $${idx++}`, `initials = $${idx++}`);
    vals.push(newName, initials);
  }
  if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email || ""); }
  if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone || ""); }
  if (cell  !== undefined) { sets.push(`cell  = $${idx++}`); vals.push(cell  || ""); }
  if (ext   !== undefined) { sets.push(`ext   = $${idx++}`); vals.push(ext   || ""); }

  if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

  vals.push(targetId);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING ${USER_FIELDS}`,
      vals
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(normalizeUser(rows[0]));
  } catch (err) {
    console.error("User update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("User delete error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/offices", requireAuth, async (req, res) => {
  const { offices } = req.body;
  if (!Array.isArray(offices)) return res.status(400).json({ error: "offices must be an array" });
  try {
    const { rows } = await pool.query(
      `UPDATE users SET offices = $1 WHERE id = $2 RETURNING ${USER_FIELDS}`,
      [offices, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(normalizeUser(rows[0]));
  } catch (err) {
    console.error("User offices update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/roles", requireAuth, async (req, res) => {
  const { roles } = req.body;
  if (!Array.isArray(roles) || roles.length === 0) return res.status(400).json({ error: "roles must be a non-empty array" });
  try {
    const primaryRole = roles[0];
    const { rows } = await pool.query(
      `UPDATE users SET role = $1, roles = $2 WHERE id = $3 RETURNING ${USER_FIELDS}`,
      [primaryRole, roles, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(normalizeUser(rows[0]));
  } catch (err) {
    console.error("User roles update error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
