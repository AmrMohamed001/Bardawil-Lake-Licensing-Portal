const {
    Application,
    User,
    Document,
    ApplicationStatusHistory,
    News,
    Notification,
    LicensePrice,
} = require('../models');
const { Op, fn, col } = require('sequelize');
const adminService = require('./adminService');
const AppError = require('../utils/appError');

/**
 * Get News Page Data
 */
exports.getNewsData = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;
    const category = query.category || '';
    const sort = query.sort || 'latest';

    const where = { isPublished: true };
    if (category) {
        where.category = category;
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'popular') {
        order = [['isPinned', 'DESC'], ['createdAt', 'DESC']];
    } else if (sort === 'oldest') {
        order = [['createdAt', 'ASC']];
    }

    const { count, rows: news } = await News.findAndCountAll({
        where,
        order,
        limit,
        offset,
    });

    const popularNews = await News.findAll({
        where: { isPublished: true },
        order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
        limit: 5,
    });

    return {
        news,
        popularNews,
        pagination: {
            total: count,
            page,
            pages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get News Detail Data
 */
exports.getNewsDetailData = async (id) => {
    const article = await News.findOne({
        where: {
            id,
            isPublished: true,
        },
    });

    if (!article) {
        throw new AppError('لم يتم العثور على الخبر', 404);
    }

    await article.increment('viewCount');

    const relatedNews = await News.findAll({
        where: { isPublished: true },
        order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
        limit: 5,
    });

    return { article, relatedNews };
};

/**
 * Get User Dashboard Data
 */
exports.getUserDashboardData = async (userId, query) => {
    const page = parseInt(query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [
        { count, rows: applications },
        total,
        pending,
        approved,
        completed
    ] = await Promise.all([
        Application.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        }),
        Application.count({ where: { userId } }),
        Application.count({
            where: { userId, status: { [Op.in]: ['received', 'under_review'] } },
        }),
        Application.count({
            where: {
                userId,
                // Include completed since they also went through approval
                status: { [Op.in]: ['approved_payment_pending', 'approved_payment_required', 'payment_verified', 'ready', 'completed'] }
            },
        }),
        Application.count({
            where: { userId, status: 'completed' },
        }),
    ]);

    const stats = {
        total,
        pending,
        approved,
        completed,
    };

    return {
        applications,
        stats,
        pagination: {
            total: count,
            page,
            pages: Math.ceil(count / limit),
            limit,
        },
    };
};

/**
 * Get New License Page Data
 */
exports.getNewLicenseData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const prices = await LicensePrice.findAll({
        where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: today },
            [Op.or]: [
                { effectiveUntil: null },
                { effectiveUntil: { [Op.gte]: today } },
            ],
        },
        order: [['licenseType', 'ASC'], ['category', 'ASC'], ['duration', 'ASC']],
    });

    const pricesJson = prices.length > 0
        ? JSON.stringify(prices.map(p => ({
            licenseType: p.licenseType,
            category: p.category,
            duration: p.duration,
            boatType: p.boatType,
            price: parseFloat(p.price),
            isRenewalPrice: p.isRenewalPrice,
        })))
        : '[]';

    return { pricesJson };
};

/**
 * Get Admin Dashboard Data
 */
exports.getAdminDashboardData = async () => {
    const stats = await adminService.getDashboardStats();
    const result = await adminService.getAllApplications({ limit: 5 });

    return {
        stats,
        recentApplications: result.applications,
        pendingCount: stats.overview.new + stats.overview.underReview,
    };
};

/**
 * Get Super Admin Dashboard Data
 */
exports.getSuperAdminDashboardData = async () => {
    const stats = await adminService.getDashboardStats();
    const result = await adminService.getAllApplications({ limit: 10 });

    const totalRevenueResult = await Application.findOne({
        where: { status: { [Op.in]: ['payment_verified', 'ready', 'completed'] } },
        attributes: [[fn('SUM', col('payment_amount')), 'total']],
        raw: true,
    });
    const totalRevenue = parseFloat(totalRevenueResult?.total) || 0;

    const totalUsers = await User.count();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenueRaw = await Application.findAll({
        where: {
            status: { [Op.in]: ['payment_verified', 'ready', 'completed'] },
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

    const monthlyRevenue = monthlyRevenueRaw.map(item => ({
        month: new Date(item.month).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' }),
        amount: parseFloat(item.amount) || 0,
    }));

    return {
        stats,
        recentApplications: result.applications,
        totalRevenue,
        totalUsers,
        monthlyRevenue,
    };
};

/**
 * Get Admin Users Data
 */
exports.getAdminUsersData = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: ['id', 'firstNameAr', 'lastNameAr', 'nationalId', 'phone', 'role', 'status', 'createdAt'],
    });

    return {
        users,
        pagination: {
            total: count,
            page,
            pages: Math.ceil(count / limit),
            limit,
        },
    };
};

/**
 * Get Admin News Data
 */
exports.getAdminNewsData = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: news } = await News.findAndCountAll({
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'firstNameAr', 'lastNameAr'],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    const [total, published, drafts] = await Promise.all([
        News.count(),
        News.count({ where: { isPublished: true } }),
        News.count({ where: { isPublished: false } }),
    ]);

    return {
        news,
        stats: { total, published, drafts },
        pagination: {
            total: count,
            page,
            pages: Math.ceil(count / limit),
            limit,
        },
    };
};

/**
 * Get Admin Pricing Data
 */
exports.getAdminPricingData = async () => {
    const pricingService = require('./pricingService');
    return await pricingService.getAllPrices({});
};

/**
 * Get Pricing Page Data
 */
exports.getPricingPageData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const prices = await LicensePrice.findAll({
        where: {
            isActive: true,
            effectiveFrom: { [Op.lte]: today },
            [Op.or]: [
                { effectiveUntil: null },
                { effectiveUntil: { [Op.gte]: today } },
            ],
        },
        order: [['licenseType', 'ASC'], ['category', 'ASC'], ['duration', 'ASC']],
    });

    const pricesByType = {};
    prices.forEach(price => {
        if (!pricesByType[price.licenseType]) {
            pricesByType[price.licenseType] = [];
        }
        pricesByType[price.licenseType].push(price);
    });

    return { prices, pricesByType };
};

/**
 * Get Application Details for View
 */
exports.getApplicationDetails = async (id, userId) => {
    const application = await Application.findOne({
        where: {
            id,
            userId,
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
        throw new AppError('لم يتم العثور على الطلب', 404);
    }

    return application;
};

/**
 * Get Payment Page Data
 */
exports.getPaymentPageData = async (id, userId) => {
    const application = await Application.findOne({
        where: {
            id,
            userId,
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
        throw new AppError('لم يتم العثور على الطلب', 404);
    }

    return application;
};

/**
 * Get Notifications Data
 */
exports.getNotificationsData = async (userId) => {
    return await Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 50,
    });
};
