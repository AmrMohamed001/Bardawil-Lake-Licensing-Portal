/**
 * Payment Controller
 * Handles payment initiation and callbacks from Paymob
 */

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const paymobService = require('../services/paymobService');
const { Application, Notification, ApplicationStatusHistory, User } = require('../models');

/**
 * Initiate payment for an approved application
 * @route POST /api/v1/payment/initiate/:applicationId
 */
exports.initiatePayment = catchAsync(async (req, res, next) => {
    const { applicationId } = req.params;

    // Find the application
    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId: req.user.id,
        },
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['id', 'firstNameAr', 'lastNameAr', 'phone', 'nationalId']
        }],
    });

    if (!application) {
        return next(new AppError(404, 'الطلب غير موجود'));
    }

    // Check if application is approved and waiting for payment
    if (application.status !== 'approved_payment_pending') {
        return next(new AppError(400, 'الطلب غير جاهز للدفع'));
    }

    // Check if payment amount is set
    if (!application.paymentAmount || application.paymentAmount <= 0) {
        return next(new AppError(400, 'لم يتم تحديد مبلغ الدفع'));
    }

    // Initiate payment with Paymob
    const paymentResult = await paymobService.initiatePayment({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        amount: parseFloat(application.paymentAmount),
        applicantName: `${application.applicant?.firstNameAr || ''} ${application.applicant?.lastNameAr || ''}`.trim() || 'مستخدم البردويل',
        applicantPhone: application.applicant?.phone || '01000000000',
        applicantEmail: 'customer@bardawil.gov.eg', // No email field in User model
        licenseType: application.applicationType,
        licenseCategory: application.licenseCategory,
    });

    // Update application with payment order ID
    await application.update({
        paymobOrderId: paymentResult.orderId,
    });

    res.status(200).json({
        status: 'success',
        data: {
            paymentUrl: paymentResult.paymentUrl,
            orderId: paymentResult.orderId,
            amount: paymentResult.amount,
        },
    });
});

/**
 * Handle Paymob callback (webhook)
 * @route POST /api/v1/payment/callback
 */
