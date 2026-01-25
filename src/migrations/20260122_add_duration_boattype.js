'use strict';

/**
 * Migration: Add duration and boatType fields to applications and license_prices tables
 * Date: 2026-01-22
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Add duration enum type
            await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_applications_duration') THEN
            CREATE TYPE "enum_applications_duration" AS ENUM ('1_month', '3_months', 'season');
          END IF;
        END
        $$;
      `, { transaction });

            await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_license_prices_duration') THEN
            CREATE TYPE "enum_license_prices_duration" AS ENUM ('1_month', '3_months', 'season');
          END IF;
        END
        $$;
      `, { transaction });

            // Add boatType enum type
            await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_applications_boat_type') THEN
            CREATE TYPE "enum_applications_boat_type" AS ENUM ('private', 'agency');
          END IF;
        END
        $$;
      `, { transaction });

            await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_license_prices_boat_type') THEN
            CREATE TYPE "enum_license_prices_boat_type" AS ENUM ('private', 'agency');
          END IF;
        END
        $$;
      `, { transaction });

            // Add duration column to applications table
            await queryInterface.addColumn('applications', 'duration', {
                type: Sequelize.ENUM('1_month', '3_months', 'season'),
                allowNull: false,
                defaultValue: '3_months',
            }, { transaction });

            // Add boat_type column to applications table
            await queryInterface.addColumn('applications', 'boat_type', {
                type: Sequelize.ENUM('private', 'agency'),
                allowNull: true,
            }, { transaction });

            // Add duration column to license_prices table
            await queryInterface.addColumn('license_prices', 'duration', {
                type: Sequelize.ENUM('1_month', '3_months', 'season'),
                allowNull: false,
                defaultValue: '3_months',
            }, { transaction });

            // Add boat_type column to license_prices table
            await queryInterface.addColumn('license_prices', 'boat_type', {
                type: Sequelize.ENUM('private', 'agency'),
                allowNull: true,
            }, { transaction });

            await transaction.commit();
            console.log('Migration completed successfully!');
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Remove columns
            await queryInterface.removeColumn('applications', 'duration', { transaction });
            await queryInterface.removeColumn('applications', 'boat_type', { transaction });
            await queryInterface.removeColumn('license_prices', 'duration', { transaction });
            await queryInterface.removeColumn('license_prices', 'boat_type', { transaction });

            // Drop enum types
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_duration";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_boat_type";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_license_prices_duration";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_license_prices_boat_type";', { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
};
