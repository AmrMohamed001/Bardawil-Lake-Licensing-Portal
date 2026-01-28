const catchAsync = require('../utils/catchAsync');
const adminService = require('../services/adminService');
const pricingService = require('../services/pricingService');
const AppError = require('../utils/appError');
const { User } = require('../models');
const path = require('path');

/**
 * Admin Controller - Handles HTTP layer for admin panel
 * Based on SRS Section 3.4
 */

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboard = catchAsync(async (req, res, next) => {
  const stats = await adminService.getDashboardStats();

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

// @desc    Get all applications for admin
// @route   GET /api/v1/admin/applications
// @access  Private/Admin
exports.getAllApplications = catchAsync(async (req, res, next) => {
  const result = await adminService.getAllApplications(req.query);

  res.status(200).json({
    status: 'success',
    results: result.applications.length,
    pagination: result.pagination,
    data: {
      applications: result.applications,
    },
  });
});

// @desc    Get single application for review
// @route   GET /api/v1/admin/applications/:id
// @access  Private/Admin
exports.getApplicationForReview = catchAsync(async (req, res, next) => {
  const application = await adminService.getApplicationForReview(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      application,
    },
  });
});

// @desc    Start reviewing application
// @route   PUT /api/v1/admin/applications/:id/review
// @access  Private/Admin
exports.startReview = catchAsync(async (req, res, next) => {
  const result = await adminService.startReview(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Approve application
// @route   POST /api/v1/admin/applications/:id/approve
// @access  Private/Admin
exports.approveApplication = catchAsync(async (req, res, next) => {
  const result = await adminService.approveApplication(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Reject application
// @route   POST /api/v1/admin/applications/:id/reject
// @access  Private/Admin
exports.rejectApplication = catchAsync(async (req, res, next) => {
  const result = await adminService.rejectApplication(
    req.params.id,
    req.user.id,
    req.body.reason
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Verify payment
// @route   PUT /api/v1/admin/applications/:id/verify-payment
// @access  Private/Admin
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const result = await adminService.verifyPayment(req.params.id, req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Mark license as ready
// @route   PUT /api/v1/admin/applications/:id/ready
// @access  Private/Admin
exports.markLicenseReady = catchAsync(async (req, res, next) => {
  const result = await adminService.markLicenseReady(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Complete application
// @route   PUT /api/v1/admin/applications/:id/complete
// @access  Private/Admin
exports.completeApplication = catchAsync(async (req, res, next) => {
  const result = await adminService.completeApplication(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// =============================================
// Pricing Management (FR-ADMIN-003)
// =============================================

// @desc    Get all license prices
// @route   GET /api/v1/admin/prices
// @access  Private/Admin
exports.getAllPrices = catchAsync(async (req, res, next) => {
  const prices = await pricingService.getAllPrices(req.query);

  res.status(200).json({
    status: 'success',
    results: prices.length,
    data: {
      prices,
    },
  });
});

// @desc    Get single price
// @route   GET /api/v1/admin/prices/:id
// @access  Private/Admin
exports.getPrice = catchAsync(async (req, res, next) => {
  const price = await pricingService.getPriceById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      price,
    },
  });
});

// @desc    Create new price
// @route   POST /api/v1/admin/prices
// @access  Private/Admin
exports.createPrice = catchAsync(async (req, res, next) => {
  const price = await pricingService.createPrice(req.body, req.user.id);

  res.status(201).json({
    status: 'success',
    data: {
      price,
    },
  });
});

// @desc    Update price
// @route   PUT /api/v1/admin/prices/:id
// @access  Private/Admin
exports.updatePrice = catchAsync(async (req, res, next) => {
  const price = await pricingService.updatePrice(
    req.params.id,
    req.body,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: {
      price,
    },
  });
});

// @desc    Delete price
// @route   DELETE /api/v1/admin/prices/:id
// @access  Private/Admin
exports.deletePrice = catchAsync(async (req, res, next) => {
  await pricingService.deletePrice(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// =============================================
// PDF Generation (FR-ADMIN-004)
// =============================================

// @desc    Get Supply Order (HTML for printing or JSON data)
// @route   GET /api/v1/admin/applications/:id/supply-order
// @access  Private/Admin
exports.getSupplyOrderPdf = catchAsync(async (req, res, next) => {
  const data = await adminService.getSupplyOrderData(req.params.id);

  res.status(200).json({
    status: 'success',
    data,
  });
});

// @desc    Get License Certificate (HTML for printing or JSON data)
// @route   GET /api/v1/admin/applications/:id/license-pdf
// @access  Private/Admin
exports.getLicensePdf = catchAsync(async (req, res, next) => {
  const data = await adminService.getLicenseData(req.params.id);

  res.status(200).json({
    status: 'success',
    data,
  });
});

// =============================================
// User Management (Super Admin Only)
// =============================================

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/SuperAdmin
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findByPk(id);

  if (!user) {
    return next(new AppError(404, 'المستخدم غير موجود'));
  }

  // Prevent changing own role
  if (user.id === req.user.id) {
    return next(new AppError(400, 'لا يمكنك تغيير صلاحيتك'));
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'تم تحديث صلاحية المستخدم بنجاح',
    data: {
      user: {
        id: user.id,
        role: user.role,
      },
    },
  });
});

// @desc    Update user status (activate/suspend)
// @route   PUT /api/v1/admin/users/:id/status
// @access  Private/SuperAdmin
exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await User.findByPk(id);

  if (!user) {
    return next(new AppError(404, 'المستخدم غير موجود'));
  }

  // Prevent deactivating own account
  if (user.id === req.user.id) {
    return next(new AppError(400, 'لا يمكنك تعليق حسابك'));
  }

  user.status = status;
  await user.save();

  const statusMessage = status === 'active' ? 'تم تفعيل الحساب بنجاح' : 'تم تعليق الحساب بنجاح';

  res.status(200).json({
    status: 'success',
    message: statusMessage,
    data: {
      user: {
        id: user.id,
        status: user.status,
      },
    },
  });
});

// =============================================
// License Review (FR-ADMIN-005)
// =============================================

// @desc    Get license review data (grouped by license type)
// @route   GET /api/v1/admin/license-review
// @access  Private/Admin
exports.getLicenseReview = catchAsync(async (req, res, next) => {
  const result = await adminService.getLicenseReview(req.query);

  res.status(200).json({
    status: 'success',
    results: result.applications.length,
    pagination: result.pagination,
    statistics: result.statistics,
    data: {
      applications: result.applications,
    },
  });
});

// @desc    Get license review statistics
// @route   GET /api/v1/admin/license-review/stats
// @access  Private/Admin
exports.getLicenseReviewStats = catchAsync(async (req, res, next) => {
  const stats = await adminService.getLicenseReviewStats();

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});
