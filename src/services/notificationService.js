const { Notification } = require('../models');
const AppError = require('../utils/appError');

/**
 * Notification Service - Handles in-app notifications
 * Based on SRS Section 3.5
 */

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 */
exports.getUserNotifications = async (userId, query = {}) => {
  const { read, page = 1, limit = 20 } = query;

  const where = { userId };

  if (read !== undefined) {
    where.isRead = read === 'true';
  }

  const offset = (page - 1) * limit;

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  // Count unread
  const unreadCount = await Notification.count({
    where: { userId, isRead: false },
  });

  return {
    notifications,
    unreadCount,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    },
  };
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 */
exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new AppError(404, 'الإشعار غير موجود');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return { message: 'تم تحديد الإشعار كمقروء' };
};

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 */
exports.markAllAsRead = async userId => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );

  return { message: 'تم تحديد جميع الإشعارات كمقروءة' };
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 */
exports.deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new AppError(404, 'الإشعار غير موجود');
  }

  await notification.destroy();

  return { message: 'تم حذف الإشعار' };
};

/**
 * Get unread count
 * @param {string} userId - User ID
 */
exports.getUnreadCount = async userId => {
  const count = await Notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount: count };
};
