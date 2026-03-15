const path = require("path");

module.exports = {
  apps: [
    {
      name: "mattrmindr",
      script: "server/index.js",
      cwd: path.resolve(__dirname, ".."),
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: path.resolve(__dirname, "..", "logs", "error.log"),
      out_file: path.resolve(__dirname, "..", "logs", "out.log"),
      merge_logs: true,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
