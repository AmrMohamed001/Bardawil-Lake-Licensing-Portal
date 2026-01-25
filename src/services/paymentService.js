const { Application, User, ApplicationStatusHistory, Notification } = require('../models');
const AppError = require('../utils/appError');
const paymobService = require('./paymobService');
const auditLogService = require('./auditLogService');

/**
 * Initiate payment for an approved application
 */
exports.initiateApplicationPayment = async (applicationId, userId) => {
    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId,
        },
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['id', 'firstNameAr', 'lastNameAr', 'phone', 'nationalId']
        }],
    });

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (application.status !== 'approved_payment_pending') {
        throw new AppError('الطلب غير جاهز للدفع', 400);
    }

    if (!application.paymentAmount || application.paymentAmount <= 0) {
        throw new AppError('لم يتم تحديد مبلغ الدفع', 400);
    }

    const paymentResult = await paymobService.initiatePayment({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        amount: parseFloat(application.paymentAmount),
        applicantName: `${application.applicant?.firstNameAr || ''} ${application.applicant?.lastNameAr || ''}`.trim() || 'مستخدم البردويل',
        applicantPhone: application.applicant?.phone || '01000000000',
        applicantEmail: 'customer@bardawil.gov.eg',
        licenseType: application.applicationType,
        licenseCategory: application.licenseCategory,
    });

    await application.update({
        paymobOrderId: paymentResult.orderId,
    });

    return paymentResult;
};

/**
 * Process Paymob Callback
 */
exports.processCallback = async (body) => {
    const { obj, hmac } = body;

    // Verify HMAC signature
    const isValid = paymobService.verifyCallback({ hmac, obj });
    if (!isValid) {
        throw new Error('Invalid Paymob callback signature');
    }

    const transactionStatus = paymobService.parseTransactionStatus(obj);
    const merchantOrderId = obj.order?.merchant_order_id;
    const applicationId = paymobService.extractApplicationId(merchantOrderId);

    if (!applicationId) return { status: 'ok', message: 'No Application ID' };

    const application = await Application.findByPk(applicationId);
    if (!application) return { status: 'ok', message: 'Application Not Found' };

    if (transactionStatus.status === 'success') {
        const previousStatus = application.status;

        await application.update({
            status: 'completed',
            paymentVerifiedAt: new Date(),
            paymobTransactionId: obj.id,
        });

        await ApplicationStatusHistory.create({
            applicationId: application.id,
            oldStatus: previousStatus,
            newStatus: 'completed',
            notes: `تم الدفع بنجاح عبر باي موب - رقم العملية: ${obj.id}`,
            changedBy: application.userId,
        });

        await Notification.create({
            userId: application.userId,
            type: 'payment_success',
            title: 'تم الدفع بنجاح',
            message: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. يمكنك استلام الرخصة من مكتب التراخيص خلال 4 أيام عمل.`,
            applicationId: application.id,
        });

        return { status: 'success', application };
    } else if (transactionStatus.status === 'failed') {
        await Notification.create({
            userId: application.userId,
            type: 'payment_failed',
            title: 'فشل الدفع',
            message: `فشلت عملية الدفع لطلب ${application.applicationNumber}. يرجى المحاولة مرة أخرى.`,
            applicationId: application.id,
        });

        return { status: 'failed', application };
    }

    return { status: 'ok' };
};

/**
 * Handle Payment Success (Redirect)
 */
exports.handlePaymentSuccess = async (queryParams) => {
    const { merchant_order_id, success, id: transactionId } = queryParams;
    const applicationId = paymobService.extractApplicationId(merchant_order_id);

    let application = null;
    if (applicationId) {
        application = await Application.findByPk(applicationId);

        if (application && success === 'true') {
            const previousStatus = application.status;

            await application.update({
                status: 'payment_verified',
                paymentVerifiedAt: new Date(),
                paymobTransactionId: transactionId,
            });

            await ApplicationStatusHistory.create({
                applicationId: application.id,
                oldStatus: previousStatus,
                newStatus: 'payment_verified',
                notes: `تم الدفع بنجاح عبر باي موب - رقم العملية: ${transactionId}`,
                changedBy: application.userId,
            });

            await Notification.create({
                userId: application.userId,
                type: 'payment_success',
                title: 'تم الدفع بنجاح',
                message: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. برجاء التوجه إلى قسم التراخيص في خلال 7-12 يوم عمل لاستلام تصريحك.`,
                applicationId: application.id,
            });
        }
    }
    return application;
};

/**
 * Handle Payment Failed (Redirect)
 */
exports.handlePaymentFailed = async (merchantOrderId) => {
    const applicationId = paymobService.extractApplicationId(merchantOrderId);
    if (applicationId) {
        return await Application.findByPk(applicationId);
    }
    return null;
};

/**
 * Get Payment Status
 */
exports.getPaymentStatus = async (applicationId, userId) => {
    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId,
        },
        attributes: ['id', 'applicationNumber', 'status', 'paymentAmount', 'paymentVerifiedAt'],
    });

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    const isPaid = application.status === 'completed' || application.paymentVerifiedAt;
    const isPending = application.status === 'approved_payment_pending';

    return {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        paymentStatus: isPaid ? 'paid' : (isPending ? 'pending' : 'not_required'),
        amount: application.paymentAmount,
        paidAt: application.paymentVerifiedAt,
    };
};

/**
 * Confirm Manual Payment (Test/Dev)
 */
exports.confirmManualPayment = async (applicationId, userId) => {
    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId,
        },
    });

    if (!application) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (application.status !== 'approved_payment_pending') {
        return {
            status: 'success',
            message: application.status === 'payment_verified' ? 'تم تأكيد الدفع مسبقاً' : 'الطلب ليس في حالة انتظار الدفع',
            application
        };
    }

    const previousStatus = application.status;
    await application.update({
        status: 'payment_verified',
        paymentVerifiedAt: new Date(),
    });

    await ApplicationStatusHistory.create({
        applicationId: application.id,
        oldStatus: previousStatus,
        newStatus: 'payment_verified',
        notes: 'تم تأكيد الدفع يدوياً بعد الدفع عبر باي موب',
        changedBy: application.userId,
    });

    await Notification.create({
        userId: application.userId,
        type: 'payment_success',
        title: 'تم الدفع بنجاح',
        message: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. برجاء التوجه إلى قسم التراخيص في خلال 7-12 يوم عمل لاستلام تصريحك.`,
        applicationId: application.id,
    });

    return {
        status: 'success',
        message: 'تم تأكيد الدفع بنجاح',
        application
    };
};
