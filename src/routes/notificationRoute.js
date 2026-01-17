const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const { param } = require('express-validator');

/**
 * Notification Routes - Based on SRS Section 5.3
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/v1/notifications
router.get('/', notificationController.getNotifications);

// @route   GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// @route   PUT /api/v1/notifications/read-all
router.put('/read-all', notificationController.markAllAsRead);

// @route   PUT /api/v1/notifications/:id/read
router.put(
  '/:id/read',
  param('id').isUUID().withMessage('معرف الإشعار غير صالح'),
  validatorMiddleware,
  notificationController.markAsRead
);

// @route   DELETE /api/v1/notifications/:id
router.delete(
  '/:id',
  param('id').isUUID().withMessage('معرف الإشعار غير صالح'),
  validatorMiddleware,
  notificationController.deleteNotification
);

module.exports = router;
