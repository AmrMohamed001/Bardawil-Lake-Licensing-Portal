const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Auth Routes - Based on SRS Section 5.3
 * All routes use Arabic messages
 */

// Test route - should always work
router.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Auth routes are working' });
});

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  authValidator.registerValidator,
  validatorMiddleware,
  authController.signup
);

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  authValidator.loginValidator,
  validatorMiddleware,
  authController.login
);

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, authController.logout);

// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh-token',
  authValidator.refreshTokenValidator,
  validatorMiddleware,
  authController.refreshAccessToken
);

// @route   POST /api/v1/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  authValidator.forgotPasswordValidator,
  validatorMiddleware,
  authController.forgotPassword
);

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  '/reset-password',
  authValidator.resetPasswordValidator,
  validatorMiddleware,
  authController.resetPassword
);

// @route   PATCH /api/v1/auth/update-password
// @desc    Update password for logged-in user
// @access  Private
router.patch(
  '/update-password',
  protect,
  authValidator.updatePasswordValidator,
  validatorMiddleware,
  authController.updatePassword
);

module.exports = router;
