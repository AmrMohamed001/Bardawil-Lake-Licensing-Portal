const { Op } = require('sequelize');
const {
  Application,
  User,
  Document,
  ApplicationStatusHistory,
  LicensePrice,
  Notification,
} = require('../models');
const AppError = require('../utils/appError');

/**
 * Admin Service - Handles admin panel business logic
 * Based on SRS Section 3.4
 */

/**
 * Get admin dashboard statistics (FR-ADMIN-001)
 */
exports.getDashboardStats = async () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

  const [
    totalApplications,
    newApplications,
    underReview,
    approved,
    rejected,
    monthlyStats,
  ] = await Promise.all([
    Application.count(),
    Application.count({ where: { status: 'received' } }),
    Application.count({ where: { status: 'under_review' } }),
    Application.count({ where: { status: 'completed' } }),
    Application.count({ where: { status: 'rejected' } }),
    Application.findAll({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [
          require('sequelize').fn(
            'DATE',
            require('sequelize').col('created_at')
          ),
          'date',
        ],
        [require('sequelize').fn('COUNT', '*'), 'count'],
      ],
      group: [
        require('sequelize').fn('DATE', require('sequelize').col('created_at')),
      ],
      raw: true,
    }),
  ]);

  // Application by type
  const byType = await Application.findAll({
    attributes: [
      'applicationType',
      [require('sequelize').fn('COUNT', '*'), 'count'],
    ],
    group: ['applicationType'],
    raw: true,
  });

  // Applications by status
  const byStatus = await Application.findAll({
    attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
    group: ['status'],
    raw: true,
  });

  return {
    overview: {
      total: totalApplications,
      new: newApplications,
      underReview,
      approved,
      rejected,
    },
    byType,
    byStatus,
    monthlyTrend: monthlyStats,
  };
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
  application.status = 'under_review';
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
    throw new AppError(400, 'لا يمكن الموافقة على هذا الطلب في حالته الحالية');
  }

  // Get price for this license type
  const price = await LicensePrice.getCurrentPrice(
    application.applicationType,
    application.licenseCategory,
    application.isRenewal
  );

  if (!price) {
    throw new AppError(400, 'لم يتم العثور على سعر لهذا النوع من التراخيص');
  }

  // Generate Supply Order ID
  const supplyOrderId = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const oldStatus = application.status;
  // Use approved_payment_pending for Paymob online payment flow
  application.status = 'approved_payment_pending';
  application.paymentAmount = price.price;
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
    notes: `تمت الموافقة - المبلغ المطلوب: ${price.price} جنيه - بانتظار الدفع الإلكتروني`,
  });

  // Notify user - include payment link info
  await Notification.create({
    userId: application.userId,
    type: 'application_approved',
    title: 'تمت الموافقة على طلبك - بانتظار الدفع',
    message: `تمت الموافقة على طلبك رقم ${application.applicationNumber}. المبلغ المطلوب: ${price.price} جنيه مصري. يرجى إتمام الدفع إلكترونياً للمتابعة.`,
    applicationId: application.id,
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
  application.status = 'rejected';
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
  application.status = 'payment_verified';
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
  application.status = 'ready';
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
  application.status = 'completed';
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
