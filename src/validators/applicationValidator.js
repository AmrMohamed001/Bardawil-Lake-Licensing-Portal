const { body, param, query } = require('express-validator');

/**
 * Application Validators - Based on SRS Section 3.2
 * Arabic validation messages
 */

// Fisherman categories - only actual fisherman types
const fishermanCategories = ['صياد مؤمن عليه', 'صياد غير مؤمن عليه', 'صياد تحت السن'];

// Other categories - تاجر، مندوب، شيال، عامل تاجر
const otherCategories = ['مندوب', 'تاجر', 'عامل تاجر', 'شيال'];

// Boat categories
const boatCategories = ['مركب'];

// Vehicle categories
const vehicleCategories = ['مركبة', 'تروسيكل'];

/**
 * Create application validator
 */
exports.createApplicationValidator = [
  body('applicationType')
    .notEmpty()
    .withMessage('نوع الطلب مطلوب')
    .isIn(['fisherman', 'boat', 'vehicle', 'other'])
    .withMessage('نوع الطلب غير صالح'),

  body('licenseCategory')
    .notEmpty()
    .withMessage('فئة الترخيص مطلوبة')
    .custom((value, { req }) => {
      const { applicationType } = req.body;
      if (
        applicationType === 'fisherman' &&
        !fishermanCategories.includes(value)
      ) {
        throw new Error('فئة الصياد غير صالحة');
      }
      if (
        applicationType === 'other' &&
        !otherCategories.includes(value)
      ) {
        throw new Error('فئة الترخيص غير صالحة');
      }
      if (
        applicationType === 'boat' &&
        !boatCategories.includes(value)
      ) {
        throw new Error('فئة المركب غير صالحة');
      }
      if (applicationType === 'vehicle' && !vehicleCategories.includes(value)) {
        throw new Error('فئة السيارة غير صالحة');
      }
      return true;
    }),

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
  // For renewals: require previous license number
  body('previousLicenseNumber')
    .if(body('applicationType').equals('fisherman'))
    .if(body('isRenewal').custom(val => val === true || val === 'true'))
    .notEmpty()
    .withMessage('رقم الرخصة السابقة مطلوب')
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم الرخصة السابقة غير صالح'),

  body('marina')
    .if(body('applicationType').custom(val => val === 'fisherman' || val === 'other'))
    .notEmpty()
    .withMessage('المرسى مطلوب')
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
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم تسجيل المركب غير صالح'),

  body('boatLength')
    .if(body('applicationType').equals('boat'))
    .optional()
    .isNumeric()
    .withMessage('طول المركب يجب أن يكون رقماً'),

  body('enginePower')
    .if(body('applicationType').equals('boat'))
    .optional()
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

  body('vehicleYear')
    .if(body('applicationType').equals('vehicle'))
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('سنة الصنع غير صالحة'),

  body('capacity')
    .if(body('applicationType').equals('vehicle'))
    .optional()
    .isNumeric()
    .withMessage('السعة يجب أن تكون رقماً'),

  // ============================================
  // RENEWAL REQUIRED FIELDS
  // ============================================
  body('previousBoatNumber')
    .if(body('isRenewal').equals('true'))
    .if(body('applicationType').equals('boat'))
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('رقم المركب في الموسم السابق غير صالح'),
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
    .isIn(['fisherman', 'boat', 'vehicle', 'other'])
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
