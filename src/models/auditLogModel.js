const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Audit Log Model
 * Records all important actions in the system for super admin review
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // null for system actions
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // Actions: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, STATUS_CHANGE, APPROVE, REJECT, VERIFY_PAYMENT, etc.
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // Entity types: user, application, price, notification, etc.
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'entity_id',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'previous_data',
    },
    newData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'new_data',
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 compatible
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_agent',
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false, // Audit logs are immutable
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity_type'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = AuditLog;
