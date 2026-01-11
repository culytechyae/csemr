/**
 * PM2 Ecosystem Configuration
 * Production process management for Taaleem Clinic Management System
 * Compliant with Malaffi Security Assessment Guidelines v3
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js -i 4  # Start 4 instances
 *   pm2 start ecosystem.config.js -i max # Use all CPU cores
 */

module.exports = {
  apps: [{
    name: 'taaleem-emr',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p 5005',
    
    // Cluster mode - run multiple instances for load balancing
    instances: 'max', // Use all CPU cores, or specify number like 4
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    
    // Logging (Malaffi Compliance: Audit Logging)
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    log_type: 'json', // JSON format for better log parsing
    
    // Auto-restart configuration (Malaffi Compliance: High Availability)
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    restart_delay: 4000,
    
    // Watch mode (disabled for production)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.next',
      '.git',
      '*.log',
      'deployment'
    ],
    
    // Advanced options
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Instance variables (for multiple ports if needed)
    instance_var: 'INSTANCE_ID',
    
    // Source map support
    source_map_support: true,
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    // Health check (Malaffi Compliance: Health Monitoring)
    // PM2 will check if the app responds to this signal
    // The app should emit 'ready' when it's ready to accept connections
  }]
};

