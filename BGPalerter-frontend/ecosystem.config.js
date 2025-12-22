module.exports = {
  apps: [
    {
      name: 'bgpalerter-dashboard',
      script: 'pnpm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: `${__dirname}/logs/dashboard-error.log`,
      out_file: `${__dirname}/logs/dashboard-out.log`,
      log_file: `${__dirname}/logs/dashboard-combined.log`,
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
