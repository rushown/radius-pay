module.exports = {
  apps: [
    {
      name:         'radiuspay-api',
      script:       './backend/src/app.js',
      instances:    'max',
      exec_mode:    'cluster',
      watch:        false,
      env_production: {
        NODE_ENV: 'production',
        PORT:     3001,
      },
      error_file:   './logs/err.log',
      out_file:     './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
    },
  ],
};