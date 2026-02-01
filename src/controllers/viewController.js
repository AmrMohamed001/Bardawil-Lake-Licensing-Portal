const catchAsync = require('../utils/catchAsync');
const viewService = require('../services/viewService');
const adminService = require('../services/adminService'); // Kept for some direct calls if needed, or move all to viewService
const { Application, News } = require('../models'); // Some counts are still used inline in legacy code? Let's check.
const { Op } = require('sequelize');

/**
 * View Controller - Handles server-side rendering of EJS views
 */

exports.getHome = catchAsync(async (req, res, next) => {
  const topNews = await News.findAll({
    where: { isPublished: true },
    order: [['viewCount', 'DESC']],
    limit: 4,
  });

  // Prevent browser caching of this page
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.status(200).render('public/home', {
    title: 'الرئيسية | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
    news: topNews,
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('auth/login', {
    title: 'تسجيل الدخول',
    nationalId: req.query.nationalId || '',
    password: req.query.password || '',
  });
});

exports.getRegister = catchAsync(async (req, res, next) => {
  res.status(200).render('auth/register', {
    title: 'انشاء حساب جديد',
  });
});

exports.getContact = catchAsync(async (req, res, next) => {
  res.status(200).render('public/contact', {
    title: 'اتصل بنا | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getTerms = catchAsync(async (req, res, next) => {
  res.status(200).render('public/terms', {
    title: 'الشروط والأحكام | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getAbout = catchAsync(async (req, res, next) => {
  res.status(200).render('public/about', {
    title: 'عن بحيرة البردويل | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getServices = catchAsync(async (req, res, next) => {
  res.status(200).render('public/services', {
    title: 'الخدمات | بوابة تراخيص بحيرة البردويل',
    user: req.user || null,
  });
});

exports.getNews = catchAsync(async (req, res, next) => {
  const data = await viewService.getNewsData(req.query);

  res.status(200).render('public/news', {
    title: 'الأخبار والتحديثات',
    user: req.user || null,
    news: data.news,
    popularNews: data.popularNews,
    currentCategory: req.query.category || '',
    currentSort: req.query.sort || 'latest',
    pagination: data.pagination,
  });
});

exports.getNewsDetail = catchAsync(async (req, res, next) => {
  const data = await viewService.getNewsDetailData(req.params.id);

  res.status(200).render('public/news-detail', {
    title: data.article.titleAr,
    user: req.user || null,
    article: data.article,
    relatedNews: data.relatedNews,
    currentUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
  });
});

exports.getDashboard = catchAsync(async (req, res, next) => {
  const data = await viewService.getUserDashboardData(req.user.id, req.query);

  res.status(200).render('applications/dashboard', {
    title: 'لوحة التحكم',
    user: req.user,
    applications: data.applications,
    stats: data.stats,
    pagination: data.pagination,
  });
});

exports.getNewLicense = catchAsync(async (req, res, next) => {
  const data = await viewService.getNewLicenseData();

  res.status(200).render('applications/apply', {
    title: 'تقديم طلب جديد',
    user: req.user,
    pricesJson: data.pricesJson,
  });
});

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  const data = await viewService.getAdminDashboardData();

  res.status(200).render('admin/dashboard', {
    title: 'لوحة الإدارة',
    user: req.user,
    currentPage: 'dashboard',
    stats: data.stats,
    recentApplications: data.recentApplications,
    pendingCount: data.pendingCount,
  });
});

exports.getReviewApplication = catchAsync(async (req, res, next) => {
  const application = await adminService.getApplicationForReview(req.params.id);

  res.status(200).render('admin/application-details', {
    title: `مراجعة الطلب #${application.applicationNumber}`,
    user: req.user,
    currentPage: 'applications',
    application,
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).render('user/profile', {
    title: 'الملف الشخصي',
    user: req.user,
  });
});

exports.getAdminPricing = catchAsync(async (req, res, next) => {
  const prices = await viewService.getAdminPricingData();
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/pricing', {
    title: 'إعدادات التسعير',
    user: req.user,
    currentPage: 'pricing',
    prices,
    pendingCount,
  });
});

exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/audit', {
    title: 'سجل النشاطات',
    user: req.user,
    currentPage: 'audit',
    pendingCount,
  });
});

exports.getAdminApplications = catchAsync(async (req, res, next) => {
  const result = await adminService.getAllApplications(req.query);
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/applications', {
    title: 'إدارة الطلبات',
    user: req.user,
    currentPage: 'applications',
    applications: result.applications,
    pagination: result.pagination,
    query: req.query || {},
    pendingCount,
  });
});

