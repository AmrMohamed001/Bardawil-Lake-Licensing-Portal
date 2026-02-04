// Load environment variables from project root
require('dotenv').config({ path: './src/config/config.env', quiet: true });

// Initialize models and DB connection
require('../src/models');
const { connectDB } = require('../src/config/db');

// Connect DB once on startup
let dbPromise;
const initializeDB = async () => {
  if (!dbPromise) {
    dbPromise = connectDB().catch(err => {
      console.error('Initial DB connection failed:', err.message);
      // Don't throw, let requests handle it
    });
  }
  return dbPromise;
};

// Ensure DB is connected before serving
initializeDB();

// Export the Express app
module.exports = require('../src/app');
