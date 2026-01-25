const AppError = require('../utils/appError');
const auditLogService = require('../services/auditLogService');
const financialService = require('../services/financialService');

/**
 * Financial Department Controller
 */

// Get Dashboard Stats
exports.getDashboard = async (req, res, next) => {
    try {
        const stats = await financialService.getDashboardStats();
        const recentData = await financialService.getRecentApplications(req.query);

        res.render('financial/dashboard', {
            title: 'لوحة القسم المالي',
            user: req.user,
            query: req.query,
            stats,
            recentApplications: recentData.applications,
            pagination: recentData.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get Pending Payments List
exports.getPendingPayments = async (req, res, next) => {
    try {
        const result = await financialService.getPendingPayments(req.query);

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                data: result.applications,
                pagination: result.pagination,
            });
        }

        res.render('financial/pending-payments', {
            title: 'المدفوعات المعلقة',
            user: req.user,
            applications: result.applications,
            pagination: result.pagination,
            search: req.query.search,
        });
    } catch (error) {
        next(error);
    }
};

// Get Payment Details
exports.getPaymentDetails = async (req, res, next) => {
    try {
        const application = await financialService.getPaymentDetails(req.params.id);

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                data: application,
            });
        }

        res.json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

// Verify Payment
exports.verifyPayment = async (req, res, next) => {
    try {
        const { application, oldStatus } = await financialService.verifyPayment(
            req.params.id,
            req.user.id,
            req.body.notes
        );

        // Audit Log (kept in controller for now as it uses req)
        await auditLogService.logAction({
            userId: req.user.id,
            action: 'VERIFY_PAYMENT',
            entityType: 'application',
            entityId: application.id,
            description: `التحقق من الدفع للطلب ${application.applicationNumber}`,
            previousData: { status: oldStatus },
            newData: { status: 'payment_verified' }
        });

        res.json({
            success: true,
            message: 'تم التحقق من الدفع بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

// Reject Payment
exports.rejectPayment = async (req, res, next) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim().length < 5) {
            return next(new AppError('يجب تقديم سبب واضح للرفض (5 أحرف على الأقل)', 400));
        }

        const { application, oldStatus } = await financialService.rejectPayment(
            req.params.id,
            req.user.id,
            reason
        );

        // Audit Log
        await auditLogService.logAction({
            userId: req.user.id,
            action: 'REJECT_PAYMENT',
            entityType: 'application',
            entityId: application.id,
            description: `رفض إيصال الدفع للطلب ${application.applicationNumber}`,
            previousData: { paymentReceiptPath: 'EXISTING', status: oldStatus },
            newData: { paymentReceiptPath: null, rejectionReason: reason }
        });

        res.json({
            success: true,
            message: 'تم رفض الإيصال بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

// Payment History
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const result = await financialService.getPaymentHistory(req.query);

        res.render('financial/payment-history', {
            title: 'سجل المدفوعات',
            user: req.user,
            payments: result.payments,
            totalAmount: result.totalAmount,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

// Export Report
exports.exportReport = async (req, res, next) => {
    try {
        const workbook = await financialService.generateExcelReport(req.query);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};
