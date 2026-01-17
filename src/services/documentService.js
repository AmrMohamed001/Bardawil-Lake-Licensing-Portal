const { Document } = require('../models');
const AppError = require('../utils/appError');
const fs = require('fs').promises;
const path = require('path');

/**
 * Document Service - Handles document storage logic
 * Based on SRS Section 3.7
 */

/**
 * Save documents for an application
 * @param {string} applicationId - Application ID
 * @param {Array} files - Array of uploaded files from multer
 * @param {string} documentType - Type of document (optional, for single upload)
 */
exports.saveDocuments = async (applicationId, files, documentType = null) => {
  if (!files || files.length === 0) {
    return [];
  }

  const documents = [];

  for (const file of files) {
    const doc = await Document.create({
      applicationId,
      documentType: documentType || file.fieldname || 'other',
      filePath: file.path,
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
    documents.push(doc);
  }

  return documents;
};

/**
 * Save single document
 * @param {string} applicationId - Application ID
 * @param {Object} file - Uploaded file from multer
 * @param {string} documentType - Type of document
 */
exports.saveDocument = async (applicationId, file, documentType) => {
  if (!file) {
    throw new AppError(400, 'الملف مطلوب');
  }

  const document = await Document.create({
    applicationId,
    documentType,
    filePath: file.path,
    fileName: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  return document;
};

/**
 * Get documents for an application
 * @param {string} applicationId - Application ID
 */
exports.getApplicationDocuments = async applicationId => {
  return Document.findAll({
    where: { applicationId },
    order: [['uploadedAt', 'DESC']],
  });
};

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @param {string} applicationId - Application ID (for authorization)
 */
exports.deleteDocument = async (documentId, applicationId) => {
  const document = await Document.findOne({
    where: { id: documentId, applicationId },
  });

  if (!document) {
    throw new AppError(404, 'المستند غير موجود');
  }

  // Delete file from filesystem
  try {
    await fs.unlink(document.filePath);
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }

  // Delete from database
  await document.destroy();

  return { message: 'تم حذف المستند بنجاح' };
};

/**
 * Get required documents for application type
 * @param {string} applicationType - fisherman, boat, vehicle, individual_float
 * @param {boolean} isRenewal - Is this a renewal application
 */
exports.getRequiredDocuments = (applicationType, isRenewal = false) => {
  const documents = {
    fisherman: [
      {
        type: 'police_clearance',
        nameAr: 'فيش جنائي موجه للجهاز',
        required: true,
      },
      {
        type: 'national_id_copy',
        nameAr: 'صورة بطاقة الرقم القومي سارية',
        required: true,
      },
      { type: 'military_status', nameAr: 'موقف التجنيد', required: true },
      {
        type: 'personal_photo',
        nameAr: 'صورة شخصية 4×6 خلفية بيضاء',
        required: true,
      },
      {
        type: 'old_fishing_card',
        nameAr: 'صورة بطاقة الصيد القديمة',
        required: isRenewal,
      },
      { type: 'insurance_doc', nameAr: 'صورة التأمين', required: false },
    ],
    boat: [
      {
        type: 'previous_license',
        nameAr: 'أصل رخصة العام السابق',
        required: true,
      },
      { type: 'owner_id_copy', nameAr: 'صورة بطاقة المالك', required: true },
      {
        type: 'association_letter',
        nameAr: 'خطاب من الجمعية (خالي المديونية)',
        required: true,
      },
      { type: 'insurance_letter', nameAr: 'خطاب من التأمينات', required: true },
      { type: 'tax_receipt', nameAr: 'إيصال سداد الضرائب', required: true },
      {
        type: 'renewal_form',
        nameAr: 'استمارة تجديد ترخيص مركب',
        required: true,
      },
    ],
    vehicle: [
      {
        type: 'previous_license',
        nameAr: 'أصل رخصة العام السابق',
        required: true,
      },
      { type: 'owner_id_copy', nameAr: 'صورة بطاقة المالك', required: true },
      { type: 'tax_receipt', nameAr: 'إيصال سداد الضرائب', required: true },
    ],
    individual_float: [
      { type: 'owner_id_copy', nameAr: 'صورة بطاقة المالك', required: true },
      { type: 'personal_photo', nameAr: 'صورة شخصية', required: true },
    ],
  };

  return documents[applicationType] || [];
};
