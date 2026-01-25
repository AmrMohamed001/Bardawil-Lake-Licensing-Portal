const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Application Model - Based on SRS Section 5.2.2
 * Handles fisherman, boat, vehicle, and individual_float applications
 */
const Application = sequelize.define(
  'Application',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      field: 'application_number',
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
    applicationType: {
      type: DataTypes.ENUM('fisherman', 'boat', 'vehicle', 'trade', 'entry', 'other'),
      allowNull: false,
      field: 'application_type',
    },
    // For fisherman: صياد مؤمن عليه، صياد غير مؤمن عليه، صياد تحت السن
    // For other: مندوب، تاجر، عامل تاجر، شيال
    // For boat: مركب
    // For vehicle: مركبة، تروسيكل
    licenseCategory: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'license_category',
    },
    isRenewal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_renewal',
    },
    // License duration: 1 month, 3 months, 6 months, or season (9 months)
    duration: {
      type: DataTypes.ENUM('1_month', '3_months', '6_months', 'season'),
      allowNull: false,
      defaultValue: '3_months',
    },
    // For boat applications: private or agency boat
    boatType: {
      type: DataTypes.ENUM('private', 'agency'),
      allowNull: true,
      field: 'boat_type',
    },
    // Status - using lookup table for translations and metadata
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Temporarily nullable for migration
      references: {
        model: 'application_statuses',
        key: 'id',
      },
      field: 'status_id',
    },
    // Legacy status field - kept for backward compatibility
    // TODO: Remove after full migration to statusId
    status: {
      type: DataTypes.ENUM(
        'received',
        'under_review',
        'approved_payment_pending',
        'approved_payment_required',
        'payment_pending',
        'payment_submitted',
        'payment_verified',
        'processing',
        'ready',
        'rejected',
        'completed'
      ),
      defaultValue: 'received',
    },
    // Payment information
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'payment_amount',
    },
    supplyOrderId: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
      field: 'supply_order_id',
    },
    supplyOrderPath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'supply_order_path',
    },
    paymentReceiptPath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payment_receipt_path',
    },
    // Paymob payment integration fields
    paymobOrderId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'paymob_order_id',
    },
    paymentVerifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'payment_verified_by',
    },
    paymentVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_verified_at',
    },
    paymentVerificationNotes: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'payment_verification_notes',
    },
    paymobTransactionId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'paymob_transaction_id',
    },
    // Timestamps
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'reviewed_by',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    paymentVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_verified_at',
    },
    // Rejection info
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    // Application data (JSON for flexible form data)
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: 'applications',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['application_type'] },
      { fields: ['application_number'] },
      { fields: ['status_id'] },
      // Composite indexes for dashboard queries
      { fields: ['user_id', 'status'] },
      { fields: ['status', 'created_at'] },
      { fields: ['application_type', 'status'] },
    ],
    validate: {
      // Custom model-level validation
      validateRequiredFields() {
        const data = this.data || {};

        // Validate licenseCategory based on applicationType
        // Updated to match new categories
        const fishermanCategories = [
          'صياد مؤمن عليه',
          'صياد غير مؤمن عليه',
          'صياد تحت السن',
          'صيد رجلي',
        ];
        const tradeCategories = ['تاجر', 'مندوب', 'عامل تاجر', 'تاجر خارج المحافظة', 'بياع'];
        const entryCategories = ['شيال', 'نجار', 'ميكانيكي', 'أفراد شركات'];
        const boatCategories = ['مركب خاص', 'مركب الجهاز', 'تغيير مرسي', 'تغيير موتور'];
        const vehicleCategories = ['سيارة', 'تروسيكل'];

        if (
          this.applicationType === 'fisherman' &&
          !fishermanCategories.includes(this.licenseCategory)
        ) {
          throw new Error('فئة الصياد غير صالحة');
        }
        if (
          this.applicationType === 'trade' &&
          !tradeCategories.includes(this.licenseCategory)
        ) {
          throw new Error('فئة التجارة غير صالحة');
        }
        if (
          this.applicationType === 'entry' &&
          !entryCategories.includes(this.licenseCategory)
        ) {
          throw new Error('فئة الدخول غير صالحة');
        }
        if (
          this.applicationType === 'boat' &&
          !boatCategories.includes(this.licenseCategory)
        ) {
          throw new Error('فئة المركب غير صالحة');
        }
        if (
          this.applicationType === 'vehicle' &&
          !vehicleCategories.includes(this.licenseCategory)
        ) {
          throw new Error('فئة السيارة غير صالحة');
        }

        // Validate required fields in data based on applicationType
        if (this.applicationType === 'fisherman' || this.applicationType === 'other') {
          // For renewals, require previous license number
          if (this.isRenewal) {
            if (
              !data.previousLicenseNumber ||
              !data.previousLicenseNumber.trim()
            ) {
              throw new Error('رقم الرخصة السابقة مطلوب');
            }
          }
          if (!data.marina || !data.marina.trim()) {
            throw new Error('المرسى مطلوب');
          }
        }

        if (this.applicationType === 'boat') {
          if (this.isRenewal) {
            if (!data.boatNumber || !data.boatNumber.trim()) {
              throw new Error('رقم الصال مطلوب');
            }
          }
        }

        if (this.applicationType === 'vehicle') {
          if (!data.plateNumber || !data.plateNumber.trim()) {
            throw new Error('رقم لوحة السيارة مطلوب');
          }
        }
      },
    },
  }
);

// Generate application number (e.g., BRD-2026-001)
Application.generateApplicationNumber = async function () {
  const year = new Date().getFullYear();
  const prefix = `BRD-${year}-`;

  // Find the last application number for this year
  const lastApp = await this.findOne({
    where: {
      applicationNumber: {
        [require('sequelize').Op.like]: `${prefix}%`,
      },
    },
    order: [['applicationNumber', 'DESC']],
  });

  let nextNumber = 1;
  if (lastApp) {
    const lastNumber = parseInt(lastApp.applicationNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = Application;
