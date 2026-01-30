const { Op } = require('sequelize');
const {
  Application,
  User,
  Document,
  ApplicationStatusHistory,
  ApplicationStatus,
  LicensePrice,
  Notification,
} = require('../models');
const AppError = require('../utils/appError');
const auditLogService = require('./auditLogService');
const pdfService = require('./pdfService'); // Add pdfService
const { sequelize } = require('../config/db');

const cacheService = require('./cacheService');

/**
 * Admin Service - Handles admin panel business logic
 * Based on SRS Section 3.4
 */

/**
 * Get admin dashboard statistics (FR-ADMIN-001)
 */
exports.getDashboardStats = async () => {
  return cacheService.getOrSet('admin_dashboard_stats', async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalApplications,
      newApplications,
      underReview,
      approved,
      completed,
      rejected,
      monthlyStats,
      byType,
      byStatus
    ] = await Promise.all([
      Application.count(),
      Application.count({ where: { status: 'received' } }),
      Application.count({ where: { status: 'under_review' } }),
      Application.count({
        where: {
          status: { [Op.in]: ['approved_payment_pending', 'approved_payment_required', 'payment_verified', 'ready'] }
        }
      }),
      Application.count({ where: { status: 'completed' } }),
      Application.count({ where: { status: 'rejected' } }),
      Application.findAll({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', '*'), 'count'],
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']],
      }),
      // Application by type
      Application.findAll({
        attributes: [
          'applicationType',
          [sequelize.fn('COUNT', '*'), 'count'],
        ],
        group: ['applicationType'],
        raw: true,
      }),
      // Applications by status
      Application.findAll({
        attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['status'],
        raw: true,
      })
    ]);

    return {
      overview: {
        total: totalApplications,
        new: newApplications,
        underReview,
        approved,
        completed,
        rejected,
      },
      byType,
      byStatus,
      monthlyTrend: monthlyStats,
    };
  }, 300); // Cache for 5 minutes
};


/**
 * Get all applications for admin (FR-ADMIN-002)
 * @param {Object} query - Query parameters
 */
exports.getAllApplications = async (query = {}) => {
  const { status, type, page = 1, limit = 20, search } = query;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.applicationType = type;
  }

  // Search by application number or user national ID
  if (search) {
    where[Op.or] = [{ applicationNumber: { [Op.iLike]: `%${search}%` } }];
  }

  const offset = (page - 1) * limit;

  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'nationalId', 'firstNameAr', 'lastNameAr', 'phone'],
      },
      {
        model: Document,
        as: 'documents',
        attributes: ['id', 'documentType', 'fileName'],
      },
      {
        model: ApplicationStatus,
        as: 'statusInfo',
        attributes: ['code', 'nameAr', 'nameEn', 'color', 'icon'],
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['firstNameAr', 'lastNameAr'],
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
 * Get single application for review (FR-ADMIN-002)
 * @param {string} applicationId - Application ID
 */
exports.getApplicationForReview = async applicationId => {
  const application = await Application.findOne({
    where: { id: applicationId },
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'nationalId', 'firstNameAr', 'lastNameAr', 'phone'],
      },
      {
        model: Document,
        as: 'documents',
      },
      {
        model: ApplicationStatusHistory,
        as: 'statusHistory',
        include: [
          {
            model: User,
            as: 'changedByUser',
            attributes: ['firstNameAr', 'lastNameAr'],
          },
        ],
        order: [['changedAt', 'DESC']],
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstNameAr', 'lastNameAr'],
      },
      {
        model: User,
        as: 'paymentVerifier',
        attributes: ['id', 'firstNameAr', 'lastNameAr'],
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

  return application;
};

/**
 * Update application status (start review)
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 */
exports.startReview = async (applicationId, adminId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.status !== 'received') {
    throw new AppError(400, 'لا يمكن بدء المراجعة لهذا الطلب');
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('under_review');
  application.status = 'under_review';
  if (newStatusObj) application.statusId = newStatusObj.id;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'under_review',
    changedBy: adminId,
    notes: 'بدء مراجعة الطلب',
  });

  // Notify user
  await Notification.create({
    userId: application.userId,
    type: 'application_under_review',
    title: 'الطلب قيد المراجعة',
    message: `طلبك رقم ${application.applicationNumber} قيد المراجعة الآن.`,
    applicationId: application.id,
  });

  // Audit log
  await auditLogService.logAction({
    userId: adminId,
    action: 'STATUS_CHANGE',
    entityType: 'application',
    entityId: application.id,
    description: `بدء مراجعة الطلب ${application.applicationNumber}`,
    previousData: { status: oldStatus },
    newData: { status: 'under_review' },
  });

  return { message: 'تم بدء مراجعة الطلب', application };
};

