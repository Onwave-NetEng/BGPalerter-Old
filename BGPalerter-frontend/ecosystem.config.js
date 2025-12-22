module.exports = {
  apps: [
    {
      name: 'bgpalerter-dashboard',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/ubuntu/bgpalerter-dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/ubuntu/logs/dashboard-error.log',
      out_file: '/home/ubuntu/logs/dashboard-out.log',
      log_file: '/home/ubuntu/logs/dashboard-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