exports.handleCallback = catchAsync(async (req, res, next) => {
    const { obj, hmac } = req.body;

    // Log callback for debugging
    console.log('Paymob Callback Received:', JSON.stringify(req.body, null, 2));

    // Verify HMAC signature
    const isValid = paymobService.verifyCallback({ hmac, obj });

    if (!isValid) {
        console.error('Invalid Paymob callback signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    // Parse transaction status
    const transactionStatus = paymobService.parseTransactionStatus(obj);

    // Extract application ID from merchant order ID
    const merchantOrderId = obj.order?.merchant_order_id;
    const applicationId = paymobService.extractApplicationId(merchantOrderId);

    if (!applicationId) {
        console.error('Could not extract application ID from:', merchantOrderId);
        return res.status(200).json({ status: 'ok' }); // Acknowledge but don't process
    }

    // Find the application
    const application = await Application.findByPk(applicationId);

    if (!application) {
        console.error('Application not found:', applicationId);
        return res.status(200).json({ status: 'ok' });
    }

    // Process based on transaction status
    if (transactionStatus.status === 'success') {
        // Payment successful - update application status
        const previousStatus = application.status;

        await application.update({
            status: 'completed',
            paymentVerifiedAt: new Date(),
            paymobTransactionId: obj.id,
        });

        // Log status change
        await ApplicationStatusHistory.create({
            applicationId: application.id,
            oldStatus: previousStatus,
            newStatus: 'completed',
            notes: `تم الدفع بنجاح عبر باي موب - رقم العملية: ${obj.id}`,
            changedBy: application.userId, // User who paid
        });

        // Create notification for user
        await Notification.create({
            userId: application.userId,
            type: 'payment_success',
            titleAr: 'تم الدفع بنجاح',
            messageAr: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. يمكنك استلام الرخصة من مكتب التراخيص خلال 4 أيام عمل.`,
            relatedApplicationId: application.id,
        });

        console.log(`Payment successful for application ${application.applicationNumber}`);
    } else if (transactionStatus.status === 'failed') {
        // Payment failed - create notification
        await Notification.create({
            userId: application.userId,
            type: 'payment_failed',
            titleAr: 'فشل الدفع',
            messageAr: `فشلت عملية الدفع لطلب ${application.applicationNumber}. يرجى المحاولة مرة أخرى.`,
            relatedApplicationId: application.id,
        });

        console.log(`Payment failed for application ${application.applicationNumber}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'ok' });
});

/**
 * Payment success redirect page
 * @route GET /api/v1/payment/success
 * Handles redirect from Paymob after successful payment
 */
exports.paymentSuccess = catchAsync(async (req, res, next) => {
    const { merchant_order_id, success, id: transactionId } = req.query;

    // Extract application ID from merchant_order_id (format: BRD-{appId}-{timestamp})
    const applicationId = paymobService.extractApplicationId(merchant_order_id);

    let application = null;
    if (applicationId) {
        application = await Application.findByPk(applicationId);

        // Update application status if payment was successful
        if (application && success === 'true') {
            const previousStatus = application.status;

            await application.update({
                status: 'payment_verified',
                paymentVerifiedAt: new Date(),
                paymobTransactionId: transactionId,
            });

            // Log status change
            await ApplicationStatusHistory.create({
                applicationId: application.id,
                oldStatus: previousStatus,
                newStatus: 'payment_verified',
                notes: `تم الدفع بنجاح عبر باي موب - رقم العملية: ${transactionId}`,
                changedBy: application.userId,
            });

            // Create notification for user
            await Notification.create({
                userId: application.userId,
                type: 'payment_success',
                title: 'تم الدفع بنجاح',
                message: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. برجاء التوجه إلى قسم التراخيص في خلال 7-12 يوم عمل لاستلام تصريحك.`,
                applicationId: application.id,
            });

            console.log(`Payment successful for application ${application.applicationNumber}`);
        }
    }

    res.status(200).render('payment-success', {
        title: 'تم الدفع بنجاح',
        user: req.user || null,
        application,
    });
});

/**
 * Payment failed redirect page
 * @route GET /api/v1/payment/failed
 */
exports.paymentFailed = catchAsync(async (req, res, next) => {
    const { merchant_order_id } = req.query;

    // Extract application ID
    const applicationId = paymobService.extractApplicationId(merchant_order_id);

    let application = null;
    if (applicationId) {
        application = await Application.findByPk(applicationId);
    }

    res.status(200).render('payment-failed', {
        title: 'فشل الدفع',
        user: req.user || null,
        application,
    });
});

/**
 * Get payment status for an application
 * @route GET /api/v1/payment/status/:applicationId
 */
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
    const { applicationId } = req.params;

    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId: req.user.id,
        },
        attributes: ['id', 'applicationNumber', 'status', 'paymentAmount', 'paymentVerifiedAt'],
    });

    if (!application) {
        return next(new AppError(404, 'الطلب غير موجود'));
    }

    const isPaid = application.status === 'completed' || application.paymentVerifiedAt;
    const isPending = application.status === 'approved_payment_pending';

    res.status(200).json({
        status: 'success',
        data: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            paymentStatus: isPaid ? 'paid' : (isPending ? 'pending' : 'not_required'),
            amount: application.paymentAmount,
            paidAt: application.paymentVerifiedAt,
        },
    });
});

/**
 * Confirm payment after returning from Paymob (for local testing without webhooks)
 * @route POST /api/v1/payment/confirm/:applicationId
 */
exports.confirmPayment = catchAsync(async (req, res, next) => {
    const { applicationId } = req.params;

    const application = await Application.findOne({
        where: {
            id: applicationId,
            userId: req.user.id,
        },
    });

    if (!application) {
        return next(new AppError(404, 'الطلب غير موجود'));
    }

    // Only confirm if status is still pending payment
    if (application.status !== 'approved_payment_pending') {
        return res.status(200).json({
            status: 'success',
            message: application.status === 'payment_verified' ? 'تم تأكيد الدفع مسبقاً' : 'الطلب ليس في حالة انتظار الدفع',
            data: { application }
        });
    }

    // Update application status
    const previousStatus = application.status;
    await application.update({
        status: 'payment_verified',
        paymentVerifiedAt: new Date(),
    });

    // Log status change
    await ApplicationStatusHistory.create({
        applicationId: application.id,
        oldStatus: previousStatus,
        newStatus: 'payment_verified',
        notes: 'تم تأكيد الدفع يدوياً بعد الدفع عبر باي موب',
        changedBy: application.userId,
    });

    // Create notification
    await Notification.create({
        userId: application.userId,
        type: 'payment_success',
        title: 'تم الدفع بنجاح',
        message: `تم استلام الدفع لطلب ${application.applicationNumber} بنجاح. برجاء التوجه إلى قسم التراخيص في خلال 7-12 يوم عمل لاستلام تصريحك.`,
        applicationId: application.id,
    });

    res.status(200).json({
        status: 'success',
        message: 'تم تأكيد الدفع بنجاح',
        data: {
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            newStatus: 'payment_verified',
        },
    });
});
