const catchAsync = require('../utils/catchAsync');
const publicService = require('../services/publicService');

// @desc    Get published news/announcements
// @route   GET /api/v1/public/news
// @access  Public
exports.getNews = catchAsync(async (req, res, next) => {
    const { page, limit, category } = req.query;
    const result = await publicService.getPublishedNews({ page, limit, category });

    res.status(200).json({
        status: 'success',
        results: result.news.length,
        pagination: result.pagination,
        data: { news: result.news },
    });
});

// @desc    Get single news article
// @route   GET /api/v1/public/news/:id
// @access  Public
exports.getNewsById = catchAsync(async (req, res, next) => {
    const news = await publicService.getNewsById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { news },
    });
});

// @desc    Get current license prices
// @route   GET /api/v1/public/prices
// @access  Public
exports.getPrices = catchAsync(async (req, res, next) => {
    const prices = await publicService.getActivePrices();

    res.status(200).json({
        status: 'success',
        data: { prices },
    });
});

// @desc    Get required documents for service category
// @route   GET /api/v1/public/required-documents/:serviceCategory
// @access  Public
exports.getRequiredDocuments = catchAsync(async (req, res, next) => {
    const documents = await publicService.getRequiredDocuments(req.params.serviceCategory);

    res.status(200).json({
        status: 'success',
        count: documents.length,
        data: { documents },
    });
});

// @desc    Get portal information
// @route   GET /api/v1/public/info
// @access  Public
exports.getPortalInfo = (req, res) => {
    const info = publicService.getPortalInfo();

    res.status(200).json({
        status: 'success',
        data: info,
    });
};

// @desc    Get all application statuses
// @route   GET /api/v1/public/statuses
// @access  Public
exports.getStatuses = catchAsync(async (req, res, next) => {
    const { category } = req.query;
    const statuses = await publicService.getApplicationStatuses(category);

    res.status(200).json({
        status: 'success',
        count: statuses.length,
        data: { statuses },
    });
});
