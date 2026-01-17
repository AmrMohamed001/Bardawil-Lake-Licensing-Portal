const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * License Price Model - Based on SRS Section 5.2.5
 * Configurable pricing for different license types
 */
const LicensePrice = sequelize.define(
  'LicensePrice',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    licenseType: {
      type: DataTypes.ENUM('fisherman', 'boat', 'vehicle', 'individual_float'),
      allowNull: false,
      field: 'license_type',
    },
    // Category in Arabic: صياد، صياد تحت السن، مندوب، تاجر، عامل تاجر، شيال، مركب، سيارة
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    isRenewalPrice: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_renewal_price',
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_from',
    },
    effectiveUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_until',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'created_by',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'license_prices',
    timestamps: true,
    indexes: [
      { fields: ['license_type', 'category'] },
      { fields: ['is_active'] },
      { fields: ['effective_from'] },
    ],
  }
);

// Get current active price for a license type and category
LicensePrice.getCurrentPrice = async function (
  licenseType,
  category,
  isRenewal = false
) {
  const today = new Date().toISOString().split('T')[0];

  return this.findOne({
    where: {
      licenseType,
      category,
      isRenewalPrice: isRenewal,
      isActive: true,
      effectiveFrom: {
        [require('sequelize').Op.lte]: today,
      },
      [require('sequelize').Op.or]: [
        { effectiveUntil: null },
        {
          effectiveUntil: {
            [require('sequelize').Op.gte]: today,
          },
        },
      ],
    },
    order: [['effectiveFrom', 'DESC']],
  });
};

module.exports = LicensePrice;
