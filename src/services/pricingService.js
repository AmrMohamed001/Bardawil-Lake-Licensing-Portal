const { LicensePrice } = require('../models');
const AppError = require('../utils/appError');

/**
 * Pricing Service - Handles license pricing management
 * Based on SRS Section 3.4.3
 */

/**
 * Get all prices
 * @param {Object} query - Query parameters
 */
exports.getAllPrices = async (query = {}) => {
  const { licenseType, category, active } = query;

  const where = {};

  if (licenseType) {
    where.licenseType = licenseType;
  }

  if (category) {
    where.category = category;
  }

  if (active !== undefined) {
    where.isActive = active === 'true';
  }

  return LicensePrice.findAll({
    where,
    order: [
      ['licenseType', 'ASC'],
      ['category', 'ASC'],
      ['isRenewalPrice', 'ASC'],
    ],
  });
};

/**
 * Get price by ID
 * @param {string} priceId - Price ID
 */
exports.getPriceById = async priceId => {
  const price = await LicensePrice.findByPk(priceId);

  if (!price) {
    throw new AppError(404, 'السعر غير موجود');
  }

  return price;
};

/**
 * Create new price
 * @param {Object} priceData - Price data
 * @param {string} adminId - Admin user ID
 */
exports.createPrice = async (priceData, adminId) => {
  const {
    licenseType,
    category,
    price,
    isRenewalPrice,
    effectiveFrom,
    effectiveUntil,
  } = priceData;

  // Check if price already exists for this combination
  const existing = await LicensePrice.findOne({
    where: {
      licenseType,
      category,
      isRenewalPrice: isRenewalPrice || false,
      isActive: true,
    },
  });

  if (existing) {
    throw new AppError(400, 'يوجد سعر نشط بالفعل لهذا النوع والفئة');
  }

  const newPrice = await LicensePrice.create({
    licenseType,
    category,
    price,
    isRenewalPrice: isRenewalPrice || false,
    effectiveFrom: effectiveFrom || new Date(),
    effectiveUntil,
    createdBy: adminId,
    isActive: true,
  });

  return newPrice;
};

/**
 * Update price
 * @param {string} priceId - Price ID
 * @param {Object} updateData - Update data
 * @param {string} adminId - Admin user ID
 */
exports.updatePrice = async (priceId, updateData, adminId) => {
  const price = await LicensePrice.findByPk(priceId);

  if (!price) {
    throw new AppError(404, 'السعر غير موجود');
  }

  const {
    price: newPriceValue,
    effectiveFrom,
    effectiveUntil,
    isActive,
  } = updateData;

  if (newPriceValue !== undefined) {
    price.price = newPriceValue;
  }

  if (effectiveFrom !== undefined) {
    price.effectiveFrom = effectiveFrom;
  }

  if (effectiveUntil !== undefined) {
    price.effectiveUntil = effectiveUntil;
  }

  if (isActive !== undefined) {
    price.isActive = isActive;
  }

  await price.save();

  return price;
};

/**
 * Delete price (soft delete - set inactive)
 * @param {string} priceId - Price ID
 */
exports.deletePrice = async priceId => {
  const price = await LicensePrice.findByPk(priceId);

  if (!price) {
    throw new AppError(404, 'السعر غير موجود');
  }

  price.isActive = false;
  await price.save();

  return { message: 'تم حذف السعر' };
};

/**
 * Seed default prices
 * @param {string} adminId - Admin user ID
 */
exports.seedDefaultPrices = async adminId => {
  const defaultPrices = [
    // Fisherman licenses
    {
      licenseType: 'fisherman',
      category: 'صياد',
      price: 500,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'صياد',
      price: 400,
      isRenewalPrice: true,
    },
    {
      licenseType: 'fisherman',
      category: 'صياد تحت السن',
      price: 300,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'مندوب',
      price: 600,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'تاجر',
      price: 1000,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'عامل تاجر',
      price: 400,
      isRenewalPrice: false,
    },
    {
      licenseType: 'fisherman',
      category: 'شيال',
      price: 350,
      isRenewalPrice: false,
    },
    // Boat licenses
    {
      licenseType: 'boat',
      category: 'مركب',
      price: 2000,
      isRenewalPrice: false,
    },
    {
      licenseType: 'boat',
      category: 'مركب',
      price: 1500,
      isRenewalPrice: true,
    },
    // Vehicle licenses
    {
      licenseType: 'vehicle',
      category: 'سيارة',
      price: 1000,
      isRenewalPrice: false,
    },
    {
      licenseType: 'vehicle',
      category: 'سيارة',
      price: 800,
      isRenewalPrice: true,
    },
    // Individual float
    {
      licenseType: 'individual_float',
      category: 'عائمة أفراد',
      price: 600,
      isRenewalPrice: false,
    },
  ];

  const today = new Date().toISOString().split('T')[0];

  for (const priceData of defaultPrices) {
    const existing = await LicensePrice.findOne({
      where: {
        licenseType: priceData.licenseType,
        category: priceData.category,
        isRenewalPrice: priceData.isRenewalPrice,
      },
    });

    if (!existing) {
      await LicensePrice.create({
        ...priceData,
        effectiveFrom: today,
        createdBy: adminId,
        isActive: true,
      });
    }
  }

  return { message: 'تم إضافة الأسعار الافتراضية' };
};
