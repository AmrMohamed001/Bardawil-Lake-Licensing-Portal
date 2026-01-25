const { Notification } = require('../models');

/**
 * Notification Middleware
 * Adds unread notification count to res.locals for use in views
 */
const attachUnreadCount = async (req, res, next) => {
    try {
        if (req.user) {
            const unreadCount = await Notification.count({
                where: {
                    userId: req.user.id,
                    isRead: false,
                },
            });
            res.locals.unreadNotificationCount = unreadCount;
        } else {
            res.locals.unreadNotificationCount = 0;
        }
    } catch (error) {
        // Don't block the request if notification count fails
        res.locals.unreadNotificationCount = 0;
        console.error('Error fetching notification count:', error.message);
    }
    next();
};

module.exports = { attachUnreadCount };
