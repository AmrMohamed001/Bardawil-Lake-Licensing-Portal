const { Op } = require('sequelize');
const {
    Application,
    User,
    Document,
    ApplicationStatusHistory,
    Notification,
} = require('../models');
const AppError = require('../utils/appError');
const auditLogService = require('./auditLogService');
const ExcelJS = require('exceljs');

/**
 * Get Dashboard Statistics
 */
exports.getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
        pendingCount,
        todayVerified,
        monthlyVerified,
        monthlyTotalResult,
        todayTotalResult,
        rejectedCount
    ] = await Promise.all([
        // Pending verification count
        Application.count({
            where: {
                [Op.or]: [
                    { status: 'payment_submitted' },
                    { status: 'approved_payment_pending' }
                ]
            }
        }),
        // Today's verified count
        Application.count({
            where: {
                status: 'payment_verified',
                paymentVerifiedAt: { [Op.gte]: today },
            },
        }),
        // This month verified count
        Application.count({
            where: {
                status: 'payment_verified',
                paymentVerifiedAt: { [Op.gte]: firstDayOfMonth },
            },
        }),
        // This month total amount
        Application.sum('paymentAmount', {
            where: {
                status: 'payment_verified',
                paymentVerifiedAt: { [Op.gte]: firstDayOfMonth },
            },
        }),
        // Today total amount
        Application.sum('paymentAmount', {
            where: {
                status: 'payment_verified',
                paymentVerifiedAt: { [Op.gte]: today },
            },
        }),
        // Rejected this month
        ApplicationStatusHistory.count({
            where: {
                newStatus: 'approved_payment_required',
                changedAt: { [Op.gte]: firstDayOfMonth },
            },
        }),
    ]);

    return {
        pending: pendingCount,
        todayVerified,
        monthlyVerified,
        monthlyTotal: monthlyTotalResult || 0,
        todayTotal: todayTotalResult || 0,
        rejectedCount,
    };
};

/**
 * Get Recent Applications for Dashboard
 */
exports.getRecentApplications = async (query) => {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;

    const where = {
        status: {
            [Op.in]: ['payment_submitted', 'approved_payment_pending', 'payment_verified']
        }
    };

    // Build include with optional search filtering
    const applicantInclude = {
        model: User,
        as: 'applicant',
        attributes: ['firstNameAr', 'lastNameAr', 'nationalId']
    };

    // If search is provided, filter by applicant name OR application number
    if (search) {
        const trimmedSearch = search.trim();
        // Check if search looks like an application number
        const isAppNumber = trimmedSearch.match(/^BRD-/i) || trimmedSearch.match(/^\d+$/);

        if (isAppNumber) {
            where.applicationNumber = { [Op.iLike]: `%${trimmedSearch}%` };
        } else {
            // Search by applicant name
            applicantInclude.where = {
                [Op.or]: [
                    { firstNameAr: { [Op.iLike]: `%${trimmedSearch}%` } },
                    { lastNameAr: { [Op.iLike]: `%${trimmedSearch}%` } },
                    { nationalId: { [Op.iLike]: `%${trimmedSearch}%` } }
                ]
            };
            applicantInclude.required = true;
        }
    }

    const include = [
        applicantInclude,
        {
            model: User,
            as: 'reviewer',
            attributes: ['firstNameAr', 'lastNameAr']
        },
        {
            model: User,
            as: 'paymentVerifier',
            attributes: ['firstNameAr', 'lastNameAr']
        }
    ];

    const count = await Application.count({
        where,
        include,
        distinct: true
    });

    const applications = await Application.findAll({
        where,
        include,
        subQuery: false,
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });

    return {
        applications,
        pagination: {
            total: count,
            pages: Math.ceil(count / limit),
            page: parseInt(page),
            limit: parseInt(limit),
        },
    };
};

/**
 * Get Pending Payments
 */
