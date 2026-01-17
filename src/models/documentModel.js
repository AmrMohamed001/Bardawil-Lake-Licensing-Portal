const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * Document Model - Based on SRS Section 5.2.3
 * Stores uploaded documents for applications
 */
const Document = sequelize.define(
  'Document',
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
    documentType: {
      type: DataTypes.ENUM(
        // Fisherman documents
        'police_clearance', // فيش جنائي
        'national_id_copy', // صورة بطاقة الرقم القومي
        'old_fishing_card', // صورة بطاقة الصيد القديمة
        'military_status', // موقف التجنيد
        'insurance_doc', // صورة التأمين
        'personal_photo', // صورة شخصية 4×6
        // Boat documents
        'previous_license', // أصل رخصة العام السابق
        'owner_id_copy', // صورة بطاقة المالك
        'association_letter', // خطاب من الجمعية
        'insurance_letter', // خطاب من التأمينات
        'tax_receipt', // إيصال سداد الضرائب
        'renewal_form', // استمارة تجديد ترخيص مركب
        'payment_receipt', // إيصال سداد رسوم الترخيص
        // Other
        'other'
      ),
      allowNull: false,
      field: 'document_type',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at',
    },
  },
  {
    tableName: 'documents',
    timestamps: true,
    indexes: [{ fields: ['application_id'] }, { fields: ['document_type'] }],
  }
);

module.exports = Document;