/**
 * Approve application and set up for Paymob online payment (FR-ADMIN-002)
 * Status flow: received/under_review -> approved_payment_pending -> completed (after payment)
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 */
exports.approveApplication = async (applicationId, adminId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (!['received', 'under_review'].includes(application.status)) {
    throw new AppError(400, `لا يمكن الموافقة على هذا الطلب في حالته الحالية: ${application.status}`);
  }

  // Get price from database
  const priceRecord = await LicensePrice.getCurrentPrice(
    application.applicationType,
    application.licenseCategory,
    application.isRenewal,
    application.duration || 'season'
  );

  if (!priceRecord) {
    throw new AppError(400, `لم يتم العثور على سعر لهذا النوع من التراخيص: ${application.licenseCategory} (${application.duration})`);
  }

  const finalPrice = parseFloat(priceRecord.price);

  // Generate Supply Order ID
  const supplyOrderId = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('approved_payment_pending');
  // Use approved_payment_pending for Paymob online payment flow
  application.status = 'approved_payment_pending';
  if (newStatusObj) application.statusId = newStatusObj.id;
  application.paymentAmount = finalPrice;
  application.supplyOrderId = supplyOrderId;
  application.approvedAt = new Date();
  application.reviewedBy = adminId;
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'approved_payment_pending',
    changedBy: adminId,
    notes: `تمت الموافقة - المبلغ المطلوب: ${finalPrice} جنيه - بانتظار الدفع الإلكتروني`,
  });

  // Notify user - include payment link info
  await Notification.create({
    userId: application.userId,
    type: 'application_approved',
    title: 'تمت الموافقة على طلبك - بانتظار الدفع',
    message: `تمت الموافقة على طلبك رقم ${application.applicationNumber}. المبلغ المطلوب: ${priceRecord.price} جنيه مصري. يرجى إتمام الدفع إلكترونياً للمتابعة.`,
    applicationId: application.id,
  });

  // Audit log
  await auditLogService.logAction({
    userId: adminId,
    action: 'APPROVE',
    entityType: 'application',
    entityId: application.id,
    description: `الموافقة على الطلب ${application.applicationNumber} - المبلغ: ${priceRecord.price} جنيه`,
    previousData: { status: oldStatus },
    newData: { status: 'approved_payment_pending', paymentAmount: priceRecord.price },
  });

  return {
    message: 'تمت الموافقة على الطلب - بانتظار الدفع',
    application: {
      id: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
      paymentAmount: application.paymentAmount,
      supplyOrderId,
    },
    // Include payment initiation endpoint for frontend
    paymentUrl: `/api/v1/payment/initiate/${application.id}`,
  };
};

/**
 * Reject application (FR-ADMIN-002)
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Rejection reason (Arabic)
 */
