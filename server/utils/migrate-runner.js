const path = require("path");
const { runner } = require("node-pg-migrate");

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  await runner({
    databaseUrl,
    migrationsTable: "pgmigrations",
    dir: path.join(__dirname, "..", "migrations"),
    direction: "up",
    log: (msg) => console.log("[migrate]", msg),
    noLock: false,
  });
}

module.exports = { runMigrations };
