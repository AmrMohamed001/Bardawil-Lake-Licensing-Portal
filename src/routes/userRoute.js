const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const {
  protect,
  isAdmin,
  isSuperAdmin,
} = require('../middlewares/authMiddleware');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const {
  uploadSingle,
  handleUploadError,
} = require('../middlewares/uploadMiddleware');
const { param, body } = require('express-validator');

/**
 * User Routes - Profile and admin user management
 */

// Protected routes (logged in users)
router.use(protect);

// @route   GET /api/v1/users/me
router.get('/me', userController.getMe);

// @route   PATCH /api/v1/users/me
router.patch(
  '/me',
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
  validatorMiddleware,
  userController.updateMe
);

// @route   PUT /api/v1/users/me/picture
router.put(
  '/me/picture',
  uploadSingle('picture'),
  handleUploadError,
  userController.updateProfilePicture
);

// @route   DELETE /api/v1/users/me/picture
router.delete('/me/picture', userController.deleteProfilePicture);

// =============================================
// Admin Routes
// =============================================

// @route   GET /api/v1/users
router.get('/', isAdmin, userController.getAllUsers);

// @route   GET /api/v1/users/:id
router.get(
  '/:id',
  isAdmin,
  param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
  validatorMiddleware,
  userController.getUser
);

// @route   PATCH /api/v1/users/:id
router.patch(
  '/:id',
  isAdmin,
  param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
  body('role')
    .optional()
    .isIn(['citizen', 'admin', 'super_admin'])
    .withMessage('الصلاحية غير صالحة'),
  body('status')
    .optional()
    .isIn(['active', 'suspended'])
    .withMessage('الحالة غير صالحة'),
  validatorMiddleware,
  userController.updateUser
);

// @route   PUT /api/v1/users/:id/suspend
router.put(
  '/:id/suspend',
  isAdmin,
  param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
  validatorMiddleware,
  userController.suspendUser
);

// @route   PUT /api/v1/users/:id/activate
router.put(
  '/:id/activate',
  isAdmin,
  param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
  validatorMiddleware,
  userController.activateUser
);

// @route   DELETE /api/v1/users/:id
router.delete(
  '/:id',
  isSuperAdmin,
  param('id').isUUID().withMessage('معرف المستخدم غير صالح'),
  validatorMiddleware,
  userController.deleteUser
);

module.exports = router;
