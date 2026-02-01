const { News, User } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const cache = require('./cacheService');

/**
 * Get all news (admin)
 */
exports.getAllNews = async (query) => {
    const { page = 1, limit = 10, search, category, published } = query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
        where[Op.or] = [
            { titleAr: { [Op.iLike]: `%${search}%` } },
            { contentAr: { [Op.iLike]: `%${search}%` } },
        ];
    }

    if (category) {
        where.category = category;
    }

    if (published !== undefined) {
        where.isPublished = published === 'true';
    }

    const { count, rows: news } = await News.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'firstNameAr', 'lastNameAr'],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset,
    });

    return {
        news,
        pagination: {
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit),
            limit: parseInt(limit),
        },
    };
};

/**
 * Get news by ID
 */
exports.getNewsById = async (id) => {
    const news = await News.findByPk(id, {
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'firstNameAr', 'lastNameAr'],
            },
        ],
    });

    if (!news) {
        throw new AppError(404, 'الخبر غير موجود');
    }

    return news;
};

/**
 * Create news
 */
exports.createNews = async (data, userId, fileFilename) => {
    const { titleAr, titleEn, contentAr, contentEn, category, isPinned, imagePath } = data;

    // Priority: uploaded file > form imagePath > null
    let finalImagePath = null;
    if (fileFilename) {
        finalImagePath = `/uploads/news/${fileFilename}`;
    } else if (imagePath) {
        finalImagePath = imagePath;
    }

    const news = await News.create({
        titleAr,
        titleEn,
        contentAr,
        contentEn,
        category: category || 'news',
        isPinned: isPinned || false,
        createdBy: userId,
        imagePath: finalImagePath,
    });

    // Invalidate news cache
    cache.invalidateNews();

    return news;
};

/**
 * Update news
 */
exports.updateNews = async (id, data, fileFilename) => {
    const news = await News.findByPk(id);

    if (!news) {
        throw new AppError(404, 'الخبر غير موجود');
    }

    const { titleAr, titleEn, contentAr, contentEn, category, isPinned, imagePath } = data;

    // Priority: uploaded file > form imagePath > existing value
    let finalImagePath = news.imagePath;
    if (fileFilename) {
        finalImagePath = `/uploads/news/${fileFilename}`;
    } else if (imagePath) {
        finalImagePath = imagePath;
    }

    await news.update({
        titleAr: titleAr || news.titleAr,
        titleEn: titleEn !== undefined ? titleEn : news.titleEn,
        contentAr: contentAr || news.contentAr,
        contentEn: contentEn !== undefined ? contentEn : news.contentEn,
        category: category || news.category,
        isPinned: isPinned !== undefined ? isPinned : news.isPinned,
        imagePath: finalImagePath,
    });

    // Invalidate news cache
    cache.invalidateNews();

    return news;
};

/**
 * Delete news
 */
exports.deleteNews = async (id) => {
    const news = await News.findByPk(id);

    if (!news) {
        throw new AppError(404, 'الخبر غير موجود');
    }

    await news.destroy();

    // Invalidate news cache
    cache.invalidateNews();
};

/**
 * Toggle publish status
 */
exports.togglePublish = async (id) => {
    const news = await News.findByPk(id);

    if (!news) {
        throw new AppError(404, 'الخبر غير موجود');
    }

    const isPublished = !news.isPublished;
    await news.update({
        isPublished,
        publishedAt: isPublished ? new Date() : null,
    });

    // Invalidate news cache (publish state affects public listings)
    cache.invalidateNews();

    return { news, isPublished };
};

/**
 * Get news statistics
 */
exports.getNewsStats = async () => {
    const [total, published, drafts, byCategory] = await Promise.all([
        News.count(),
        News.count({ where: { isPublished: true } }),
        News.count({ where: { isPublished: false } }),
        News.findAll({
            attributes: ['category', [require('sequelize').fn('COUNT', '*'), 'count']],
            group: ['category'],
            raw: true,
        }),
    ]);

    return {
        total,
        published,
        drafts,
        byCategory,
    };
};
