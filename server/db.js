const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Make sure the database is provisioned.");
}

const sslMode = process.env.DB_SSL;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslMode === "require" ? { rejectUnauthorized: false }
     : sslMode === "verify" ? { rejectUnauthorized: true }
     : sslMode === "false" ? false
     : (process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false),
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

module.exports = pool;
