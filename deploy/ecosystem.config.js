module.exports = {
  apps: [
    {
      name: "mattrmindr",
      script: "server/index.js",
      cwd: "/opt/mattrmindr",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      env_file: "/opt/mattrmindr/.env",
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/mattrmindr/error.log",
      out_file: "/var/log/mattrmindr/out.log",
      merge_logs: true,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
