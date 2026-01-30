const { body, param } = require('express-validator');

exports.applicationIdValidator = [
    param('id').isUUID().withMessage('معرف الطلب غير صالح'),
];

exports.rejectApplicationValidator = [
    ...exports.applicationIdValidator,
    body('reason').notEmpty().withMessage('سبب الرفض مطلوب'),
];

exports.priceIdValidator = [
    param('id').isUUID().withMessage('معرف السعر غير صالح'),
];

exports.createPriceValidator = [
    body('licenseType')
        .notEmpty()
        .withMessage('نوع الترخيص مطلوب')
        .isIn(['fisherman', 'boat', 'vehicle', 'individual_float'])
        .withMessage('نوع الترخيص غير صالح'),
    body('category').notEmpty().withMessage('الفئة مطلوبة'),
    body('price')
        .notEmpty()
        .withMessage('السعر مطلوب')
        .isFloat({ min: 0 })
        .withMessage('السعر يجب أن يكون رقم موجب'),
    body('effectiveFrom')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صالح'),
    body('effectiveUntil')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صالح'),
];

exports.updatePriceValidator = [
    ...exports.priceIdValidator,
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('السعر يجب أن يكون رقم موجب'),
    body('effectiveFrom')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صالح'),
    body('effectiveUntil')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صالح'),
    body('isActive').optional().isBoolean().withMessage('قيمة النشاط غير صالحة'),
];

exports.updateUserRoleValidator = [
    param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
    body('role').isIn(['citizen', 'admin', 'super_admin', 'financial_officer']).withMessage('الصلاحية غير صالحة'),
];

exports.updateUserStatusValidator = [
    param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
    body('status').isIn(['active', 'suspended']).withMessage('حالة الحساب غير صالحة'),
];

exports.newsIdValidator = [
    param('id').isUUID().withMessage('معرف الخبر غير صالح'),
];

exports.createNewsValidator = [
    body('titleAr').notEmpty().withMessage('العنوان بالعربية مطلوب'),
    body('contentAr').notEmpty().withMessage('المحتوى بالعربية مطلوب'),
];
