const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Application Status Model - Lookup Table for Application Statuses
 * Provides translations, colors, icons, and workflow metadata
 */
const ApplicationStatus = sequelize.define(
    'ApplicationStatus',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            // unique constraint is handled in indexes
            comment: 'Unique status code (e.g., received, under_review)',
        },
        nameAr: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'name_ar',
            comment: 'Arabic display name',
        },
        nameEn: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'name_en',
            comment: 'English display name',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of this status',
        },
        category: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'other',
            comment: 'Status category: initial, payment, processing, final',
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#757575',
            comment: 'Hex color code for UI display',
        },
        icon: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'FontAwesome icon class (e.g., fa-check)',
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'display_order',
            comment: 'Order for displaying statuses',
        },
        nextStatuses: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            field: 'next_statuses',
            comment: 'Allowed next status codes (workflow rules)',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active',
            comment: 'Whether this status is currently in use',
        },
    },
    {
        tableName: 'application_statuses',
        timestamps: true,
        indexes: [
            { fields: ['code'], unique: true },
            { fields: ['category'] },
            { fields: ['is_active'] },
            { fields: ['display_order'] },
        ],
    }
);

/**
 * Get status by code
 * @param {string} code - Status code
 * @returns {Promise<ApplicationStatus>}
 */
ApplicationStatus.getByCode = async function (code) {
    return this.findOne({ where: { code, isActive: true } });
};

/**
 * Get all active statuses ordered by displayOrder
 * @returns {Promise<ApplicationStatus[]>}
 */
ApplicationStatus.getAllActive = async function () {
    return this.findAll({
        where: { isActive: true },
        order: [['displayOrder', 'ASC']],
    });
};

/**
 * Get statuses by category
 * @param {string} category - Category name
 * @returns {Promise<ApplicationStatus[]>}
 */
ApplicationStatus.getByCategory = async function (category) {
    return this.findAll({
        where: { category, isActive: true },
        order: [['displayOrder', 'ASC']],
    });
};

module.exports = ApplicationStatus;
