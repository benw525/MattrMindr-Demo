module.exports = async () => {
  const pool = require("../db");
  await pool.end();
};
