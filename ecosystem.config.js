module.exports = {
    apps: [{
        name: 'bardawil-portal',
        script: 'src/server.js',
        instances: 'max', // Use all available cores
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 8080 // Standard port for production
        },
        // Merge logs
        merge_logs: true,
        // Log date format
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }]
};
