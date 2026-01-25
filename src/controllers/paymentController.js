const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const paymentService = require('../services/paymentService');

/**
 * Payment Controller
 * Handles payment initiation and callbacks from Paymob
 */

/**
 * Initiate payment for an approved application
 * @route POST /api/v1/payment/initiate/:applicationId
 */
exports.initiatePayment = catchAsync(async (req, res, next) => {
    const paymentResult = await paymentService.initiateApplicationPayment(
        req.params.applicationId,
        req.user.id
    );

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
    console.log('Paymob Callback Received:', JSON.stringify(req.body, null, 2));

    try {
        await paymentService.processCallback(req.body);
    } catch (error) {
        console.error('Error processing Paymob callback:', error.message);
        if (error.message.includes('Invalid signature')) {
            return res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }
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
    const application = await paymentService.handlePaymentSuccess(req.query);

    res.status(200).render('payments/success', {
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
    const application = await paymentService.handlePaymentFailed(req.query.merchant_order_id);

    res.status(200).render('payments/failed', {
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
    const status = await paymentService.getPaymentStatus(
        req.params.applicationId,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        data: status,
    });
});

/**
 * Confirm payment after returning from Paymob (for local testing without webhooks)
 * @route POST /api/v1/payment/confirm/:applicationId
 */
exports.confirmPayment = catchAsync(async (req, res, next) => {
    const result = await paymentService.confirmManualPayment(
        req.params.applicationId,
        req.user.id
    );

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.application ? {
            applicationId: result.application.id,
            applicationNumber: result.application.applicationNumber,
            newStatus: 'payment_verified',
        } : null,
    });
});
