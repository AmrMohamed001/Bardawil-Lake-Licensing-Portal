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
const userValidator = require('../validators/userValidator');

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
  userValidator.updateProfileValidator,
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
  userValidator.userIdValidator,
  validatorMiddleware,
  userController.getUser
);

// @route   PATCH /api/v1/users/:id
router.patch(
  '/:id',
  isAdmin,
  userValidator.adminUpdateUserValidator,
  validatorMiddleware,
  userController.updateUser
);

// @route   PUT /api/v1/users/:id/suspend
router.put(
  '/:id/suspend',
  isAdmin,
  userValidator.userIdValidator,
  validatorMiddleware,
  userController.suspendUser
);

// @route   PUT /api/v1/users/:id/activate
router.put(
  '/:id/activate',
  isAdmin,
  userValidator.userIdValidator,
  validatorMiddleware,
  userController.activateUser
);

// @route   DELETE /api/v1/users/:id
router.delete(
  '/:id',
  isSuperAdmin,
  userValidator.userIdValidator,
  validatorMiddleware,
  userController.deleteUser
);

module.exports = router;
