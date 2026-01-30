const app = require('../src/app');
const { connectDB } = require('../src/config/db');
require('pg'); // Force inclusion of pg module for Vercel

// Cache the database connection promise
let dbConnection = null;

module.exports = async (req, res) => {
    // Ensure database is connected before handling request
    if (!dbConnection) {
        dbConnection = connectDB();
    }

    try {
        await dbConnection;
        return app(req, res);
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
};
