/**
 * Cache Service - L1 Memory Cache
 * Uses node-cache for in-memory caching of frequently accessed data
 */

const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
    stdTTL: 300, // Default TTL: 5 minutes
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: true, // Return cloned objects to prevent mutation
    deleteOnExpire: true,
});

// Cache key constants
const CACHE_KEYS = {
    APPLICATION_STATUSES: 'app_statuses',
    APPLICATION_STATUSES_BY_CATEGORY: 'app_statuses_cat_',
    ACTIVE_PRICES: 'active_prices',
    PUBLISHED_NEWS: 'published_news',
    PUBLISHED_NEWS_PAGE: 'published_news_page_',
    PORTAL_INFO: 'portal_info',
};

// TTL constants (in seconds)
const TTL = {
    APPLICATION_STATUSES: 1800, // 30 minutes
    ACTIVE_PRICES: 900, // 15 minutes
    PUBLISHED_NEWS: 300, // 5 minutes
    PORTAL_INFO: 3600, // 1 hour
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
const get = (key) => {
    return cache.get(key);
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success
 */
const set = (key, value, ttl) => {
    return cache.set(key, value, ttl);
};

/**
 * Delete key from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
const del = (key) => {
    return cache.del(key);
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Key pattern prefix
 */
const delByPattern = (pattern) => {
    const keys = cache.keys().filter(key => key.startsWith(pattern));
    return cache.del(keys);
};

/**
 * Flush entire cache
 */
const flush = () => {
    cache.flushAll();
    console.log('[Cache] Flushed all cached data');
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const stats = () => {
    const s = cache.getStats();
    return {
        hits: s.hits,
        misses: s.misses,
        keys: cache.keys().length,
        hitRate: s.hits + s.misses > 0
            ? ((s.hits / (s.hits + s.misses)) * 100).toFixed(2) + '%'
            : 'N/A',
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
    const cached = cache.get(key);
    if (cached !== undefined) {
        console.log(`[Cache] HIT: ${key}`);
        return cached;
    }

    console.log(`[Cache] MISS: ${key}`);
    const value = await fn();
    cache.set(key, value, ttl);
    return value;
};

/**
 * Invalidate application statuses cache
 */
const invalidateStatuses = () => {
    del(CACHE_KEYS.APPLICATION_STATUSES);
    delByPattern(CACHE_KEYS.APPLICATION_STATUSES_BY_CATEGORY);
    console.log('[Cache] Invalidated application statuses');
};

/**
 * Invalidate prices cache
 */
const invalidatePrices = () => {
    del(CACHE_KEYS.ACTIVE_PRICES);
    console.log('[Cache] Invalidated prices');
};

/**
 * Invalidate news cache
 */
const invalidateNews = () => {
    del(CACHE_KEYS.PUBLISHED_NEWS);
    delByPattern(CACHE_KEYS.PUBLISHED_NEWS_PAGE);
    console.log('[Cache] Invalidated news');
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
    CACHE_KEYS,
    TTL,
};
