const express = require('express');
const viewController = require('../controllers/viewController');
const {
  protect,
  optionalAuth,
  restrictTo,
} = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Routes
// Public Routes
router.get('/', optionalAuth, viewController.getHome);
router.get('/login', optionalAuth, viewController.getLogin);
router.get('/register', optionalAuth, viewController.getRegister);
router.get('/news', optionalAuth, viewController.getNews);
router.get('/news/:id', optionalAuth, viewController.getNewsDetail);
router.get('/contact', optionalAuth, viewController.getContact);
router.get('/about', optionalAuth, viewController.getAbout);

// Protected Routes (User) - Apply protect middleware to each route
router.get('/dashboard', protect, viewController.getDashboard);
router.get('/profile', protect, viewController.getProfile);
router.get('/apply', protect, viewController.getNewLicense);
router.get('/applications/:id', protect, viewController.getApplicationDetails);
router.get('/notifications', protect, viewController.getNotifications);

// Admin Routes - Apply both protect and restrictTo middleware
router.get(
  '/admin-dashboard',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminDashboard
);

router.get(
  '/admin/applications',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminApplications
);

router.get(
  '/admin/application/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getReviewApplication
);

router.get(
  '/admin/pricing',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminPricing
);

// Super Admin Only Routes
router.get(
  '/admin/audit-logs',
  protect,
  restrictTo('super_admin'),
  viewController.getAuditLogs
);

module.exports = router;