exports.getApplicationDetails = catchAsync(async (req, res, next) => {
  const application = await viewService.getApplicationDetails(req.params.id, req.user.id);

  // Safe JSON Parse for application data
  let applicationData = {};
  if (application.data) {
    try {
      applicationData = typeof application.data === 'string'
        ? JSON.parse(application.data)
        : application.data;
    } catch (e) {
      console.error('Error parsing application data JSON:', e);
      applicationData = {};
    }
  }

  // Bank Account from Config
  const bankAccount = process.env.BANK_ACCOUNT_NUMBER || '5170199000001735';

  // Timeline Logic
  const timelineSteps = [
    {
      id: 'received',
      title: 'تم استلام الطلب',
      description: 'تم استلام طلبك بنجاح وجاري المراجعة',
      date: application.createdAt,
      status: 'completed',
      icon: 'check'
    },
    {
      id: 'review',
      title: 'مراجعة الطلب',
      description: 'جاري مراجعة المستندات والبيانات',
      date: application.reviewedAt,
      status: 'upcoming',
      icon: 'search'
    },
    {
      id: 'approval',
      title: 'الموافقات',
      description: 'في انتظار الموافقة النهائية',
      date: application.approvedAt,
      status: 'upcoming',
      icon: 'file-signature'
    },
    {
      id: 'payment',
      title: 'الدفع',
      description: 'سداد الرسوم المقررة',
      date: application.paymentVerifiedAt,
      status: 'upcoming',
      icon: 'credit-card'
    },
    {
      id: 'delivery',
      title: 'الاستلام',
      description: 'استلام الترخيص النهائي',
      date: application.completedAt || (application.status === 'completed' ? application.updatedAt : null),
      status: 'upcoming',
      icon: 'gift'
    }
  ];

  // Calculate status for each step based on application state
  const status = application.status;

  // Step 2: Review
  if (['under_review', 'approved_payment_pending', 'payment_verified', 'ready', 'completed'].includes(status) || application.reviewedAt) {
    timelineSteps[1].status = 'completed';
    timelineSteps[1].description = 'تمت مراجعة الطلب بنجاح';
  } else if (status === 'received') {
    timelineSteps[1].status = 'active'; // Or pending/processing style
  }

  // Step 3: Approval
  if (['approved_payment_pending', 'payment_verified', 'ready', 'completed'].includes(status) || application.approvedAt) {
    timelineSteps[2].status = 'completed';
    timelineSteps[2].description = 'تمت الموافقة على الطلب';
  } else if (status === 'under_review') {
    timelineSteps[2].status = 'upcoming'; // Waiting for review to finish
  }

  // Step 4: Payment
  if (['payment_verified', 'ready', 'completed'].includes(status) || application.paymentVerifiedAt) {
    timelineSteps[3].status = 'completed';
    timelineSteps[3].description = 'تم الدفع بنجاح';
  } else if (status === 'approved_payment_pending') {
    timelineSteps[3].status = 'active';
    timelineSteps[3].description = 'يرجى سداد الرسوم';
  }

  // Step 5: Delivery
  if (status === 'completed') {
    timelineSteps[4].status = 'completed';
    timelineSteps[4].description = 'تم استلام الترخيص';
  } else if (status === 'ready') {
    timelineSteps[4].status = 'active';
    timelineSteps[4].description = 'الترخيص جاهز للاستلام';
  } else if (status === 'payment_verified') {
    timelineSteps[4].status = 'upcoming'; // Preparing
    timelineSteps[4].description = 'جاري إعداد الترخيص (7-12 يوم)';
  }

  // Handle Rejection
  if (status === 'rejected') {
    // Find the current active step and mark as rejected? 
    // Or just show a global rejection state. 
    // For simplicity with this UI, we might mark the current step as error.
    // simpler to just pass a flag.
  }

  res.status(200).render('applications/details', {
    title: `تفاصيل الطلب #${application.applicationNumber}`,
    user: req.user,
    application,
    applicationData,
    bankAccount,
    timelineSteps
  });
});

exports.getPaymentPage = catchAsync(async (req, res, next) => {
  const application = await viewService.getPaymentPageData(req.params.id, req.user.id);

  // Check if payment is required
  if (application.status !== 'approved_payment_pending') {
    return res.redirect(`/applications/${application.id}`);
  }

  res.status(200).render('payments/pay', {
    title: 'دفع الرسوم',
    user: req.user,
    application,
  });
});

exports.getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await viewService.getNotificationsData(req.user.id);

  res.status(200).render('user/notifications', {
    title: 'الإشعارات',
    user: req.user,
    notifications,
  });
});

exports.getSuperAdminDashboard = catchAsync(async (req, res, next) => {
  const data = await viewService.getSuperAdminDashboardData();
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/super-dashboard', {
    title: 'لوحة الإحصائيات المتقدمة',
    user: req.user,
    currentPage: 'super-dashboard',
    stats: data.stats,
    recentApplications: data.recentApplications,
    totalRevenue: data.totalRevenue,
    totalUsers: data.totalUsers,
    monthlyRevenue: data.monthlyRevenue,
    pendingCount,
  });
});

exports.getAdminUsers = catchAsync(async (req, res, next) => {
  const data = await viewService.getAdminUsersData(req.query);
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/users', {
    title: 'إدارة المستخدمين',
    user: req.user,
    currentUser: req.user,
    currentPage: 'users',
    users: data.users,
    pagination: data.pagination,
    pendingCount,
  });
});

exports.getAdminNews = catchAsync(async (req, res, next) => {
  const data = await viewService.getAdminNewsData(req.query);
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/news', {
    title: 'إدارة الأخبار',
    user: req.user,
    currentPage: 'news',
    news: data.news,
    stats: data.stats,
    pagination: data.pagination,
    pendingCount,
  });
});

exports.getPricing = catchAsync(async (req, res, next) => {
  const data = await viewService.getPricingPageData();

  res.status(200).render('public/pricing', {
    title: 'الأسعار والرسوم',
    user: req.user || null,
    currentPage: 'pricing',
    prices: data.prices,
    pricesByType: data.pricesByType,
  });
});

exports.getLicenseReview = catchAsync(async (req, res, next) => {
  const result = await adminService.getLicenseReview(req.query);
  const stats = await adminService.getLicenseReviewStats();
  const pendingCount = await Application.count({
    where: { status: { [Op.in]: ['received', 'under_review'] } }
  });

  res.status(200).render('admin/license-review', {
    title: 'مراجعة التراخيص',
    user: req.user,
    currentPage: 'license-review',
    applications: result.applications,
    pagination: result.pagination,
    statistics: result.statistics,
    overviewStats: stats.overview,
    byType: stats.byType,
    query: req.query || {},
    pendingCount,
  });
});
