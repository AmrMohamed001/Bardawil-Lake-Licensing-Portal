// Load environment variables first (path works from project root on Vercel)
require('dotenv').config({ path: './src/config/config.env', quiet: true });

const app = require('../src/app');
const { connectDB } = require('../src/config/db');

// Initialize models
require('../src/models');

// Connect to database once
let dbConnected = false;

const handler = async (req, res, next) => {
  // Ensure DB connection on first request
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (err) {
      console.error('Database connection failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  // Pass to Express app
  return app(req, res, next);
};

module.exports = handler;
