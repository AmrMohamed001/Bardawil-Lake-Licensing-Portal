module.exports = {
    apps: [{
        name: "bardawil-portal",
        script: "./src/server.js",
        instances: "max",
        exec_mode: "cluster",
        watch: false,
        max_memory_restart: "1G",
        env: {
            NODE_ENV: "development",
            PORT: 3000
        },
        env_production: {
            NODE_ENV: "production",
            PORT: 3000
        }
    }]
};
