const catchAsync = require('../utils/catchAsync');
const {
  Application,
  User,
  Document,
  ApplicationStatusHistory,
} = require('../models');
const adminService = require('../services/adminService');

/**
 * View Controller - Handles server-side rendering of EJS views
 */

exports.getHome = catchAsync(async (req, res, next) => {
  res.status(200).render('home', {
    title: 'الرئيسية | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'تسجيل الدخول',
    nationalId: req.query.nationalId || '',
    password: req.query.password || '',
  });
});

exports.getRegister = catchAsync(async (req, res, next) => {
  res.status(200).render('register', {
    title: 'انشاء حساب جديد',
  });
});

exports.getContact = catchAsync(async (req, res, next) => {
  res.status(200).render('contact', {
    title: 'اتصل بنا | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getAbout = catchAsync(async (req, res, next) => {
  res.status(200).render('about', {
    title: 'عن بحيرة البردويل | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getServices = catchAsync(async (req, res, next) => {
  res.status(200).render('services', {
    title: 'الخدمات | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getNews = catchAsync(async (req, res, next) => {
  const { News } = require('../models');

  const page = parseInt(req.query.page) || 1;
  const limit = 9;
  const offset = (page - 1) * limit;
  const category = req.query.category || '';
  const sort = req.query.sort || 'latest';

  // Build where clause
  const where = { isPublished: true };
  if (category) {
    where.category = category;
  }

  // Build order clause - use isPinned for popular since viewCount doesn't exist
  let order = [['createdAt', 'DESC']];
  if (sort === 'popular') {
    order = [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC'],
    ];
  } else if (sort === 'oldest') {
    order = [['createdAt', 'ASC']];
  }

  const { count, rows: news } = await News.findAndCountAll({
    where,
    order,
    limit,
    offset,
  });

  // Get pinned/popular news for sidebar
  const popularNews = await News.findAll({
    where: { isPublished: true },
    order: [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 5,
  });

  res.status(200).render('news', {
    title: 'الأخبار والتحديثات',
    user: req.user || null,
    news,
    popularNews,
    currentCategory: category,
    currentSort: sort,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
    },
  });
});

exports.getNewsDetail = catchAsync(async (req, res, next) => {
  const { News } = require('../models');
  const AppError = require('../utils/appError');

  const article = await News.findOne({
    where: {
      id: req.params.id,
      isPublished: true,
    },
  });

  if (!article) {
    return next(new AppError('لم يتم العثور على الخبر', 404));
  }

  // Increment view count
  await article.increment('viewCount');

  // Get related/popular news
  const relatedNews = await News.findAll({
    where: { isPublished: true },
    order: [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 5,
  });

  res.status(200).render('news-detail', {
    title: article.titleAr,
    user: req.user || null,
    article,
    relatedNews,
    currentUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
  });
});

exports.getDashboard = catchAsync(async (req, res, next) => {
  // Get user's applications with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { count, rows: applications } = await Application.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  // Get stats for this user
  const stats = {
    total: await Application.count({ where: { userId: req.user.id } }),
    underReview: await Application.count({
      where: { userId: req.user.id, status: 'under_review' },
    }),
    completed: await Application.count({
      where: { userId: req.user.id, status: 'completed' },
    }),
    rejected: await Application.count({
      where: { userId: req.user.id, status: 'rejected' },
    }),
  };

  res.status(200).render('dashboard', {
    title: 'لوحة التحكم',
    user: req.user,
    applications,
    stats,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit,
    },
  });
});

exports.getNewLicense = catchAsync(async (req, res, next) => {
  res.status(200).render('apply', {
    title: 'تقديم طلب جديد',
    user: req.user,
  });
});

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  // Get dashboard stats
  const stats = await adminService.getDashboardStats();

  // Get recent applications (last 5)
  const result = await adminService.getAllApplications({ limit: 5 });

  res.status(200).render('admin', {
    title: 'لوحة الإدارة',
    user: req.user,
    currentPage: 'dashboard',
    stats,
    recentApplications: result.applications,
    pendingCount: stats.overview.new,
  });
});

exports.getReviewApplication = catchAsync(async (req, res, next) => {
  const application = await adminService.getApplicationForReview(req.params.id);

  res.status(200).render('admin-details', {
    title: `مراجعة الطلب #${application.applicationNumber}`,
    user: req.user,
    currentPage: 'applications',
    application,
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).render('profile', {
    title: 'الملف الشخصي',
    user: req.user,
  });
});

// New view controller for pricing management
exports.getAdminPricing = catchAsync(async (req, res, next) => {
  const pricingService = require('../services/pricingService');
  const prices = await pricingService.getAllPrices({});

  res.status(200).render('admin-pricing', {
    title: 'إعدادات التسعير',
    user: req.user,
    currentPage: 'pricing',
    prices,
  });
});

// New view controller for audit logs (super_admin only)
exports.getAuditLogs = catchAsync(async (req, res, next) => {
  res.status(200).render('admin-audit', {
    title: 'سجل النشاطات',
    user: req.user,
    currentPage: 'audit',
  });
});

// Admin applications list view
exports.getAdminApplications = catchAsync(async (req, res, next) => {
  const result = await adminService.getAllApplications(req.query);

  res.status(200).render('admin-applications', {
    title: 'إدارة الطلبات',
    user: req.user,
    currentPage: 'applications',
    applications: result.applications,
    pagination: result.pagination,
    query: req.query || {},
    pendingCount: await Application.count({ where: { status: 'received' } }),
  });
});

// User application details view
exports.getApplicationDetails = catchAsync(async (req, res, next) => {
  const AppError = require('../utils/appError');

  const application = await Application.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id, // Ensure user can only view their own applications
    },
    include: [
      { model: Document, as: 'documents' },
      {
        model: ApplicationStatusHistory,
        as: 'statusHistory',
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!application) {
    return next(new AppError('لم يتم العثور على الطلب', 404));
  }

  res.status(200).render('application-details', {
    title: `تفاصيل الطلب #${application.applicationNumber}`,
    user: req.user,
    application,
  });
});

// Payment page view
exports.getPaymentPage = catchAsync(async (req, res, next) => {
  const AppError = require('../utils/appError');

  const application = await Application.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'firstNameAr', 'lastNameAr', 'phone', 'nationalId'],
      },
    ],
  });

  if (!application) {
    return next(new AppError('لم يتم العثور على الطلب', 404));
  }

  // Check if payment is required
  if (application.status !== 'approved_payment_pending') {
    return res.redirect(`/applications/${application.id}`);
  }

  res.status(200).render('payment', {
    title: 'دفع الرسوم',
    user: req.user,
    application,
  });
});

