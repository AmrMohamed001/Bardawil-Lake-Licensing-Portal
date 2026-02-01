const { Sequelize } = require('sequelize');

/**
 * Database Configuration
 * Optimized for production with connection pooling, retry logic, and conditional logging
 */

// Determine if we should log queries (development only)
const shouldLogQueries = process.env.NODE_ENV === 'development' && process.env.DB_LOGGING === 'true';

// Custom logging function
const queryLogger = shouldLogQueries
  ? (msg) => console.log(`[DB Query] ${msg}`)
  : false;

// Create Sequelize instance with optimized settings
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: queryLogger,

    // Connection pool configuration
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,      // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN) || 2,       // Minimum connections
      acquire: 30000,  // Maximum time (ms) to acquire connection
      idle: 10000,     // Maximum time (ms) connection can be idle
      evict: 1000,     // Time interval (ms) to check for idle connections
    },

    // Retry configuration for connection failures
    retry: {
      max: 5,          // Maximum retry attempts
      backoffBase: 1000,
      backoffExponent: 1.5,
    },

    // Model defaults
    define: {
      timestamps: true,
      underscored: true, // Use snake_case for column names
      freezeTableName: true, // Don't pluralize table names automatically
    },

    // Timezone handling
    timezone: '+02:00', // Egypt timezone

    // Query optimization
    benchmark: process.env.NODE_ENV === 'development', // Log query execution time in dev
  }
);

/**
 * Connect to database with retry logic
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 */
const connectDB = async (retries = 5, delay = 3000) => {
  // Check if running in cluster mode
  const cluster = require('cluster');
  const isWorker = cluster.isWorker || cluster.isPrimary === false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      
      // Condensed logging in cluster mode
      if (isWorker) {
        console.log(`  └─ Worker ${process.pid}: PostgreSQL connected`);
      } else {
        console.log('✅ PostgreSQL connected successfully');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   Pool: max=${sequelize.options.pool.max}, min=${sequelize.options.pool.min}`);
      }

      // Sync models based on environment and configuration
      const shouldSyncAlter = process.env.DB_SYNC === 'true';

      if (shouldSyncAlter) {
        await sequelize.sync({ alter: true });
        if (!isWorker) console.log('✅ Database models synchronized (alter mode)');
      } else {
        // Fast startup: Only create tables if they don't exist, don't check/alter columns
        await sequelize.sync();
        if (!isWorker) console.log('✅ Database models synchronized (basic mode)');
      }

      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error.message);

      if (attempt < retries) {
        console.log(`   Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        console.error('❌ All database connection attempts failed');
        throw error;
      }
    }
  }
};

/**
 * Check database health
 * @returns {Promise<{status: string, latency: number}>}
 */
const checkHealth = async () => {
  const start = Date.now();
  try {
    await sequelize.query('SELECT 1');
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      latency: Date.now() - start,
    };
  }
};

/**
 * Get connection pool statistics
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  const pool = sequelize.connectionManager.pool;
  if (!pool) return { message: 'Pool not initialized' };

  return {
    size: pool.size,
    available: pool.available,
    pending: pool.pending,
    max: sequelize.options.pool.max,
    min: sequelize.options.pool.min,
  };
};

/**
 * Graceful shutdown - close all connections
 */
const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
};

module.exports = {
  sequelize,
  connectDB,
  checkHealth,
  getPoolStats,
  closeDB,
};
