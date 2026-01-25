/**
 * Migration to add new license types and update pricing
 * Adds 'trade' and 'entry' to license_type ENUM
 */

// Load dotenv FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

// Now we can safely require sequelize
const { sequelize } = require('../config/db');

const runMigration = async () => {
    console.log('\n🔄 Running migration: Add trade and entry license types...\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Add new ENUM values to license_type
        try {
            await sequelize.query(`ALTER TYPE enum_license_prices_license_type ADD VALUE IF NOT EXISTS 'trade';`);
            console.log('   ✅ Added trade license type');
        } catch (e) {
            console.log('   ⚠️ trade type may already exist:', e.message);
        }

        try {
            await sequelize.query(`ALTER TYPE enum_license_prices_license_type ADD VALUE IF NOT EXISTS 'entry';`);
            console.log('   ✅ Added entry license type');
        } catch (e) {
            console.log('   ⚠️ entry type may already exist:', e.message);
        }

        // Make created_by nullable
        try {
            await sequelize.query(`ALTER TABLE license_prices ALTER COLUMN created_by DROP NOT NULL;`);
            console.log('   ✅ Made created_by nullable');
        } catch (e) {
            console.log('   ⚠️ created_by may already be nullable:', e.message);
        }

        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
};

runMigration();
