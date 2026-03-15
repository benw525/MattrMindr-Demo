const pool = require("../db");

async function invalidateUserSessions(userId, excludeSessionId) {
  try {
    if (excludeSessionId) {
      await pool.query(
        "DELETE FROM user_sessions WHERE sess::jsonb->>'userId' = $1 AND sid != $2",
        [String(userId), excludeSessionId]
      );
    } else {
      await pool.query(
        "DELETE FROM user_sessions WHERE sess::jsonb->>'userId' = $1",
        [String(userId)]
      );
    }
  } catch (err) {
    console.error(`Failed to invalidate sessions for user ${userId}:`, err.message);
  }
}

module.exports = { invalidateUserSessions };
