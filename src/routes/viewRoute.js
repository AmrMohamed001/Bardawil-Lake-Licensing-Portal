const express = require('express');
const viewController = require('../controllers/viewController');
const {
  protect,
  optionalAuth,
  restrictTo,
} = require('../middlewares/authMiddleware');
const { attachUnreadCount } = require('../middlewares/notificationMiddleware');

const router = express.Router();

// Public Routes
// Public Routes
router.get('/', optionalAuth, attachUnreadCount, viewController.getHome);
router.get('/login', optionalAuth, attachUnreadCount, viewController.getLogin);
router.get('/register', optionalAuth, attachUnreadCount, viewController.getRegister);
router.get('/news', optionalAuth, attachUnreadCount, viewController.getNews);
router.get('/news/:id', optionalAuth, attachUnreadCount, viewController.getNewsDetail);
router.get('/contact', optionalAuth, attachUnreadCount, viewController.getContact);
router.get('/terms', optionalAuth, attachUnreadCount, viewController.getTerms);
router.get('/about', optionalAuth, attachUnreadCount, viewController.getAbout);
router.get('/services', optionalAuth, attachUnreadCount, viewController.getServices);
router.get('/pricing', optionalAuth, attachUnreadCount, viewController.getPricing);

// Protected Routes (User) - Apply protect and attachUnreadCount middleware
router.get('/dashboard', protect, attachUnreadCount, viewController.getDashboard);
router.get('/profile', protect, attachUnreadCount, viewController.getProfile);
router.get('/apply', protect, attachUnreadCount, viewController.getNewLicense);
router.get('/applications/:id', protect, attachUnreadCount, viewController.getApplicationDetails);
router.get('/payment/:id', protect, attachUnreadCount, viewController.getPaymentPage);
router.get('/notifications', protect, attachUnreadCount, viewController.getNotifications);

// Admin Routes - Apply protect, restrictTo, and attachUnreadCount middleware
router.get(
  '/admin-dashboard',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminDashboard
);

router.get(
  '/admin/applications',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminApplications
);

// Support both singular and plural routes
router.get(
  '/admin/application/:id',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getReviewApplication
);

router.get(
  '/admin/applications/:id',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getReviewApplication
);

router.get(
  '/admin/pricing',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminPricing
);

// Admin users management
router.get(
  '/admin/users',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminUsers
);

// Super Admin Only Routes
router.get(
  '/admin/audit-logs',
  protect,
  attachUnreadCount,
  restrictTo('super_admin'),
  viewController.getAuditLogs
);

// Admin news management
router.get(
  '/admin/news',
  protect,
  attachUnreadCount,
  restrictTo('admin', 'super_admin'),
  viewController.getAdminNews
);

// Super Admin Dashboard with charts and statistics
router.get(
  '/super-admin-dashboard',
  protect,
  attachUnreadCount,
  restrictTo('super_admin'),
  viewController.getSuperAdminDashboard
);

module.exports = router;

