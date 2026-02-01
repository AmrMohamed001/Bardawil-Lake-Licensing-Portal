const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
  protect,
  isAdmin,
  isSuperAdmin,
} = require('../middlewares/authMiddleware');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const adminValidator = require('../validators/adminValidator');

/**
 * Admin Routes - Based on SRS Section 5.3
 * All routes require admin authentication
 */

// Apply auth middleware to all routes
router.use(protect, isAdmin);

// =============================================
// Dashboard
// =============================================

// @route   GET /api/v1/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// =============================================
// User Management (Super Admin Only) - must be before parametric routes
// =============================================

// @route   PUT /api/v1/admin/users/:id/role
router.put(
  '/users/:id/role',
  isSuperAdmin,
  adminValidator.updateUserRoleValidator,
  validatorMiddleware,
  adminController.updateUserRole
);
// @route   PATCH /api/v1/admin/users/:id/role (same handler, for client compatibility)
router.patch(
  '/users/:id/role',
  isSuperAdmin,
  adminValidator.updateUserRoleValidator,
  validatorMiddleware,
  adminController.updateUserRole
);

// @route   PUT /api/v1/admin/users/:id/status
router.put(
  '/users/:id/status',
  isSuperAdmin,
  adminValidator.updateUserStatusValidator,
  validatorMiddleware,
  adminController.updateUserStatus
);

// =============================================
// Applications Management
// =============================================

// @route   GET /api/v1/admin/applications
router.get('/applications', adminController.getAllApplications);

// @route   GET /api/v1/admin/applications/:id
router.get(
  '/applications/:id',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.getApplicationForReview
);

// =============================================
// Review Lock Management
// =============================================

// @route   GET /api/v1/admin/applications/:id/lock (check lock status)
router.get(
  '/applications/:id/lock',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.checkReviewLock
);

// @route   POST /api/v1/admin/applications/:id/lock (acquire lock)
router.post(
  '/applications/:id/lock',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.acquireReviewLock
);

// @route   PUT /api/v1/admin/applications/:id/lock (extend lock / heartbeat)
router.put(
  '/applications/:id/lock',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.extendReviewLock
);

// @route   DELETE /api/v1/admin/applications/:id/lock (release lock)
router.delete(
  '/applications/:id/lock',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.releaseReviewLock
);

// @route   POST /api/v1/admin/applications/:id/lock/release (for page unload - POST works better with fetch keepalive)
router.post(
  '/applications/:id/lock/release',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.releaseReviewLock
);

// @route   PUT /api/v1/admin/applications/:id/review
router.put(
  '/applications/:id/review',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.startReview
);

// @route   POST /api/v1/admin/applications/:id/approve
router.post(
  '/applications/:id/approve',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.approveApplication
);

// @route   POST /api/v1/admin/applications/:id/reject
router.post(
  '/applications/:id/reject',
  adminValidator.rejectApplicationValidator,
  validatorMiddleware,
  adminController.rejectApplication
);

// @route   PUT /api/v1/admin/applications/:id/verify-payment
router.put(
  '/applications/:id/verify-payment',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.verifyPayment
);

// @route   PUT /api/v1/admin/applications/:id/ready
router.put(
  '/applications/:id/ready',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.markLicenseReady
);

// @route   PUT /api/v1/admin/applications/:id/complete
router.put(
  '/applications/:id/complete',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.completeApplication
);

// =============================================
// Pricing Management
// =============================================

// @route   GET /api/v1/admin/prices
router.get('/prices', adminController.getAllPrices);

// @route   GET /api/v1/admin/prices/:id
router.get(
  '/prices/:id',
  adminValidator.priceIdValidator,
  validatorMiddleware,
  adminController.getPrice
);

// @route   POST /api/v1/admin/prices
router.post(
  '/prices',
  adminValidator.createPriceValidator,
  validatorMiddleware,
  adminController.createPrice
);

// @route   PUT /api/v1/admin/prices/:id
router.put(
  '/prices/:id',
  adminValidator.updatePriceValidator,
  validatorMiddleware,
  adminController.updatePrice
);

// @route   DELETE /api/v1/admin/prices/:id
router.delete(
  '/prices/:id',
  adminValidator.priceIdValidator,
  validatorMiddleware,
  adminController.deletePrice
);

// =============================================
// PDF Generation
// =============================================

// @route   GET /api/v1/admin/applications/:id/supply-order
router.get(
  '/applications/:id/supply-order',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.getSupplyOrderPdf
);

// @route   GET /api/v1/admin/applications/:id/license-pdf
router.get(
  '/applications/:id/license-pdf',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  adminController.getLicensePdf
);

// =============================================
// News Management
// =============================================
const newsController = require('../controllers/newsController');
const { uploadSingle, handleUploadError } = require('../middlewares/uploadMiddleware');

// @route   GET /api/v1/admin/news/stats
router.get('/news/stats', newsController.getNewsStats);

// @route   GET /api/v1/admin/news
router.get('/news', newsController.getAllNews);

// @route   GET /api/v1/admin/news/:id
router.get(
  '/news/:id',
  adminValidator.newsIdValidator,
  validatorMiddleware,
  newsController.getNewsById
);

// @route   POST /api/v1/admin/news
router.post(
  '/news',
  uploadSingle('image'),
  handleUploadError,
  adminValidator.createNewsValidator,
  validatorMiddleware,
  newsController.createNews
);

// @route   PUT /api/v1/admin/news/:id
router.put(
  '/news/:id',
  adminValidator.newsIdValidator,
  uploadSingle('image'),
  handleUploadError,
  validatorMiddleware,
  newsController.updateNews
);

// @route   DELETE /api/v1/admin/news/:id
router.delete(
  '/news/:id',
  adminValidator.newsIdValidator,
  validatorMiddleware,
  newsController.deleteNews
);

// @route   PATCH /api/v1/admin/news/:id/publish
router.patch(
  '/news/:id/publish',
  adminValidator.newsIdValidator,
  validatorMiddleware,
  newsController.togglePublish
);

// =============================================
// Audit Logs (Super Admin Only)
// =============================================
const auditLogController = require('../controllers/auditLogController');
router.get('/audit-logs', isSuperAdmin, auditLogController.getAuditLogs);

// =============================================
// Export Functions
// =============================================
const exportController = require('../controllers/exportController');

// Export applications to Excel
router.get('/applications/export/excel', exportController.exportApplicationsExcel);

// Export single application to PDF
router.get(
  '/applications/:id/export/pdf',
  adminValidator.applicationIdValidator,
  validatorMiddleware,
  exportController.exportApplicationPDF
);

// Audit logs exports (Super Admin Only)
router.get('/audit/export/excel', isSuperAdmin, exportController.exportAuditLogsExcel);
router.get('/audit/export/csv', isSuperAdmin, exportController.exportAuditLogsCSV);

// =============================================
// License Review
// =============================================

// @route   GET /api/v1/admin/license-review
router.get('/license-review', adminController.getLicenseReview);

// @route   GET /api/v1/admin/license-review/stats
router.get('/license-review/stats', adminController.getLicenseReviewStats);

// @route   GET /api/v1/admin/license-review/export/excel
router.get('/license-review/export/excel', exportController.exportLicenseReviewExcel);

module.exports = router;
