const { Op } = require('sequelize');
const {
  Application,
  Document,
  User,
  ApplicationStatusHistory,
  ApplicationStatus,
  LicensePrice,
  Notification,
} = require('../models');
const AppError = require('../utils/appError');

/**
 * Application Service - Handles license application business logic
 * Based on SRS Section 3.2
 */

/**
 * Create a new application (FR-APP-001, FR-APP-002)
 * @param {Object} applicationData - Application data
 * @param {string} userId - User ID
 */
exports.createApplication = async (applicationData, userId, files) => {
  const { applicationType, licenseCategory, isRenewal, duration, boatType } = applicationData;

  // Prepare dynamic data
  const data = applicationData.data || {};

  // Extract fields from request body and move to data object
  const dynamicFields = [
    'marina',
    'unionCardNumber',
    'previousLicenseNumber', // Fisherman
    'boatNumber',
    'boatRegistration',
    'boatLength',
    'enginePower',
    'previousBoatNumber', // Boat
    'plateNumber',
    'vehicleType',
    'vehicleYear',
    'capacity',
    'motorNumber',
    'chassisNumber', // Vehicle
    'previousLicense', // Renewal
    'ownerName',
    'ownerNationalId', // Owner info
  ];

  dynamicFields.forEach(field => {
    if (applicationData[field]) {
      data[field] = applicationData[field];
    }
  });

  // Get price based on license type, category, duration, and boatType
  const selectedDuration = duration || '3_months';
  const selectedBoatType = applicationType === 'boat' ? (boatType || 'private') : null;
  const isRenewalFlag = isRenewal === 'true' || isRenewal === true;

  const priceRecord = await LicensePrice.getCurrentPrice(
    applicationType,
    licenseCategory,
    isRenewalFlag,
    selectedDuration,
    selectedBoatType
  );

  const paymentAmount = priceRecord ? parseFloat(priceRecord.price) : null;

  // Generate application number
  const applicationNumber = await Application.generateApplicationNumber();

  // Get initial status from lookup table
  const initialStatus = await ApplicationStatus.getByCode('received');
  const statusId = initialStatus ? initialStatus.id : null;

  // Determine license holder information
  // If not provided, default to the submitting user's info
  const user = await User.findByPk(userId);
  const licenseHolderName = applicationData.licenseHolderName && applicationData.licenseHolderName.trim()
    ? applicationData.licenseHolderName.trim()
    : `${user.firstNameAr} ${user.lastNameAr}`;
  const licenseHolderNationalId = applicationData.licenseHolderNationalId && applicationData.licenseHolderNationalId.trim()
    ? applicationData.licenseHolderNationalId.trim()
    : user.nationalId;

  // Create application
  const application = await Application.create({
    applicationNumber,
    userId,
    applicationType,
    licenseCategory,
    isRenewal: isRenewalFlag,
    duration: selectedDuration,
    boatType: selectedBoatType,
    status: 'received',
    statusId,
    paymentAmount,
    licenseHolderName,
    licenseHolderNationalId,
    data: data,
    submittedAt: new Date(),
  });

  // Process uploaded files
  if (files && Object.keys(files).length > 0) {
    const documentPromises = [];

    // Map form field names to document types
    const documentTypeMap = {
      criminalRecord: 'police_clearance',
      nationalIdImage: 'national_id_copy',
      militaryStatus: 'military_status',
      insurancePhoto: 'insurance_doc',
      personalPhoto: 'personal_photo',
      previousLicense: 'previous_license',
      ownerPhoto: 'owner_id_copy',
      associationLetter: 'association_letter',
      insuranceLetter: 'insurance_letter',
      taxReceipt: 'tax_receipt',
      renewalForm: 'renewal_form',
      payment_receipt: 'payment_receipt',
      // Map others to 'other' or specific types if available
      vehicleLicense: 'other',
      driverLicense: 'other',
      boatPhoto: 'other',
    };

    Object.keys(files).forEach(fieldName => {
      const fileList = files[fieldName];
      fileList.forEach(file => {
        const docType = documentTypeMap[fieldName] || 'other';

        documentPromises.push(
          Document.create({
            applicationId: application.id,
            documentType: docType,
            filePath: file.path.replace(/\\/g, '/'), // Fix windows paths
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          })
        );
      });
    });

    await Promise.all(documentPromises);
  }

  // Create status history entry
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus: null,
    newStatus: 'received',
    changedBy: userId,
    notes: 'تم تقديم الطلب',
  });

  // Create notification
  await Notification.create({
    userId,
    type: 'application_received',
    title: 'تم استلام طلبك',
    message: `تم استلام طلبك رقم ${applicationNumber} بنجاح. سيتم مراجعته قريباً.`,
    applicationId: application.id,
  });

  // Fetch created application with documents
  const createdApp = await Application.findByPk(application.id, {
    include: [{ model: Document, as: 'documents' }],
  });

  return {
    message: 'تم تقديم الطلب بنجاح',
    application: createdApp,
  };
};

/**
 * Get user's applications
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters (status, type, page, limit)
 */
exports.getUserApplications = async (userId, query = {}) => {
  const { status, type, page = 1, limit = 10 } = query;

  const where = { userId };

  if (status) {
    where.status = status;
  }

  if (type) {
    where.applicationType = type;
  }

  const offset = (page - 1) * limit;

  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: Document,
        as: 'documents',
        attributes: ['id', 'documentType', 'fileName', 'uploadedAt'],
      },
      {
        model: ApplicationStatus,
        as: 'statusInfo',
        attributes: ['code', 'nameAr', 'nameEn', 'color', 'icon'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return {
    applications,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    },
  };
};

