const path = require("path");
const { runner } = require("node-pg-migrate");

function getSslConfig() {
  const sslMode = process.env.DB_SSL;
  if (sslMode === "require") return { rejectUnauthorized: false };
  if (sslMode === "verify") return { rejectUnauthorized: true };
  if (sslMode === "false") return false;
  return process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const ssl = getSslConfig();

  await runner({
    databaseUrl: {
      connectionString: databaseUrl,
      ssl,
    },
    migrationsTable: "pgmigrations",
    dir: path.join(__dirname, "..", "migrations"),
    direction: "up",
    log: (msg) => console.log("[migrate]", msg),
    noLock: false,
  });
}

module.exports = { runMigrations };
