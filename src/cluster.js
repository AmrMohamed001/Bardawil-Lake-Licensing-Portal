/**
 * Cluster Mode Server
 * Spawns multiple worker processes for better CPU utilization
 * 
 * Usage: node src/cluster.js
 * 
 * For production, use PM2 instead:
 *   pm2 start ecosystem.config.js --env production
 */

const cluster = require('cluster');
const os = require('os');

// Number of CPU cores
const numCPUs = os.cpus().length;

// Use environment variable or default to all cores
const WORKERS = process.env.CLUSTER_WORKERS 
  ? parseInt(process.env.CLUSTER_WORKERS, 10) 
  : numCPUs;

if (cluster.isMaster || cluster.isPrimary) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 Bardawil Lake Licensing Portal - Cluster Mode       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Master PID: ${process.pid.toString().padEnd(46)}║`);
  console.log(`║  CPU Cores: ${numCPUs.toString().padEnd(47)}║`);
  console.log(`║  Workers: ${WORKERS.toString().padEnd(49)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    const worker = cluster.fork();
    console.log(`🔧 Worker ${worker.process.pid} spawned`);
  }

  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died (${signal || code})`);
    
    // Respawn worker unless graceful shutdown
    if (!worker.exitedAfterDisconnect) {
      console.log('🔄 Spawning replacement worker...');
      const newWorker = cluster.fork();
      console.log(`🔧 Worker ${newWorker.process.pid} spawned`);
    }
  });

  // Handle worker online
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down cluster...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].disconnect();
    }
    
    setTimeout(() => {
      console.log('👋 All workers shut down');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

} else {
  // Worker process - load the actual server
  require('./server');
}
