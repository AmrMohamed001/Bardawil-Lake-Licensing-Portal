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
router.get('/services', optionalAuth, viewController.getServices);

// Protected Routes (User) - Apply protect middleware to each route
router.get('/dashboard', protect, viewController.getDashboard);
router.get('/profile', protect, viewController.getProfile);
router.get('/apply', protect, viewController.getNewLicense);
router.get('/applications/:id', protect, viewController.getApplicationDetails);
router.get('/payment/:id', protect, viewController.getPaymentPage);
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

// Support both singular and plural routes
router.get(
  '/admin/application/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getReviewApplication
);

router.get(
  '/admin/applications/:id',
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

// Admin users management
router.get(
  '/admin/users',
  protect,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminUsers
);

// Super Admin Only Routes
router.get(
  '/admin/audit-logs',
  protect,
  restrictTo('super_admin'),
  viewController.getAuditLogs
);

// Super Admin Dashboard with charts and statistics
router.get(
  '/super-admin-dashboard',
  protect,
  restrictTo('super_admin'),
  viewController.getSuperAdminDashboard
);

module.exports = router;
