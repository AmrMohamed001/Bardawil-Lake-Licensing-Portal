const catchAsync = require('../utils/catchAsync');
const notificationService = require('../services/notificationService');

/**
 * Notification Controller - Handles HTTP layer for notifications
 * Based on SRS Section 3.5
 */

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = catchAsync(async (req, res, next) => {
  const result = await notificationService.getUserNotifications(
    req.user.id,
    req.query
  );

  res.status(200).json({
    status: 'success',
    results: result.notifications.length,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
    data: {
      notifications: result.notifications,
    },
  });
});

// @desc    Get unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const result = await notificationService.getUnreadCount(req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = catchAsync(async (req, res, next) => {
  const result = await notificationService.markAsRead(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const result = await notificationService.deleteNotification(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
