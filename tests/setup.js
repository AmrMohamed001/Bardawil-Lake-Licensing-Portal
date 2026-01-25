/**
 * Database Test Setup
 * Configures the test environment for database testing
 */

const path = require('path');
// Load environment from the same location as the server
require('dotenv').config({ path: path.resolve(__dirname, '../src/config/config.env') });
const { sequelize } = require('../src/config/db');

// Increase timeout for database operations
jest.setTimeout(30000);

// Before all tests - connect to database
beforeAll(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Test database connected');
    } catch (error) {
        console.error('❌ Test database connection failed:', error.message);
        throw error;
    }
});

// After all tests - close connection
afterAll(async () => {
    await sequelize.close();
    console.log('✅ Test database connection closed');
});

// Export sequelize for use in tests
module.exports = { sequelize };
