const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Protect all routes
router.use(protect);
router.use(restrictTo('financial_officer', 'super_admin'));

// Dashboard
router.get('/dashboard', financialController.getDashboard);

// Pending Payments
router.get('/pending-payments', financialController.getPendingPayments);

// Payment Operations
router.get('/payment/:id', financialController.getPaymentDetails);
router.post('/verify-payment/:id', financialController.verifyPayment);
router.post('/reject-payment/:id', financialController.rejectPayment);

// Payment History & Reports
router.get('/payment-history', financialController.getPaymentHistory);
router.get('/export-report', financialController.exportReport);

module.exports = router;
