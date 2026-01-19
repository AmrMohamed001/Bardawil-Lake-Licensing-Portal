const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/appError');

/**
 * File Upload Middleware - Based on SRS Section 3.7
 * Handles document uploads for applications
 */

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024; // 5MB

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use src/public/uploads folder
    const uploadPath = process.env.UPLOAD_PATH || './src/public/uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate filename: reqid-timestamp-random.ext
    const ext = path.extname(file.originalname);
    const reqId = req.user?.id?.slice(0, 8) || 'anon';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const filename = `${reqId}-${timestamp}-${random}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(400, 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, PDF'),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Single file upload middleware
 * @param {string} fieldName - Form field name
 */
exports.uploadSingle = fieldName => upload.single(fieldName);

/**
 * Multiple files upload middleware (for application documents)
 * @param {number} maxCount - Maximum number of files
 */
exports.uploadMultiple = (maxCount = 10) => upload.array('documents', maxCount);

/**
 * Fields upload middleware - accepts all document types from the form
 * Fisherman: criminalRecord, nationalIdImage, militaryStatus, insurancePhoto, personalPhoto
 * Boat: previousLicense, ownerPhoto, associationLetter, insuranceLetter, taxReceipt, renewalForm, previousBoatNumber
 * Vehicle: vehicleLicense, driverLicense
 */
exports.uploadFields = upload.fields([
  // Fisherman document fields
  { name: 'criminalRecord', maxCount: 1 },
  { name: 'nationalIdImage', maxCount: 1 },
  { name: 'militaryStatus', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 },
  { name: 'personalPhoto', maxCount: 1 },

  // Boat document fields
  { name: 'previousLicense', maxCount: 1 },
  { name: 'ownerPhoto', maxCount: 1 },
  { name: 'associationLetter', maxCount: 1 },
  { name: 'insuranceLetter', maxCount: 1 },
  { name: 'taxReceipt', maxCount: 1 },
  { name: 'renewalForm', maxCount: 1 },

  // Vehicle document fields
  { name: 'vehicleLicense', maxCount: 1 },
  { name: 'driverLicense', maxCount: 1 },

  // Payment receipt
  { name: 'payment_receipt', maxCount: 1 },

  // Generic boat/vehicle photos
  { name: 'boatPhoto', maxCount: 1 },
]);

/**
 * Handle multer errors
 */
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(
          400,
          `حجم الملف يتجاوز الحد المسموح (${MAX_FILE_SIZE / 1024 / 1024}MB)`
        )
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError(400, 'تم تجاوز عدد الملفات المسموح به'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // Log the unexpected field for debugging
      console.log('Unexpected file field:', err.field);
      return next(new AppError(400, `حقل الملف "${err.field}" غير متوقع`));
    }
    return next(new AppError(400, err.message));
  }
  next(err);
};