exports.rejectApplication = async (applicationId, adminId, reason) => {
  if (!reason) {
    throw new AppError(400, 'سبب الرفض مطلوب');
  }

  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('rejected');
  application.status = 'rejected';
  if (newStatusObj) application.statusId = newStatusObj.id;
  application.rejectionReason = reason;
  application.reviewedBy = adminId;
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'rejected',
    changedBy: adminId,
    notes: `تم رفض الطلب: ${reason}`,
  });

  // Notify user
  await Notification.create({
    userId: application.userId,
    type: 'application_rejected',
    title: 'تم رفض طلبك',
    message: `تم رفض طلبك رقم ${application.applicationNumber}. السبب: ${reason}`,
    applicationId: application.id,
  });

  // Audit log
  await auditLogService.logAction({
    userId: adminId,
    action: 'REJECT',
    entityType: 'application',
    entityId: application.id,
    description: `رفض الطلب ${application.applicationNumber} - السبب: ${reason}`,
    previousData: { status: oldStatus },
    newData: { status: 'rejected', rejectionReason: reason },
  });

  return { message: 'تم رفض الطلب' };
};

/**
 * Verify payment receipt (FR-ADMIN-002)
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 */
exports.verifyPayment = async (applicationId, adminId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.status !== 'approved_payment_required') {
    throw new AppError(
      400,
      'لا يمكن تأكيد الدفع - الطلب ليس في حالة انتظار الدفع'
    );
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('payment_verified');
  application.status = 'payment_verified';
  if (newStatusObj) application.statusId = newStatusObj.id;
  application.paymentVerifiedAt = new Date();
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'payment_verified',
    changedBy: adminId,
    notes: 'تم التحقق من الدفع',
  });

  // Notify user
  await Notification.create({
    userId: application.userId,
    type: 'payment_verified',
    title: 'تم التحقق من الدفع',
    message: `تم التحقق من دفعك لطلبك رقم ${application.applicationNumber}. جاري إعداد الرخصة.`,
    applicationId: application.id,
  });

  return { message: 'تم التحقق من الدفع بنجاح' };
};

/**
 * Mark license as ready (FR-ADMIN-002)
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 */
exports.markLicenseReady = async (applicationId, adminId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.status !== 'payment_verified') {
    throw new AppError(400, 'يجب التحقق من الدفع أولاً');
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('ready');
  application.status = 'ready';
  if (newStatusObj) application.statusId = newStatusObj.id;
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'ready',
    changedBy: adminId,
    notes: 'الرخصة جاهزة للاستلام',
  });

  // Notify user
  await Notification.create({
    userId: application.userId,
    type: 'license_ready',
    title: 'الرخصة جاهزة',
    message: `رخصتك جاهزة للاستلام. رقم الطلب: ${application.applicationNumber}`,
    applicationId: application.id,
  });

  return { message: 'تم تجهيز الرخصة' };
};

/**
 * Mark application as completed
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 */
exports.completeApplication = async (applicationId, adminId) => {
  const application = await Application.findByPk(applicationId);

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.status !== 'ready') {
    throw new AppError(400, 'الرخصة غير جاهزة بعد');
  }

  const oldStatus = application.status;
  const newStatusObj = await ApplicationStatus.getByCode('completed');
  application.status = 'completed';
  if (newStatusObj) application.statusId = newStatusObj.id;
  await application.save();

  // Create status history
  await ApplicationStatusHistory.create({
    applicationId: application.id,
    oldStatus,
    newStatus: 'completed',
    changedBy: adminId,
    notes: 'تم تسليم الرخصة',
  });

  return { message: 'تم إتمام الطلب بنجاح' };
};

/**
 * Get Supply Order Data
 */
exports.getSupplyOrderData = async (applicationId) => {
  const application = await Application.findOne({
    where: { id: applicationId },
    include: [{ model: User, as: 'applicant' }],
  });

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (!application.supplyOrderId) {
    throw new AppError(400, 'لم يتم إنشاء أمر التوريد بعد. يجب الموافقة على الطلب أولاً');
  }

  return await pdfService.generateSupplyOrder(application, application.applicant);
};

/**
 * Get License Certificate Data
 */
