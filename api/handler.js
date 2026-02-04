// Load environment variables from project root
require('dotenv').config({ path: './src/config/config.env', quiet: true });

// Lazy-load app on first request to avoid build-time DB connection
let app;
let dbInitialized = false;

const initializeApp = async () => {
  if (!app) {
    // Load models and app only on first request (after node_modules is available)
    require('../src/models');
    const { connectDB } = require('../src/config/db');
    
    if (!dbInitialized) {
      try {
        await connectDB();
        dbInitialized = true;
        console.log('Database connected successfully');
      } catch (err) {
        console.error('Database connection failed:', err.message);
        // Continue anyway - some routes may work without DB
      }
    }
    
    app = require('../src/app');
  }
  return app;
};

// Export a wrapper function that initializes on first call
module.exports = async (req, res, next) => {
  const expressApp = await initializeApp();
  return expressApp(req, res, next);
};
