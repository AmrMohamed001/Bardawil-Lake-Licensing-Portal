'use strict';

/**
 * Migration: Add Paymob payment fields and update status enum
 * This migration adds fields needed for Paymob online payment integration
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add Paymob fields to applications table
        await queryInterface.addColumn('applications', 'paymob_order_id', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });

        await queryInterface.addColumn('applications', 'paymob_transaction_id', {
            type: Sequelize.STRING(50),
            allowNull: true,
        });

        // Note: For PostgreSQL, you'll need to manually update the ENUM type
        // Run this SQL manually if needed:
        // ALTER TYPE "enum_applications_status" ADD VALUE 'approved_payment_pending';
        // Or recreate the ENUM with all values

        // Add payment notification types
        // ALTER TYPE "enum_notifications_type" ADD VALUE 'payment_success';
        // ALTER TYPE "enum_notifications_type" ADD VALUE 'payment_failed';

        console.log('✅ Migration completed: Added Paymob payment fields');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('applications', 'paymob_order_id');
        await queryInterface.removeColumn('applications', 'paymob_transaction_id');

        console.log('✅ Rollback completed: Removed Paymob payment fields');
    },
};
