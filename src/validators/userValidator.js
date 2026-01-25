const { body, param } = require('express-validator');

exports.updateProfileValidator = [
    body('firstNameAr')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('الاسم الأول يجب أن يكون بين 2 و 100 حرف'),
    body('lastNameAr')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم العائلة يجب أن يكون بين 2 و 100 حرف'),
    body('phone')
        .optional()
        .matches(/^(01|05)[0-9]{8,9}$/)
        .withMessage('رقم الهاتف يجب أن يكون بالصيغة المصرية'),
];

exports.userIdValidator = [
    param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
];

exports.adminUpdateUserValidator = [
    ...exports.userIdValidator,
    body('role')
        .optional()
        .isIn(['citizen', 'admin', 'super_admin'])
        .withMessage('الصلاحية غير صالحة'),
    body('status')
        .optional()
        .isIn(['active', 'suspended'])
        .withMessage('الحالة غير صالحة'),
];