// User notifications view
exports.getNotifications = catchAsync(async (req, res, next) => {
  const { Notification } = require('../models');

  // Fetch notifications for the current user
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  res.status(200).render('notifications', {
    title: 'الإشعارات',
    user: req.user,
    notifications,
  });
});

// Super Admin Dashboard with charts and statistics
exports.getSuperAdminDashboard = catchAsync(async (req, res, next) => {
  const { Application, User } = require('../models');
  const { Op, fn, col, literal } = require('sequelize');

  // Get dashboard stats
  const stats = await adminService.getDashboardStats();

  // Get recent applications
  const result = await adminService.getAllApplications({ limit: 10 });

  // Calculate total revenue from completed applications
  const totalRevenueResult = await Application.findOne({
    where: { status: 'completed' },
    attributes: [[fn('SUM', col('payment_amount')), 'total']],
    raw: true,
  });
  const totalRevenue = parseFloat(totalRevenueResult?.total) || 0;

  // Get total users count
  const totalUsers = await User.count();

  // Get monthly revenue data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenueRaw = await Application.findAll({
    where: {
      status: 'completed',
      paymentVerifiedAt: { [Op.gte]: sixMonthsAgo },
    },
    attributes: [
      [fn('DATE_TRUNC', 'month', col('payment_verified_at')), 'month'],
      [fn('SUM', col('payment_amount')), 'amount'],
    ],
    group: [fn('DATE_TRUNC', 'month', col('payment_verified_at'))],
    order: [[fn('DATE_TRUNC', 'month', col('payment_verified_at')), 'ASC']],
    raw: true,
  });

  // Format monthly revenue for chart
  const monthlyRevenue = monthlyRevenueRaw.map(item => ({
    month: new Date(item.month).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' }),
    amount: parseFloat(item.amount) || 0,
  }));

  res.status(200).render('super-admin-dashboard', {
    title: 'لوحة الإحصائيات المتقدمة',
    user: req.user,
    currentPage: 'super-dashboard',
    stats,
    recentApplications: result.applications,
    totalRevenue,
    totalUsers,
    monthlyRevenue,
  });
});

// Admin users management page
exports.getAdminUsers = catchAsync(async (req, res, next) => {
  const { User } = require('../models');

  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const { count, rows: users } = await User.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    attributes: ['id', 'firstNameAr', 'lastNameAr', 'nationalId', 'phone', 'email', 'role', 'isActive', 'createdAt'],
  });

  res.status(200).render('admin-users', {
    title: 'إدارة المستخدمين',
    user: req.user,
    currentUser: req.user,
    currentPage: 'users',
    users,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit,
    },
  });
});