/**
 * Get application by ID
 * @param {string} applicationId - Application ID
 * @param {string} userId - User ID (for authorization)
 */
exports.getApplicationById = async (applicationId, userId) => {
  const application = await Application.findOne({
    where: { id: applicationId },
    include: [
      {
        model: Document,
        as: 'documents',
        attributes: [
          'id',
          'documentType',
          'fileName',
          'filePath',
          'fileSize',
          'mimeType',
          'uploadedAt',
        ],
      },
      {
        model: ApplicationStatusHistory,
        as: 'statusHistory',
        include: [
          {
            model: User,
            as: 'changedByUser',
            attributes: ['id', 'firstNameAr', 'lastNameAr'],
          },
        ],
        order: [['changedAt', 'DESC']],
      },
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'nationalId', 'firstNameAr', 'lastNameAr', 'phone'],
      },
      {
        model: ApplicationStatus,
        as: 'statusInfo',
        attributes: ['code', 'nameAr', 'nameEn', 'color', 'icon', 'description'],
      },
    ],
  });

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  // Check if user owns this application (unless admin)
  if (application.userId !== userId) {
    // Check if user is admin - this will be handled by middleware
    throw new AppError(403, 'ليس لديك صلاحية للوصول إلى هذا الطلب');
  }

  return application;
};

/**
 * Get application by number (for tracking)
 * @param {string} applicationNumber - Application number (e.g., BRD-2026-0001)
 */
exports.getApplicationByNumber = async applicationNumber => {
  const application = await Application.findOne({
    where: { applicationNumber },
    attributes: [
      'id',
      'applicationNumber',
      'applicationType',
      'licenseCategory',
      'status',
      'submittedAt',
      'approvedAt',
      'paymentVerifiedAt',
    ],
    include: [
      {
        model: ApplicationStatusHistory,
        as: 'statusHistory',
        attributes: ['oldStatus', 'newStatus', 'changedAt', 'notes'],
        order: [['changedAt', 'DESC']],
      },
    ],
  });

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  return application;
};

/**
 * Upload payment receipt (FR-APP-002)
 * @param {string} applicationId - Application ID
 * @param {string} userId - User ID
 * @param {string} receiptPath - Path to uploaded receipt
 */

exports.uploadPaymentReceipt = async (applicationId, userId, receiptPath) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.userId !== userId) {
    throw new AppError(403, 'ليس لديك صلاحية للوصول إلى هذا الطلب');
  }

  // Check if application is in correct status (user can upload receipt when approved)
  if (
    !['approved_payment_pending', 'approved_payment_required', 'payment_pending'].includes(
      application.status
    )
  ) {
    throw new AppError(400, 'لا يمكن رفع إيصال الدفع في هذه المرحلة');
  }

  // Update application
  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('payment_submitted');
  application.paymentReceiptPath = receiptPath;
  application.status = 'payment_submitted';
  if (newStatusObj) application.statusId = newStatusObj.id;
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'payment_submitted',
    changedBy: userId,
    notes: 'تم رفع إيصال الدفع',
  });

  // Create notification
  await Notification.create({
    userId,
    type: 'payment_received',
    title: 'تم استلام إيصال الدفع',
    message: `تم استلام إيصال الدفع لطلبك رقم ${application.applicationNumber}. جاري التحقق.`,
    applicationId: application.id,
  });

  return {
    message: 'تم رفع إيصال الدفع بنجاح',
    application: {
      id: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
    },
  };
};

/**
 * Get dashboard statistics for user
 * @param {string} userId - User ID
 */
exports.getUserDashboardStats = async userId => {
  const [pendingPayments, approved, underReview, total] = await Promise.all([
    Application.count({
      where: {
        userId,
        status: { [Op.in]: ['approved_payment_required', 'payment_pending'] },
      },
    }),
    Application.count({
      where: {
        userId,
        status: 'completed',
      },
    }),
    Application.count({
      where: {
        userId,
        status: { [Op.in]: ['received', 'under_review'] },
      },
    }),
    Application.count({ where: { userId } }),
  ]);

  // Get recent applications
  const recentApplications = await Application.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: [
      'id',
      'applicationNumber',
      'applicationType',
      'licenseCategory',
      'status',
      'submittedAt',
    ],
  });

  return {
    stats: {
      pendingPayments,
      approved,
      underReview,
      total,
    },
    recentApplications,
  };
};

/**
 * Cancel application (if allowed)
 * @param {string} applicationId - Application ID
 * @param {string} userId - User ID
 */
exports.cancelApplication = async (applicationId, userId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.userId !== userId) {
    throw new AppError(403, 'ليس لديك صلاحية للوصول إلى هذا الطلب');
  }

  // Can only cancel if in early stages
  const cancellableStatuses = ['received', 'under_review'];
  if (!cancellableStatuses.includes(application.status)) {
    throw new AppError(400, 'لا يمكن إلغاء الطلب في هذه المرحلة');
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('rejected');
  application.status = 'rejected';
  if (newStatusObj) application.statusId = newStatusObj.id;
  application.rejectionReason = 'تم إلغاء الطلب بواسطة المستخدم';
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'rejected',
    changedBy: userId,
    notes: 'تم إلغاء الطلب بواسطة المستخدم',
  });

  return {
    message: 'تم إلغاء الطلب بنجاح',
  };
};