exports.getLicenseData = async (applicationId) => {
  const application = await Application.findOne({
    where: { id: applicationId },
    include: [{ model: User, as: 'applicant' }],
  });

  if (!application) {
    throw new AppError(404, 'الطلب غير موجود');
  }

  if (application.status !== 'completed') {
    throw new AppError(400, 'لا يمكن إصدار الرخصة. يجب إتمام الطلب أولاً');
  }

  return await pdfService.generateLicenseCertificate(application, application.applicant);
};

/**
 * Get License Review - Applications grouped by license type
 * Supports search by license holder name, national ID, or date range
 * @param {Object} query - Query parameters
 */
exports.getLicenseReview = async (query = {}) => {
  const { search, startDate, endDate, applicationType, page = 1, limit = 20 } = query;

  // Build where clause
  const where = {};

  // Filter by application type if specified
  if (applicationType) {
    where.applicationType = applicationType;
  }

  // Search by license holder name or national ID
  if (search) {
    where[Op.or] = [
      { licenseHolderName: { [Op.iLike]: `%${search}%` } },
      { licenseHolderNationalId: { [Op.iLike]: `%${search}%` } },
      { applicationNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
  }

  const offset = (page - 1) * limit;

  // Get applications
  const { count, rows: applications } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'nationalId', 'firstNameAr', 'lastNameAr', 'phone'],
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

  // Get summary statistics grouped by license type
  const typeStats = await Application.findAll({
    where: where.applicationType ? { applicationType: where.applicationType } : {},
    attributes: [
      'applicationType',
      [sequelize.fn('COUNT', '*'), 'total'],
      [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed'],
      [sequelize.fn('SUM', sequelize.col('payment_amount')), 'totalRevenue'],
    ],
    group: ['applicationType'],
    raw: true,
  });

  // Get category breakdown within each type
  const categoryStats = await Application.findAll({
    where,
    attributes: [
      'applicationType',
      'licenseCategory',
      [sequelize.fn('COUNT', '*'), 'count'],
    ],
    group: ['applicationType', 'licenseCategory'],
    raw: true,
  });

  return {
    applications,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    },
    statistics: {
      byType: typeStats,
      byCategory: categoryStats,
    },
  };
};

/**
 * Get License Review Statistics Summary
 * Overview stats for the license review dashboard
 */
exports.getLicenseReviewStats = async () => {
  const [
    totalLicenses,
    completedLicenses,
    pendingLicenses,
    totalRevenue,
    byType,
    recentApplications
  ] = await Promise.all([
    Application.count(),
    Application.count({ where: { status: 'completed' } }),
    Application.count({ where: { status: { [Op.notIn]: ['completed', 'rejected'] } } }),
    Application.sum('paymentAmount', { where: { status: 'completed' } }),
    Application.findAll({
      attributes: [
        'applicationType',
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed'],
      ],
      group: ['applicationType'],
      raw: true,
    }),
    Application.findAll({
      where: { status: 'completed' },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, as: 'applicant', attributes: ['firstNameAr', 'lastNameAr'] },
        { model: ApplicationStatus, as: 'statusInfo', attributes: ['nameAr', 'color'] },
      ],
    }),
  ]);

  return {
    overview: {
      total: totalLicenses,
      completed: completedLicenses,
      pending: pendingLicenses,
      revenue: totalRevenue || 0,
    },
    byType,
    recentApplications,
  };
};

/**
 * Export License Review Data
 * Returns applications for Excel export with license holder info
 */
exports.getLicenseReviewForExport = async (query = {}) => {
  const { search, startDate, endDate, applicationType } = query;

  const where = {};

  if (applicationType) {
    where.applicationType = applicationType;
  }

  if (search) {
    where[Op.or] = [
      { licenseHolderName: { [Op.iLike]: `%${search}%` } },
      { licenseHolderNationalId: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
  }

  return Application.findAll({
    where,
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['firstNameAr', 'lastNameAr', 'nationalId', 'phone'],
      },
    ],
    order: [['applicationType', 'ASC'], ['createdAt', 'DESC']],
  });
};
