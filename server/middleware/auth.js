const pool = require("../db");

async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const { rows } = await pool.query("SELECT deleted_at FROM users WHERE id = $1", [req.session.userId]);
    if (rows.length === 0 || rows[0].deleted_at) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Account deactivated" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
  }
  next();
}

module.exports = { requireAuth };
