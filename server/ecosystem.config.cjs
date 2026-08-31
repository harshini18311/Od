module.exports = {
  apps: [
    {
      name: "od-approval-server",
      script: "./index.js",
      instances: "max", // Run on all available CPU cores for max concurrency
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      }
    }
  ]
};
