/**
 * Payment Routes
 * Handles Paymob payment integration
 */

const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/v1/payment/initiate/:applicationId
 * @desc    Initiate payment for an approved application
 * @access  Private
 */
router.post('/initiate/:applicationId', protect, paymentController.initiatePayment);

/**
 * @route   POST /api/v1/payment/callback
 * @desc    Handle Paymob webhook callback
 * @access  Public (verified by HMAC)
 */
router.post('/callback', paymentController.handleCallback);

/**
 * @route   GET /api/v1/payment/success
 * @desc    Payment success redirect page
 * @access  Public (with optional auth)
 */
router.get('/success', optionalAuth, paymentController.paymentSuccess);

/**
 * @route   GET /api/v1/payment/failed
 * @desc    Payment failed redirect page
 * @access  Public (with optional auth)
 */
router.get('/failed', optionalAuth, paymentController.paymentFailed);

/**
 * @route   GET /api/v1/payment/status/:applicationId
 * @desc    Get payment status for an application
 * @access  Private
 */
router.get('/status/:applicationId', protect, paymentController.getPaymentStatus);

/**
 * @route   POST /api/v1/payment/confirm/:applicationId
 * @desc    Manually confirm payment after completing on Paymob (for local testing)
 * @access  Private
 */
router.post('/confirm/:applicationId', protect, paymentController.confirmPayment);

module.exports = router;
