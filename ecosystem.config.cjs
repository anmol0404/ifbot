module.exports = {
  apps: [
    {
      name: "ifbot",
      script: "./dist/main.js",
      instances: 1,
      exec_mode: "fork",

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",

      kill_timeout: 5000,
      listen_timeout: 3000,

      log_file: "./bot-logs/combined.log",
      out_file: "./bot-logs/out.log",
      error_file: "./bot-logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      env: {
        NODE_ENV: "production",
      },

      exp_backoff_restart_delay: 100,
      node_args: "--max-old-space-size=2048",
    },
  ],
};
