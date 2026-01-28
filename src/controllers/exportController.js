/**
 * Export Controller
 * Handles PDF and Excel exports for applications and audit logs
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const catchAsync = require('../utils/catchAsync');
const { Application, User, AuditLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Export applications to Excel
 * @route GET /api/v1/admin/applications/export/excel
 */
exports.exportApplicationsExcel = catchAsync(async (req, res, next) => {
    const { status, type, search } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (type) where.applicationType = type;
    if (search) {
        where[Op.or] = [
            { applicationNumber: { [Op.iLike]: `%${search}%` } },
            { '$applicant.firstNameAr$': { [Op.iLike]: `%${search}%` } },
            { '$applicant.lastNameAr$': { [Op.iLike]: `%${search}%` } },
            { '$applicant.nationalId$': { [Op.iLike]: `%${search}%` } },
        ];
    }

    // Fetch applications
    const applications = await Application.findAll({
        where,
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['firstNameAr', 'lastNameAr', 'nationalId', 'phone'],
        }],
        order: [['createdAt', 'DESC']],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'منصة تراخيص بحيرة البردويل';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('الطلبات', {
        properties: { rightToLeft: true }
    });

    // Define columns
    worksheet.columns = [
        { header: 'رقم الطلب', key: 'applicationNumber', width: 20 },
        { header: 'اسم مقدم الطلب', key: 'applicantName', width: 30 },
        { header: 'الرقم القومي', key: 'nationalId', width: 20 },
        { header: 'رقم الهاتف', key: 'phone', width: 15 },
        { header: 'نوع الترخيص', key: 'type', width: 15 },
        { header: 'الفئة', key: 'category', width: 20 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'المبلغ', key: 'amount', width: 12 },
        { header: 'تاريخ التقديم', key: 'createdAt', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3C72' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Status translations
    const statusMap = {
        'received': 'تم الاستلام',
        'under_review': 'قيد المراجعة',
        'approved_payment_pending': 'بانتظار الدفع',
        'payment_verified': 'تم الدفع',
        'ready': 'جاهز للاستلام',
        'completed': 'مكتمل',
        'rejected': 'مرفوض'
    };

    // Type translations
    const typeMap = {
        'fisherman': 'صياد',
        'boat': 'مركب',
        'vehicle': 'سيارة',
        'trade': 'تجارة',
        'entry': 'دخول',
        'other': 'أخرى'
    };

    // Add data rows
    applications.forEach(app => {
        worksheet.addRow({
            applicationNumber: app.applicationNumber,
            applicantName: app.applicant ? `${app.applicant.firstNameAr} ${app.applicant.lastNameAr}` : '-',
            nationalId: app.applicant?.nationalId || '-',
            phone: app.applicant?.phone || '-',
            type: typeMap[app.applicationType] || app.applicationType,
            category: app.licenseCategory,
            status: statusMap[app.status] || app.status,
            amount: app.paymentAmount || 0,
            createdAt: new Date(app.createdAt).toLocaleDateString('ar-EG'),
        });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=applications-${Date.now()}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
});

/**
 * Export single application to PDF
 * @route GET /api/v1/admin/applications/:id/export/pdf
 */
exports.exportApplicationPDF = catchAsync(async (req, res, next) => {
    const application = await Application.findByPk(req.params.id, {
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['firstNameAr', 'lastNameAr', 'nationalId', 'phone'],
        }],
    });

    if (!application) {
        return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    // Status translations
    const statusMap = {
        'received': 'تم الاستلام',
        'under_review': 'قيد المراجعة',
        'approved_payment_pending': 'بانتظار الدفع',
        'payment_verified': 'تم الدفع',
        'ready': 'جاهز للاستلام',
        'completed': 'مكتمل',
        'rejected': 'مرفوض'
    };

    const typeMap = {
        'fisherman': 'صياد',
        'boat': 'مركب',
        'vehicle': 'سيارة',
        'trade': 'تجارة',
        'entry': 'دخول',
        'other': 'أخرى'
    };

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=application-${application.applicationNumber}.pdf`);

    doc.pipe(res);

    // Add content
    doc.fontSize(20).text('منصة تراخيص بحيرة البردويل', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`طلب رقم: ${application.applicationNumber}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Application details
    doc.fontSize(14).text('بيانات الطلب', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`نوع الترخيص: ${typeMap[application.applicationType] || application.applicationType}`);
    doc.text(`الفئة: ${application.licenseCategory}`);
    doc.text(`الحالة: ${statusMap[application.status] || application.status}`);
    doc.text(`المبلغ: ${application.paymentAmount || 0} جنيه`);
    doc.text(`تاريخ التقديم: ${new Date(application.createdAt).toLocaleDateString('ar-EG')}`);
    doc.moveDown();

    // Applicant details
    doc.fontSize(14).text('بيانات مقدم الطلب', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    if (application.applicant) {
        doc.text(`الاسم: ${application.applicant.firstNameAr} ${application.applicant.lastNameAr}`);
        doc.text(`الرقم القومي: ${application.applicant.nationalId}`);
        doc.text(`رقم الهاتف: ${application.applicant.phone}`);
    }
    doc.moveDown();

    // Footer
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(10).text(`تم إنشاء هذا التقرير بتاريخ: ${new Date().toLocaleDateString('ar-EG')}`, { align: 'center' });

    doc.end();
});

/**
 * Export audit logs to Excel
 * @route GET /api/v1/admin/audit/export/excel
 */
exports.exportAuditLogsExcel = catchAsync(async (req, res, next) => {
    const { action, userId, startDate, endDate } = req.query;

    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const logs = await AuditLog.findAll({
        where,
        include: [{
            model: User,
            as: 'user',
            attributes: ['firstNameAr', 'lastNameAr'],
        }],
        order: [['createdAt', 'DESC']],
        limit: 1000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('سجل التدقيق', {
        properties: { rightToLeft: true }
    });

    worksheet.columns = [
        { header: 'التاريخ', key: 'date', width: 20 },
        { header: 'المستخدم', key: 'user', width: 25 },
        { header: 'الإجراء', key: 'action', width: 20 },
        { header: 'الوصف', key: 'description', width: 40 },
        { header: 'IP', key: 'ip', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3C72' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    logs.forEach(log => {
        worksheet.addRow({
            date: new Date(log.createdAt).toLocaleString('ar-EG'),
            user: log.user ? `${log.user.firstNameAr} ${log.user.lastNameAr}` : '-',
            action: log.action,
            description: log.description || '-',
            ip: log.ipAddress || '-',
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
});

/**
 * Export audit logs to CSV
 * @route GET /api/v1/admin/audit/export/csv
 */
exports.exportAuditLogsCSV = catchAsync(async (req, res, next) => {
    const logs = await AuditLog.findAll({
        include: [{
            model: User,
            as: 'user',
            attributes: ['firstNameAr', 'lastNameAr'],
        }],
        order: [['createdAt', 'DESC']],
        limit: 1000,
    });

    let csv = 'التاريخ,المستخدم,الإجراء,الوصف,IP\n';
    logs.forEach(log => {
        csv += `"${new Date(log.createdAt).toLocaleString('ar-EG')}","${log.user ? log.user.firstNameAr + ' ' + log.user.lastNameAr : '-'}","${log.action}","${log.description || '-'}","${log.ipAddress || '-'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send('\ufeff' + csv); // BOM for Excel UTF-8 support
});

/**
 * Export License Review to Excel
 * Includes license holder information, grouped by license type
 * @route GET /api/v1/admin/license-review/export/excel
 */
exports.exportLicenseReviewExcel = catchAsync(async (req, res, next) => {
    const { search, startDate, endDate, applicationType } = req.query;

    // Build where clause
    const where = {};
    if (applicationType) where.applicationType = applicationType;
    if (search) {
        where[Op.or] = [
            { licenseHolderName: { [Op.iLike]: `%${search}%` } },
            { licenseHolderNationalId: { [Op.iLike]: `%${search}%` } },
            { applicationNumber: { [Op.iLike]: `%${search}%` } },
        ];
    }
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
    }

    // Fetch applications
    const applications = await Application.findAll({
        where,
        include: [{
            model: User,
            as: 'applicant',
            attributes: ['firstNameAr', 'lastNameAr', 'nationalId', 'phone'],
        }],
        order: [['applicationType', 'ASC'], ['createdAt', 'DESC']],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'منصة تراخيص بحيرة البردويل';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('مراجعة التراخيص', {
        properties: { rightToLeft: true }
    });

    // Define columns with license holder info
    worksheet.columns = [
        { header: 'رقم الطلب', key: 'applicationNumber', width: 18 },
        { header: 'اسم صاحب الرخصة', key: 'licenseHolderName', width: 28 },
        { header: 'الرقم القومي لصاحب الرخصة', key: 'licenseHolderNationalId', width: 20 },
        { header: 'نوع الترخيص', key: 'type', width: 12 },
        { header: 'الفئة', key: 'category', width: 20 },
        { header: 'المدة', key: 'duration', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'المبلغ (ج.م)', key: 'amount', width: 12 },
        { header: 'تاريخ التقديم', key: 'createdAt', width: 15 },
        { header: 'مقدم الطلب', key: 'submittedBy', width: 25 },
        { header: 'هاتف مقدم الطلب', key: 'submitterPhone', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3C72' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Status translations
    const statusMap = {
        'received': 'تم الاستلام',
        'under_review': 'قيد المراجعة',
        'approved_payment_pending': 'بانتظار الدفع',
        'approved_payment_required': 'مطلوب الدفع',
        'payment_submitted': 'تم تقديم الإيصال',
        'payment_verified': 'تم التحقق من الدفع',
        'processing': 'قيد المعالجة',
        'ready': 'جاهز للاستلام',
        'completed': 'مكتمل',
        'rejected': 'مرفوض'
    };

    // Type translations
    const typeMap = {
        'fisherman': 'صياد',
        'boat': 'مركب',
        'vehicle': 'سيارة',
        'trade': 'تجارة',
        'entry': 'دخول',
        'other': 'أخرى'
    };

    // Duration translations
    const durationMap = {
        '1_month': 'شهر واحد',
        '3_months': '3 شهور',
        '6_months': '6 شهور',
        'season': 'الموسم'
    };

    // Add data rows
    applications.forEach(app => {
        worksheet.addRow({
            applicationNumber: app.applicationNumber,
            licenseHolderName: app.licenseHolderName || '-',
            licenseHolderNationalId: app.licenseHolderNationalId || '-',
            type: typeMap[app.applicationType] || app.applicationType,
            category: app.licenseCategory,
            duration: durationMap[app.duration] || app.duration,
            status: statusMap[app.status] || app.status,
            amount: app.paymentAmount || 0,
            createdAt: new Date(app.createdAt).toLocaleDateString('ar-EG'),
            submittedBy: app.applicant ? `${app.applicant.firstNameAr} ${app.applicant.lastNameAr}` : '-',
            submitterPhone: app.applicant?.phone || '-',
        });
    });

    // Add summary row
    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
        applicationNumber: 'الإجمالي',
        licenseHolderName: '',
        licenseHolderNationalId: '',
        type: '',
        category: '',
        duration: '',
        status: `${applications.length} ترخيص`,
        amount: applications.reduce((sum, app) => sum + (parseFloat(app.paymentAmount) || 0), 0),
        createdAt: '',
        submittedBy: '',
        submitterPhone: '',
    });
    summaryRow.font = { bold: true };
    summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E9' }
    };

    // Set response headers
    const filename = `license-review-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
});
