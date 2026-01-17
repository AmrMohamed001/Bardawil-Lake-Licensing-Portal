const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
  protect,
  isAdmin,
  isSuperAdmin,
} = require('../middlewares/authMiddleware');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const { param, body } = require('express-validator');

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
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.getApplicationForReview
);

// @route   PUT /api/v1/admin/applications/:id/review
router.put(
  '/applications/:id/review',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.startReview
);

// @route   POST /api/v1/admin/applications/:id/approve
router.post(
  '/applications/:id/approve',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.approveApplication
);

// @route   POST /api/v1/admin/applications/:id/reject
router.post(
  '/applications/:id/reject',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  body('reason').notEmpty().withMessage('سبب الرفض مطلوب'),
  validatorMiddleware,
  adminController.rejectApplication
);

// @route   PUT /api/v1/admin/applications/:id/verify-payment
router.put(
  '/applications/:id/verify-payment',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.verifyPayment
);

// @route   PUT /api/v1/admin/applications/:id/ready
router.put(
  '/applications/:id/ready',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.markLicenseReady
);

// @route   PUT /api/v1/admin/applications/:id/complete
router.put(
  '/applications/:id/complete',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
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
  param('id').isUUID().withMessage('معرف السعر غير صالح'),
  validatorMiddleware,
  adminController.getPrice
);

// @route   POST /api/v1/admin/prices
router.post(
  '/prices',
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
  validatorMiddleware,
  adminController.createPrice
);

// @route   PUT /api/v1/admin/prices/:id
router.put(
  '/prices/:id',
  param('id').isUUID().withMessage('معرف السعر غير صالح'),
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
  validatorMiddleware,
  adminController.updatePrice
);

// @route   DELETE /api/v1/admin/prices/:id
router.delete(
  '/prices/:id',
  param('id').isUUID().withMessage('معرف السعر غير صالح'),
  validatorMiddleware,
  adminController.deletePrice
);

// =============================================
// PDF Generation
// =============================================

// @route   GET /api/v1/admin/applications/:id/supply-order
router.get(
  '/applications/:id/supply-order',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.getSupplyOrderPdf
);

// @route   GET /api/v1/admin/applications/:id/license-pdf
router.get(
  '/applications/:id/license-pdf',
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  validatorMiddleware,
  adminController.getLicensePdf
);

module.exports = router;

// =============================================
// Audit Logs (Super Admin Only) - imported at top level
// =============================================
const auditLogController = require('../controllers/auditLogController');
router.get('/audit-logs', isSuperAdmin, auditLogController.getAuditLogs);

module.exports = router;
