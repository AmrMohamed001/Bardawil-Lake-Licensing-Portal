const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Notification Model - Based on SRS Section 5.2.4
 * In-app notifications in Arabic
 */
const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
    },
    type: {
      type: DataTypes.ENUM(
        'application_received', // تم استلام الطلب
        'application_under_review', // الطلب قيد المراجعة
        'application_approved', // تم قبول الطلب - مطلوب الدفع
        'supply_order_generated', // تم إنشاء أمر التوريد
        'payment_received', // تم استلام إيصال الدفع
        'payment_verified', // تم التحقق من الدفع
        'payment_success', // تم الدفع بنجاح (Paymob)
        'payment_failed', // فشل الدفع (Paymob)
        'license_ready', // الرخصة جاهزة للاستلام
        'application_rejected', // تم رفض الطلب
        'license_expiry_warning', // تحذير انتهاء صلاحية الرخصة
        'system_announcement' // إعلانات النظام
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Reference to related application (optional)
    applicationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'applications',
        key: 'id',
      },
      field: 'application_id',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      // Optimization: Composite index for unread count queries (frequent)
      { fields: ['user_id', 'is_read'] },
      // Optimization: Composite index for user feed sorting
      { fields: ['user_id', 'created_at'] },
    ],
  }
);

module.exports = Notification;
