const { Op } = require('sequelize');
const AuditLog = require('../models/auditLogModel');
const { User } = require('../models');

/**
 * Audit Log Service
 * Provides logging and query functionality for audit logs
 */

/**
 * Log an action to the audit log
 * @param {Object} params - Log parameters
 * @param {string} params.userId - ID of user performing action (null for system)
 * @param {string} params.action - Action type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, STATUS_CHANGE, etc.)
 * @param {string} params.entityType - Type of entity (user, application, price, etc.)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.description - Human-readable description (Arabic)
 * @param {Object} params.previousData - Previous state (for updates)
 * @param {Object} params.newData - New state (for creates/updates)
 * @param {Object} params.req - Express request object (for IP and user agent)
 */
exports.logAction = async ({
  userId,
  action,
  entityType,
  entityId = null,
  description = null,
  previousData = null,
  newData = null,
  req = null,
}) => {
  try {
    const logEntry = {
      userId,
      action,
      entityType,
      entityId,
      description,
      previousData,
      newData,
      ipAddress: req ? req.ip || req.connection?.remoteAddress : null,
      userAgent: req ? req.get('User-Agent') : null,
    };

    await AuditLog.create(logEntry);
  } catch (error) {
    // Don't throw errors from audit logging - log to console instead
    console.error('Audit log error:', error.message);
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} query - Query parameters
 */
exports.getAuditLogs = async (query = {}) => {
  const {
    action,
    entityType,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = query;

  const where = {};

  if (action) {
    where.action = action;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.createdAt[Op.lte] = new Date(endDate);
    }
  }

  const offset = (page - 1) * limit;

  const { count, rows: logs } = await AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstNameAr', 'lastNameAr', 'nationalId', 'role'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return {
    logs,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    },
  };
};

/**
 * Get available action types for filtering
 */
exports.getActionTypes = () => [
  'LOGIN',
  'LOGOUT',
  'REGISTER',
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'APPROVE',
  'REJECT',
  'VERIFY_PAYMENT',
  'PRICE_UPDATE',
];

/**
 * Get available entity types for filtering
 */
exports.getEntityTypes = () => [
  'user',
  'application',
  'price',
  'notification',
  'document',
];
