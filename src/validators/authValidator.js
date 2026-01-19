const { body } = require('express-validator');

/**
 * Auth Validators - Based on SRS Section 3.1
 * Arabic validation messages
 */

// Validate Egyptian National ID (14 digits)
const validateNationalId = () =>
  body('nationalId')
    .notEmpty()
    .withMessage('الرقم القومي مطلوب')
    .isLength({ min: 14, max: 14 })
    .withMessage('الرقم القومي يجب أن يتكون من 14 رقم')
    .isNumeric()
    .withMessage('الرقم القومي يجب أن يحتوي على أرقام فقط');

// Validate Egyptian phone number
const validatePhone = () =>
  body('phone')
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .matches(/^(01|05)[0-9]{8,9}$/)
    .withMessage('رقم الهاتف يجب أن يكون بالصيغة المصرية (مثال: 01xxxxxxxxx)');

// Validate Arabic name
const validateArabicName = (field, label) =>
  body(field)
    .notEmpty()
    .withMessage(`${label} مطلوب`)
    .isLength({ min: 2, max: 100 })
    .withMessage(`${label} يجب أن يكون بين 2 و 100 حرف`)
    .matches(/^[\u0600-\u06FF\s]+$/)
    .withMessage(`${label} يجب أن يكون بالعربية`);

// Validate password
const validatePassword = (field = 'password') =>
  body(field)
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل');

// Validate password confirmation
const validatePasswordConfirm = () =>
  body('passwordConfirm')
    .notEmpty()
    .withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      }
      return true;
    });

/**
 * Registration validation rules
 * Based on FR-AUTH-001
 */
exports.registerValidator = [
  validateNationalId(),
  validateArabicName('firstNameAr', 'الاسم الأول'),
  validateArabicName('lastNameAr', 'اسم العائلة'),
  validatePhone(),
  validatePassword(),
  validatePasswordConfirm(),
];

/**
 * Login validation rules
 * Based on FR-AUTH-002
 */
exports.loginValidator = [
  validateNationalId(),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

/**
 * Forgot password validation
 */
exports.forgotPasswordValidator = [validateNationalId(), validatePhone()];

/**
 * Reset password validation
 */
exports.resetPasswordValidator = [
  body('token').notEmpty().withMessage('رمز إعادة التعيين مطلوب'),
  validatePassword('newPassword'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      }
      return true;
    }),
];

/**
 * Update password validation
 */
exports.updatePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  validatePassword('newPassword'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
      }
      return true;
    }),
];

/**
 * Refresh token validation
 */
exports.refreshTokenValidator = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('رمز التحديث غير صالح'),
];
