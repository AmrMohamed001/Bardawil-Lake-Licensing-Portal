/**
 * Migration: Update LicensePrice ENUM values
 * Add 6_months to duration and 'other' to license_type
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

const { sequelize } = require('../config/db');

const runMigration = async () => {
    console.log('\n🔄 Running migration: Update LicensePrice ENUMs...\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Add '6_months' to duration ENUM
        console.log('📋 Adding 6_months to license_prices duration ENUM...');
        await sequelize.query(`
            ALTER TYPE enum_license_prices_duration ADD VALUE IF NOT EXISTS '6_months';
        `).catch(() => console.log('   6_months already exists or error'));

        // Add 'other' to license_type ENUM
        console.log('📋 Adding other to license_prices license_type ENUM...');
        await sequelize.query(`
            ALTER TYPE enum_license_prices_license_type ADD VALUE IF NOT EXISTS 'other';
        `).catch(() => console.log('   other already exists or error'));

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

runMigration();
