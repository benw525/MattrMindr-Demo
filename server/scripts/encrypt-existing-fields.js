const pool = require("../db");
const { encrypt, isEncrypted } = require("../utils/encryption");

const COLUMNS = [
  { table: "cases", column: "client_ssn" },
  { table: "users", column: "ms_access_token" },
  { table: "users", column: "ms_refresh_token" },
  { table: "users", column: "ms_account_email" },
  { table: "users", column: "scribe_token" },
  { table: "users", column: "voirdire_token" },
  { table: "users", column: "mfa_secret" },
];

async function encryptExistingFields() {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    console.error("FIELD_ENCRYPTION_KEY is not set. Generate one with:");
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  console.log("Starting encryption of existing plaintext fields...");
  console.log("IMPORTANT: Ensure you have a database backup before running this script.\n");

  let totalEncrypted = 0;

  for (const { table, column } of COLUMNS) {
    console.log(`Processing ${table}.${column}...`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL AND ${column} != ''`
      );

      let encrypted = 0;
      let skipped = 0;

      for (const row of rows) {
        const value = row[column];
        if (isEncrypted(value)) {
          skipped++;
          continue;
        }

        const encryptedValue = encrypt(value);
        await client.query(
          `UPDATE ${table} SET ${column} = $1 WHERE id = $2`,
          [encryptedValue, row.id]
        );
        encrypted++;
      }

      await client.query("COMMIT");
      console.log(`  ${encrypted} rows encrypted, ${skipped} already encrypted, ${rows.length} total`);
      totalEncrypted += encrypted;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ERROR on ${table}.${column}: ${err.message} — rolled back`);
    } finally {
      client.release();
    }
  }

  console.log(`\nDone. ${totalEncrypted} fields encrypted across all tables.`);
  process.exit(0);
}

encryptExistingFields().catch((err) => {
  console.error("Encryption script failed:", err);
  process.exit(1);
});