exports.getPendingPayments = async (query) => {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;

    const where = {
        [Op.or]: [
            { status: 'payment_submitted' },
            { status: 'approved_payment_pending' }
        ]
    };

    if (search) {
        where[Op.or] = [
            { applicationNumber: { [Op.like]: `%${search}%` } },
            { '$applicant.national_id$': { [Op.like]: `%${search}%` } },
            { '$applicant.first_name_ar$': { [Op.like]: `%${search}%` } },
            { '$applicant.last_name_ar$': { [Op.like]: `%${search}%` } }
        ];
    }

    const { count, rows: applications } = await Application.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'applicant',
                attributes: ['id', 'nationalId', 'firstNameAr', 'lastNameAr', 'phone'],
            },
        ],
        order: [['updatedAt', 'ASC']],
        limit: parseInt(limit),
        offset,
    });

    return {
        applications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit),
        }
    };
};

/**
 * Get Payment Details
 */
exports.getPaymentDetails = async (id) => {
    const application = await Application.findByPk(id, {
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
                include: [{ model: User, as: 'changedByUser', attributes: ['firstNameAr', 'lastNameAr'] }],
                order: [['changedAt', 'DESC']],
            },
            {
                model: User,
                as: 'reviewer',
                attributes: ['firstNameAr', 'lastNameAr']
            },
            {
                model: User,
                as: 'paymentVerifier',
                attributes: ['firstNameAr', 'lastNameAr']
            }
        ],
    });

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    return application;
};

/**
 * Verify Payment
 */
exports.verifyPayment = async (id, adminId, notes) => {
    const application = await Application.findByPk(id);

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (application.status !== 'approved_payment_pending' && application.status !== 'payment_submitted') {
        throw new AppError('لا يمكن التحقق من هذا الطلب في حالته الحالية', 400);
    }

    const oldStatus = application.status;

    await application.update({
        status: 'payment_verified',
        paymentVerifiedBy: adminId,
        paymentVerifiedAt: new Date(),
        paymentVerificationNotes: notes
    });

    await ApplicationStatusHistory.create({
        applicationId: application.id,
        oldStatus,
        newStatus: 'payment_verified',
        changedBy: adminId,
        notes: notes || 'تم التحقق من الدفع بنجاح',
    });

    await Notification.create({
        userId: application.userId,
        type: 'payment_verified',
        title: 'تم التحقق من الدفع',
        message: `تم التحقق من دفع طلب ${application.applicationNumber} بنجاح. جاري إعداد الرخصة.`,
        applicationId: application.id,
    });

    // Audit Log handled in controller or here? Better here if we want pure service logic, but we need req object or pass audit service details.
    // For simplicity, let's keep audit log in controller or pass it down. But let's return enough info for controller to log it.

    return { application, oldStatus };
};

/**
 * Reject Payment
 */
exports.rejectPayment = async (id, adminId, reason) => {
    const application = await Application.findByPk(id);

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (application.status !== 'approved_payment_pending' && application.status !== 'payment_submitted') {
        throw new AppError('لا يمكن رفض هذا الطلب في حالته الحالية', 400);
    }

    const oldStatus = application.status;

    await application.update({
        paymentReceiptPath: null,
        paymentVerifiedBy: adminId,
        paymentVerificationNotes: reason
    });

    await ApplicationStatusHistory.create({
        applicationId: application.id,
        oldStatus,
        newStatus: 'approved_payment_pending',
        changedBy: adminId,
        notes: `تم رفض الإيصال: ${reason}`,
    });

    await Notification.create({
        userId: application.userId,
        type: 'payment_rejected',
        title: 'تم رفض إيصال الدفع',
        message: `تم رفض إيصال الدفع لطلب ${application.applicationNumber}. السبب: ${reason}. يرجى رفع إيصال صحيح.`,
        applicationId: application.id,
    });

    return { application, oldStatus };
};

/**
 * Get Payment History
 */
