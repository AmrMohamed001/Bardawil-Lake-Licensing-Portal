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
// User Management (Super Admin Only)
// =============================================

// @route   PUT /api/v1/admin/users/:id/role
router.put(
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

module.exports = router;
