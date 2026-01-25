/**
 * ServiceRequiredDocument Model
 * Stores required documents per service type/category
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ServiceRequiredDocument = sequelize.define(
    'ServiceRequiredDocument',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // Service category (e.g., 'تصريح بطاقة صيد', 'تصريح مركب جديد')
        serviceCategory: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'service_category',
        },
        // Document code for programmatic reference
        documentCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'document_code',
        },
        // Arabic name for display
        documentNameAr: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'document_name_ar',
        },
        // English name
        documentNameEn: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'document_name_en',
        },
        // Document type: 'file' for uploads, 'text' for text input, 'select' for dropdown
        inputType: {
            type: DataTypes.ENUM('file', 'text', 'select', 'date', 'number'),
            defaultValue: 'file',
            field: 'input_type',
        },
        // Validation rules as JSON (e.g., { "maxSize": "5MB", "allowedTypes": ["pdf", "jpg"] })
        validationRules: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'validation_rules',
        },
        // Whether this document is required
        isRequired: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_required',
        },
        // Display order
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'display_order',
        },
        // Help text for users
        helpText: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'help_text',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
        },
    },
    {
        tableName: 'service_required_documents',
        timestamps: true,
        indexes: [
            { fields: ['service_category'] },
            { fields: ['is_active'] },
            { fields: ['service_category', 'display_order'] },
        ],
    }
);

// Get required documents for a service category
ServiceRequiredDocument.getForService = async function (serviceCategory) {
    return await this.findAll({
        where: {
            serviceCategory,
            isActive: true,
        },
        order: [['displayOrder', 'ASC']],
    });
};

module.exports = ServiceRequiredDocument;