exports.getPaymentHistory = async (query) => {
    const { page = 1, limit = 50, startDate, endDate, search, reviewerFilter } = query;
    const offset = (page - 1) * limit;

    const where = {
        status: {
            [Op.in]: ['payment_verified', 'ready', 'completed'],
        },
    };

    // Simple search on main table fields only (no association issues)
    // Note: We don't add applicationNumber search to main where when searching by name
    // because we want OR logic with applicant table

    if (startDate && endDate) {
        where.paymentVerifiedAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    }

    // Build include array with search on applicant
    const applicantInclude = {
        model: User,
        as: 'applicant',
        attributes: ['nationalId', 'firstNameAr', 'lastNameAr'],
    };

    // If search is provided, filter by applicant name OR application number
    if (search) {
        const trimmedSearch = search.trim();
        // Check if search looks like an application number (starts with BRD or contains numbers)
        const isAppNumber = trimmedSearch.match(/^BRD-/i) || trimmedSearch.match(/^\d+$/);

        if (isAppNumber) {
            // Search by application number only
            where.applicationNumber = { [Op.iLike]: `%${trimmedSearch}%` };
        } else {
            // Search by applicant name - make applicant required for INNER JOIN
            applicantInclude.where = {
                [Op.or]: [
                    { firstNameAr: { [Op.iLike]: `%${trimmedSearch}%` } },
                    { lastNameAr: { [Op.iLike]: `%${trimmedSearch}%` } },
                    { nationalId: { [Op.iLike]: `%${trimmedSearch}%` } }
                ]
            };
            applicantInclude.required = true; // INNER JOIN - filter by applicant name
        }
    }

    const reviewerInclude = {
        model: User,
        as: 'reviewer',
        attributes: ['firstNameAr', 'lastNameAr']
    };

    // If reviewer filter is set, require match
    if (reviewerFilter) {
        reviewerInclude.where = {
            [Op.or]: [
                { firstNameAr: { [Op.iLike]: `%${reviewerFilter}%` } },
                { lastNameAr: { [Op.iLike]: `%${reviewerFilter}%` } }
            ]
        };
        reviewerInclude.required = true; // INNER JOIN - must match
    }

    const verifierInclude = {
        model: User,
        as: 'paymentVerifier',
        attributes: ['firstNameAr', 'lastNameAr']
    };

    const include = [applicantInclude, reviewerInclude, verifierInclude];

    const count = await Application.count({
        where,
        include,
        distinct: true
    });

    const payments = await Application.findAll({
        where,
        include,
        subQuery: false,
        order: [['paymentVerifiedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });

    const totalAmount = await Application.sum('paymentAmount', { where });

    return {
        payments,
        totalAmount: totalAmount || 0,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit),
        }
    };
};

/**
 * Generate Excel Report
 */
exports.generateExcelReport = async (query) => {
    const { startDate, endDate } = query;

    const where = {
        status: {
            [Op.in]: ['payment_verified', 'ready', 'completed'],
        },
    };

    if (startDate && endDate) {
        where.paymentVerifiedAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    }

    const applications = await Application.findAll({
        where,
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['firstNameAr', 'lastNameAr', 'nationalId'],
        }],
        order: [['paymentVerifiedAt', 'DESC']],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'منصة تراخيص بحيرة البردويل';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('التقرير المالي', {
        properties: { rightToLeft: true }
    });

    worksheet.columns = [
        { header: 'رقم الطلب', key: 'applicationNumber', width: 20 },
        { header: 'مقدم الطلب', key: 'applicantName', width: 30 },
        { header: 'الرقم القومي', key: 'nationalId', width: 20 },
        { header: 'المبلغ', key: 'amount', width: 15 },
        { header: 'تاريخ التحقق', key: 'date', width: 20 },
        { header: 'الحالة', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3C72' }
    };

    const statusMap = {
        'payment_verified': 'تم التحقق',
        'ready': 'جاهز للاستلام',
        'completed': 'مكتمل'
    };

    applications.forEach(app => {
        worksheet.addRow({
            applicationNumber: app.applicationNumber,
            applicantName: app.applicant ? `${app.applicant.firstNameAr} ${app.applicant.lastNameAr}` : '-',
            nationalId: app.applicant?.nationalId || '-',
            amount: app.paymentAmount || 0,
            date: app.paymentVerifiedAt ? new Date(app.paymentVerifiedAt).toLocaleDateString('ar-EG') : '-',
            status: statusMap[app.status] || app.status
        });
    });

    return workbook;
};
