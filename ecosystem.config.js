/**
 * PM2 Ecosystem Configuration
 * For production deployment with cluster mode
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production  (zero-downtime restart)
 *   pm2 stop ecosystem.config.js
 *   pm2 logs bardawil-portal
 */

module.exports = {
  apps: [{
    name: 'bardawil-portal',
    script: 'src/server.js',
    
    // Cluster mode - use all available CPU cores
    instances: 'max',
    exec_mode: 'cluster',
    
    // Auto restart settings
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    max_restarts: 10,
    restart_delay: 5000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Logging
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001
    }
  }]
};
