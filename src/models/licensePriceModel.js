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
      type: DataTypes.ENUM('fisherman', 'boat', 'trade', 'entry', 'vehicle', 'other'),
      allowNull: false,
      field: 'license_type',
    },
    // Category in Arabic
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    // Duration of license: 1 month, 3 months, 6 months, or season (9 months)
    // NOTE: This should match baseDuration for new entries
    duration: {
      type: DataTypes.ENUM('1_month', '3_months', '6_months', 'season'),
      allowNull: false,
      defaultValue: 'season',
    },
    // Base duration for this category (admin only sets price for base duration)
    baseDuration: {
      type: DataTypes.ENUM('1_month', '3_months', 'season'),
      allowNull: false,
      field: 'base_duration',
    },
    // For boat licenses: private or agency boat
    boatType: {
      type: DataTypes.ENUM('private', 'agency'),
      allowNull: true,
      field: 'boat_type',
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
      allowNull: true,
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
    hooks: {
      beforeValidate: (price) => {
        // Ensure duration equals baseDuration for new records
        if (!price.duration || price.isNewRecord) {
          price.duration = price.baseDuration;
        }
      },
    },
  }
);

// Category to base duration mapping
LicensePrice.CATEGORY_BASE_DURATIONS = {
  // 1 month base
  'تاجر': '1_month',
  'مندوب': '1_month',
  'تاجر خارج المحافظة': '1_month',
  'سيارة': '1_month',
  'نجار': '1_month',
  'ميكانيكي': '1_month',

  // 3 months base
  'صياد مؤمن عليه': '3_months',
  'صياد غير مؤمن عليه': '3_months',
  'صياد تحت السن': '3_months',
  'صيد رجلي': '3_months',
  'عامل تاجر': '3_months',
  'بياع': '3_months',
  'شيال': '3_months',
  'تروسيكل': '3_months',
  'أفراد شركات': '3_months',

  // Season only
  'مركب خاص': 'season',
  'مركب الجهاز': 'season',
  'تغيير مرسي': 'season',
  'تغيير موتور': 'season',
};

// Duration to months mapping
LicensePrice.DURATION_MONTHS = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  'season': 9,
};

// Calculate price for a target duration based on base price and base duration
LicensePrice.calculatePriceForDuration = function (
  basePrice,
  baseDuration,
  targetDuration
) {
  if (baseDuration === targetDuration) {
    return parseFloat(basePrice);
  }

  const baseMonths = this.DURATION_MONTHS[baseDuration];
  const targetMonths = this.DURATION_MONTHS[targetDuration];

  if (!baseMonths || !targetMonths) {
    throw new Error(`Invalid duration: base=${baseDuration}, target=${targetDuration}`);
  }

  // Formula: targetPrice = basePrice × (targetMonths / baseMonths)
  const calculatedPrice = parseFloat(basePrice) * (targetMonths / baseMonths);
  return Math.round(calculatedPrice * 100) / 100; // Round to 2 decimals
};

// Get current active price for a license type and category (with calculation)
LicensePrice.getCurrentPrice = async function (
  licenseType,
  category,
  isRenewal = false,
  duration = '3_months',
  boatType = null
) {
  const today = new Date().toISOString().split('T')[0];
  const { Op } = require('sequelize');

  // Find base price record (only search for baseDuration, not target duration)
  const whereClause = {
    licenseType,
    category,
    isRenewalPrice: isRenewal,
    isActive: true,
    effectiveFrom: {
      [Op.lte]: today,
    },
    [Op.or]: [
      { effectiveUntil: null },
      {
        effectiveUntil: {
          [Op.gte]: today,
        },
      },
    ],
  };

  // Add boatType filter for boat licenses
  if (licenseType === 'boat' && boatType) {
    whereClause.boatType = boatType;
  }

  let basePriceRecord = await this.findOne({
    where: whereClause,
    order: [['effectiveFrom', 'DESC']],
  });

  // Fallback: If no renewal price found, try to find regular price
  if (!basePriceRecord && isRenewal) {
    whereClause.isRenewalPrice = false;
    basePriceRecord = await this.findOne({
      where: whereClause,
      order: [['effectiveFrom', 'DESC']],
    });
  }

  if (!basePriceRecord) {
    return null;
  }

  // Calculate price for requested duration
  const calculatedPrice = this.calculatePriceForDuration(
    basePriceRecord.price,
    basePriceRecord.baseDuration,
    duration
  );

  // Return a price object with calculated value
  return {
    ...basePriceRecord.toJSON(),
    price: calculatedPrice,
    basePrice: parseFloat(basePriceRecord.price),
    baseDuration: basePriceRecord.baseDuration,
    requestedDuration: duration,
  };
};

module.exports = LicensePrice;
