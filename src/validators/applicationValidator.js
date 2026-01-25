const { body, param, query } = require('express-validator');

/**
 * Application Validators - Based on SRS Section 3.2
 * Arabic validation messages
 */

// Normalize Arabic text helper
const normalizeArabic = (text) => {
  if (!text) return '';
  let normalized = text.trim();
  if (normalized.normalize) {
    normalized = normalized.normalize('NFC');
  }
  return normalized;
};

// Fisherman categories
const fishermanCategories = ['صياد مؤمن عليه', 'صياد غير مؤمن عليه', 'صياد تحت السن', 'صيد رجلي'];

// Trade categories
const tradeCategories = ['تاجر', 'مندوب', 'عامل تاجر', 'تاجر خارج المحافظة', 'بياع'];

// Entry categories
const entryCategories = ['شيال', 'نجار', 'ميكانيكي', 'أفراد شركات'];

// Boat categories
const boatCategories = ['مركب خاص', 'مركب الجهاز', 'تغيير مرسي', 'تغيير موتور'];

// Vehicle categories
const vehicleCategories = ['سيارة', 'تروسيكل'];

/**
 * Create application validator
 */
exports.createApplicationValidator = [
  body('applicationType')
    .notEmpty()
    .withMessage('نوع الطلب مطلوب')
    .isIn(['fisherman', 'boat', 'vehicle', 'trade', 'entry'])
    .withMessage('نوع الطلب غير صالح'),

  body('licenseCategory')
    .notEmpty()
    .withMessage('فئة الترخيص مطلوبة')
    .customSanitizer(value => normalizeArabic(value))
    .custom((value, { req }) => {
      const { applicationType } = req.body;
      const cleanValue = normalizeArabic(value);

      // Debug logging
      console.log('=== Category Validation Debug ===');
      console.log('Application Type:', applicationType);
      console.log('Received Category:', cleanValue);
      console.log('Category CharCodes:', cleanValue.split('').map(c => c.charCodeAt(0)));

      // Helper to check if value is in category list
      const inCategory = (categories) => {
        if (applicationType === 'boat') {
          console.log('Checking boat categories:');
          categories.forEach((cat, idx) => {
            const normalizedCat = normalizeArabic(cat);
            const match = normalizedCat === cleanValue;
            console.log(`  [${idx}] '${cat}' => normalized='${normalizedCat}' | match=${match}`);
            console.log(`       Codes: [${normalizedCat.split('').map(c => c.charCodeAt(0)).join(',')}]`);
          });
        }

        const found = categories.some(cat => {
          const normalizedCat = normalizeArabic(cat);
          return normalizedCat === cleanValue;
        });
        console.log('Found match:', found);
        return found;
      };

      // Validate based on application type
      if (applicationType === 'fisherman') {
        if (!inCategory(fishermanCategories)) {
          throw new Error(`فئة الصياد غير صالحة: ${cleanValue}`);
        }
      } else if (applicationType === 'trade') {
        if (!inCategory(tradeCategories)) {
          throw new Error(`فئة التجارة غير صالحة: ${cleanValue}`);
        }
      } else if (applicationType === 'entry') {
        if (!inCategory(entryCategories)) {
          throw new Error(`فئة الدخول غير صالحة: ${cleanValue}`);
        }
      } else if (applicationType === 'boat') {
        if (!inCategory(boatCategories)) {
          throw new Error(`فئة المركب غير صالحة: ${cleanValue}`);
        }
      } else if (applicationType === 'vehicle') {
        if (!inCategory(vehicleCategories)) {
          throw new Error(`فئة السيارة غير صالحة: ${cleanValue}`);
        }
      }

      return true;
    }),

  body('duration')
    .optional()
    .isIn(['1_month', '3_months', '6_months', 'season'])
    .withMessage('مدة الترخيص غير صالحة'),

  body('isRenewal')
    .optional()
    .customSanitizer(value => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return value;
    })
    .isBoolean()
    .withMessage('قيمة التجديد يجب أن تكون صحيحة أو خاطئة'),

  // ============================================
  // FISHERMAN REQUIRED FIELDS
  // ============================================
  body('previousLicenseNumber')
    .if(body('applicationType').equals('fisherman'))
    .if(body('isRenewal').custom(val => val === true || val === 'true'))
    .notEmpty()
    .withMessage('رقم الرخصة السابقة مطلوب')
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم الرخصة السابقة غير صالح'),

  body('marina')
    .if(body('applicationType').custom(val => ['fisherman', 'trade', 'entry'].includes(val)))
    .optional({ checkFalsy: true })
    .isIn(['اغزوان', 'النصر', 'التلول'])
    .withMessage('المرسى غير صالح'),

  // ============================================
  // BOAT REQUIRED FIELDS
  // ============================================
  body('boatNumber')
    .if(body('applicationType').equals('boat'))
    .if(body('isRenewal').custom(val => val === true || val === 'true'))
    .notEmpty()
    .withMessage('رقم الصال مطلوب')
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم الصال غير صالح'),

  body('boatRegistration')
    .if(body('applicationType').equals('boat'))
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم تسجيل المركب غير صالح'),

  body('boatLength')
    .if(body('applicationType').equals('boat'))
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('طول المركب يجب أن يكون رقماً'),

  body('enginePower')
    .if(body('applicationType').equals('boat'))
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('قوة المحرك يجب أن تكون رقماً'),

  // ============================================
  // VEHICLE REQUIRED FIELDS
  // ============================================
  body('plateNumber')
    .if(body('applicationType').equals('vehicle'))
    .notEmpty()
    .withMessage('رقم لوحة السيارة مطلوب')
    .isLength({ min: 1, max: 20 })
    .withMessage('رقم لوحة السيارة غير صالح'),

  body('vehicleType')
    .if(body('applicationType').equals('vehicle'))
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('نوع السيارة غير صالح'),
];

/**
 * Get applications query validator
 */
exports.getApplicationsValidator = [
  query('status')
    .optional()
    .isIn([
      'received',
      'under_review',
      'approved_payment_required',
      'payment_pending',
      'payment_submitted',
      'payment_verified',
      'processing',
      'ready',
      'rejected',
      'completed',
    ])
    .withMessage('حالة الطلب غير صالحة'),

  query('type')
    .optional()
    .isIn(['fisherman', 'boat', 'vehicle', 'trade', 'entry'])
    .withMessage('نوع الطلب غير صالح'),

  query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صالح'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد النتائج يجب أن يكون بين 1 و 100'),
];

/**
 * Application ID param validator
 */
exports.applicationIdValidator = [
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
];

/**
 * Application number param validator
 */
exports.applicationNumberValidator = [
  param('applicationNumber')
    .matches(/^BRD-\d{4}-\d{4}$/)
    .withMessage('رقم الطلب غير صالح. المثال: BRD-2026-0001'),
];
