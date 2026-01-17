const catchAsync = require('../utils/catchAsync');
const applicationService = require('../services/applicationService');

/**
 * Application Controller - Handles HTTP layer for applications
 * Based on SRS Section 3.2
 */

// @desc    Create new license application
// @route   POST /api/v1/applications
// @access  Private
exports.createApplication = catchAsync(async (req, res, next) => {
  const result = await applicationService.createApplication(
    req.body,
    req.user.id,
    req.files
  );

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

// @desc    Get user's applications
// @route   GET /api/v1/applications
// @access  Private
exports.getMyApplications = catchAsync(async (req, res, next) => {
  const result = await applicationService.getUserApplications(
    req.user.id,
    req.query
  );

  res.status(200).json({
    status: 'success',
    results: result.applications.length,
    pagination: result.pagination,
    data: {
      applications: result.applications,
    },
  });
});

// @desc    Get application by ID
// @route   GET /api/v1/applications/:id
// @access  Private
exports.getApplication = catchAsync(async (req, res, next) => {
  const application = await applicationService.getApplicationById(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: {
      application,
    },
  });
});

// @desc    Track application by number (public)
// @route   GET /api/v1/applications/track/:applicationNumber
// @access  Public
exports.trackApplication = catchAsync(async (req, res, next) => {
  const application = await applicationService.getApplicationByNumber(
    req.params.applicationNumber
  );

  res.status(200).json({
    status: 'success',
    data: {
      application,
    },
  });
});

// @desc    Upload payment receipt
// @route   POST /api/v1/applications/:id/payment-receipt
// @access  Private
exports.uploadPaymentReceipt = catchAsync(async (req, res, next) => {
  // File path will be added by multer middleware
  const receiptPath = req.file ? req.file.path : null;

  if (!receiptPath) {
    return next(
      new (require('../utils/appError'))(400, 'يرجى رفع إيصال الدفع')
    );
  }

  const result = await applicationService.uploadPaymentReceipt(
    req.params.id,
    req.user.id,
    receiptPath
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Get user dashboard stats
// @route   GET /api/v1/applications/dashboard
// @access  Private
exports.getDashboard = catchAsync(async (req, res, next) => {
  const result = await applicationService.getUserDashboardStats(req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Cancel application
// @route   DELETE /api/v1/applications/:id
// @access  Private
exports.cancelApplication = catchAsync(async (req, res, next) => {
  const result = await applicationService.cancelApplication(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
