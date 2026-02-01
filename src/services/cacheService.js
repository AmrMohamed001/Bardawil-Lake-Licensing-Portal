const redis = require('redis');

// Create Redis client with robust reconnection strategy
const client = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        // Reconnection strategy with exponential backoff
        reconnectStrategy: (retries) => {
            if (retries > 20) {
                console.error('❌ Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: min 100ms, max 30 seconds
            const delay = Math.min(retries * 100, 30000);
            console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})...`);
            return delay;
        },
        // Keep connection alive
        keepAlive: 30000, // 30 seconds
        connectTimeout: 10000, // 10 seconds
    },
    password: process.env.REDIS_PASSWORD || undefined,
});

// Check if running in cluster mode
const cluster = require('cluster');
const isWorker = cluster.isWorker || cluster.isPrimary === false;

// Event handlers
client.on('error', (err) => {
    // Only log non-connection-reset errors in detail
    if (err.code === 'ECONNRESET') {
        if (!isWorker) console.log('⚠️ Redis: Connection reset, will reconnect automatically...');
    } else {
        console.log('Redis Client Error:', err.message);
    }
});

client.on('connect', () => {
    if (isWorker) {
        console.log(`  └─ Worker ${process.pid}: Redis connected`);
    } else {
        console.log('✅ Redis Client Connected');
    }
});
client.on('reconnecting', () => {
    if (!isWorker) console.log('🔄 Redis: Reconnecting...');
});
client.on('ready', () => {
    if (!isWorker) console.log('✅ Redis Client Ready');
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('❌ Redis Connection Failed:', err.message);
    }
})();

// Cache key constants
const CACHE_KEYS = {
    APPLICATION_STATUSES: 'app_statuses',
    APPLICATION_STATUSES_BY_CATEGORY: 'app_statuses_cat_',
    ACTIVE_PRICES: 'active_prices',
    PUBLISHED_NEWS: 'published_news',
    PUBLISHED_NEWS_PAGE: 'published_news_page_',
    PORTAL_INFO: 'portal_info',
    DASHBOARD_STATS: 'admin_dashboard_stats',
};

// TTL constants (in seconds)
const TTL = {
    APPLICATION_STATUSES: 1800, // 30 minutes
    ACTIVE_PRICES: 900, // 15 minutes
    PUBLISHED_NEWS: 300, // 5 minutes
    PORTAL_INFO: 3600, // 1 hour
    DASHBOARD_STATS: 120, // 2 minutes - frequently updated
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or null
 */
const get = async (key) => {
    try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error(`[Cache] Error getting key ${key}:`, error);
        return null; // Fail safe
    }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success
 */
const set = async (key, value, ttl) => {
    try {
        const stringValue = JSON.stringify(value);
        if (ttl) {
            await client.set(key, stringValue, { EX: ttl });
        } else {
            await client.set(key, stringValue);
        }
        return true;
    } catch (error) {
        console.error(`[Cache] Error setting key ${key}:`, error);
        return false;
    }
};

/**
 * Delete key from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
const del = async (key) => {
    try {
        return await client.del(key);
    } catch (error) {
        console.error(`[Cache] Error deleting key ${key}:`, error);
        return 0;
    }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Key pattern prefix
 */
const delByPattern = async (pattern) => {
    try {
        const keys = await client.keys(pattern + '*');
        if (keys.length > 0) {
            return await client.del(keys);
        }
        return 0;
    } catch (error) {
        console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
        return 0;
    }
};

/**
 * Flush entire cache
 */
const flush = async () => {
    try {
        await client.flushAll();
        console.log('[Cache] Flushed all cached data');
    } catch (error) {
        console.error('[Cache] Error flushing cache:', error);
    }
};

/**
 * Get cache statistics (Simplified for Redis)
 * @returns {Object} Cache stats
 */
const stats = async () => {
    // Redis doesn't expose hit/miss stats simply like node-cache without config
    // We can return basic info
    return {
        info: 'Redis Cache',
        isConnected: client.isOpen
    };
};

/**
 * Cache wrapper - Get from cache or execute function and cache result
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {*} Cached or fresh value
 */
const getOrSet = async (key, fn, ttl) => {
    const cached = await get(key);
    if (cached !== null) {
        // console.log(`[Cache] HIT: ${key}`);
        return cached;
    }

    // console.log(`[Cache] MISS: ${key}`);
    const value = await fn();
    if (value !== undefined && value !== null) {
        await set(key, value, ttl);
    }
    return value;
};

/**
 * Invalidate application statuses cache
 */
const invalidateStatuses = async () => {
    await del(CACHE_KEYS.APPLICATION_STATUSES);
    await delByPattern(CACHE_KEYS.APPLICATION_STATUSES_BY_CATEGORY);
    console.log('[Cache] Invalidated application statuses');
};

/**
 * Invalidate prices cache
 */
const invalidatePrices = async () => {
    await del(CACHE_KEYS.ACTIVE_PRICES);
    console.log('[Cache] Invalidated prices');
};

/**
 * Invalidate news cache
 */
const invalidateNews = async () => {
    await del(CACHE_KEYS.PUBLISHED_NEWS);
    await delByPattern(CACHE_KEYS.PUBLISHED_NEWS_PAGE);
    console.log('[Cache] Invalidated news');
};

/**
 * Invalidate dashboard stats cache
 */
const invalidateDashboard = async () => {
    await del(CACHE_KEYS.DASHBOARD_STATS);
    console.log('[Cache] Invalidated dashboard stats');
};

module.exports = {
    get,
    set,
    del,
    delByPattern,
    flush,
    stats,
    getOrSet,
    invalidateStatuses,
    invalidatePrices,
    invalidateNews,
    invalidateDashboard,
    CACHE_KEYS,
    TTL,
    client // Export client if needed
};
