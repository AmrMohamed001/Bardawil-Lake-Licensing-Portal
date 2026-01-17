const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Application Status History Model - Based on SRS Section 5.2.7
 * Tracks all status changes for audit purposes
 */
const ApplicationStatusHistory = sequelize.define(
  'ApplicationStatusHistory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'applications',
        key: 'id',
      },
      field: 'application_id',
    },
    oldStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'old_status',
    },
    newStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'new_status',
    },
    changedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'changed_by',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'changed_at',
    },
  },
  {
    tableName: 'application_status_history',
    timestamps: false,
    indexes: [{ fields: ['application_id'] }, { fields: ['changed_at'] }],
  }
);

module.exports = ApplicationStatusHistory;
