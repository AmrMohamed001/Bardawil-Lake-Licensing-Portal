const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const newsService = require('../services/newsService');

/**
 * News Controller - Admin CRUD operations for news
 */

// @desc    Get all news for admin (with pagination)
// @route   GET /api/v1/admin/news
// @access  Admin/Super Admin
exports.getAllNews = catchAsync(async (req, res, next) => {
    const result = await newsService.getAllNews(req.query);

    res.status(200).json({
        status: 'success',
        results: result.news.length,
        pagination: result.pagination,
        data: { news: result.news },
    });
});

// @desc    Get single news by ID
// @route   GET /api/v1/admin/news/:id
// @access  Admin/Super Admin
exports.getNewsById = catchAsync(async (req, res, next) => {
    const news = await newsService.getNewsById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { news },
    });
});

// @desc    Create new news
// @route   POST /api/v1/admin/news
// @access  Admin/Super Admin
exports.createNews = catchAsync(async (req, res, next) => {
    const { titleAr, contentAr } = req.body;

    if (!titleAr || !contentAr) {
        return next(new AppError(400, 'العنوان والمحتوى بالعربية مطلوبان'));
    }

    const news = await newsService.createNews(
        req.body,
        req.user.id,
        req.file?.filename
    );

    res.status(201).json({
        status: 'success',
        message: 'تم إنشاء الخبر بنجاح',
        data: { news },
    });
});

// @desc    Update news
// @route   PUT /api/v1/admin/news/:id
// @access  Admin/Super Admin
exports.updateNews = catchAsync(async (req, res, next) => {
    const news = await newsService.updateNews(
        req.params.id,
        req.body,
        req.file?.filename
    );

    res.status(200).json({
        status: 'success',
        message: 'تم تحديث الخبر بنجاح',
        data: { news },
    });
});

// @desc    Delete news
// @route   DELETE /api/v1/admin/news/:id
// @access  Admin/Super Admin
exports.deleteNews = catchAsync(async (req, res, next) => {
    await newsService.deleteNews(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'تم حذف الخبر بنجاح',
    });
});

// @desc    Publish/Unpublish news
// @route   PATCH /api/v1/admin/news/:id/publish
// @access  Admin/Super Admin
exports.togglePublish = catchAsync(async (req, res, next) => {
    const result = await newsService.togglePublish(req.params.id);

    res.status(200).json({
        status: 'success',
        message: result.isPublished ? 'تم نشر الخبر بنجاح' : 'تم إلغاء نشر الخبر',
        data: { news: result.news },
    });
});

// @desc    Get news statistics
// @route   GET /api/v1/admin/news/stats
// @access  Admin/Super Admin
exports.getNewsStats = catchAsync(async (req, res, next) => {
    const stats = await newsService.getNewsStats();

    res.status(200).json({
        status: 'success',
        data: stats,
    });
});
