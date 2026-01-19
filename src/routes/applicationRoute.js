const express = require('express');
const router = express.Router();

const applicationController = require('../controllers/applicationController');
const applicationValidator = require('../validators/applicationValidator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  uploadSingle,
  uploadFields,
  handleUploadError,
} = require('../middlewares/uploadMiddleware');

/**
 * Application Routes - Based on SRS Section 5.3
 */

// @route   GET /api/v1/applications/dashboard
// @desc    Get user dashboard stats
// @access  Private
router.get('/dashboard', protect, applicationController.getDashboard);

// @route   GET /api/v1/applications/track/:applicationNumber
// @desc    Track application by number (public)
// @access  Public
router.get(
  '/track/:applicationNumber',
  applicationValidator.applicationNumberValidator,
  validatorMiddleware,
  applicationController.trackApplication
);

// @route   GET /api/v1/applications
// @desc    Get user's applications
// @access  Private
router.get(
  '/',
  protect,
  applicationValidator.getApplicationsValidator,
  validatorMiddleware,
  applicationController.getMyApplications
);

const {
  validateRequiredFiles,
} = require('../middlewares/fileValidatorMiddleware');

// ...

// @route   POST /api/v1/applications
// @desc    Create new application
// @access  Private
router.post(
  '/',
  protect,
  uploadFields,
  handleUploadError,
  validateRequiredFiles,
  applicationValidator.createApplicationValidator,
  validatorMiddleware,
  applicationController.createApplication
);

// @route   GET /api/v1/applications/:id
// @desc    Get application by ID
// @access  Private
router.get(
  '/:id',
  protect,
  applicationValidator.applicationIdValidator,
  validatorMiddleware,
  applicationController.getApplication
);

// @route   POST /api/v1/applications/:id/payment-receipt
// @desc    Upload payment receipt
// @access  Private
router.post(
  '/:id/payment-receipt',
  protect,
  applicationValidator.applicationIdValidator,
  validatorMiddleware,
  uploadSingle('payment_receipt'),
  handleUploadError,
  applicationController.uploadPaymentReceipt
);

// @route   DELETE /api/v1/applications/:id
// @desc    Cancel application
// @access  Private
router.delete(
  '/:id',
  protect,
  applicationValidator.applicationIdValidator,
  validatorMiddleware,
  applicationController.cancelApplication
);

module.exports = router;
