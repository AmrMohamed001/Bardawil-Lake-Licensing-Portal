/**
 * Migration: Add trade and entry to applicationType ENUM
 * and add 6_months to duration ENUM
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env') });

const { sequelize } = require('../config/db');

const runMigration = async () => {
    console.log('\n🔄 Running migration: Add new ENUM values...\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Add 'trade' and 'entry' to application_type ENUM
        console.log('📋 Adding trade and entry to application_type ENUM...');
        await sequelize.query(`
            ALTER TYPE enum_applications_application_type ADD VALUE IF NOT EXISTS 'trade';
        `).catch(() => console.log('   trade already exists or error'));

        await sequelize.query(`
            ALTER TYPE enum_applications_application_type ADD VALUE IF NOT EXISTS 'entry';
        `).catch(() => console.log('   entry already exists or error'));

        console.log('✅ application_type ENUM updated\n');

        // Add '6_months' to duration ENUM
        console.log('📋 Adding 6_months to duration ENUM...');
        await sequelize.query(`
            ALTER TYPE enum_applications_duration ADD VALUE IF NOT EXISTS '6_months';
        `).catch(() => console.log('   6_months already exists or error'));

        console.log('✅ duration ENUM updated\n');

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

runMigration();
