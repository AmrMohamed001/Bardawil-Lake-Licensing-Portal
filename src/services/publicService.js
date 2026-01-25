const { Op } = require('sequelize');
const { News, LicensePrice, ApplicationStatus, ServiceRequiredDocument } = require('../models');
const AppError = require('../utils/appError');

/**
 * Public Service - Business logic for public endpoints
 * No authentication required
 */

/**
 * Get published news articles with pagination
 */
exports.getPublishedNews = async ({ page = 1, limit = 10, category }) => {
    const where = { isPublished: true };
    if (category) {
        where.category = category;
    }

    const offset = (page - 1) * limit;

    const { count, rows: news } = await News.findAndCountAll({
        where,
        order: [
            ['isPinned', 'DESC'],
            ['publishedAt', 'DESC'],
        ],
        limit: parseInt(limit),
        offset,
        attributes: { exclude: ['createdBy'] },
    });

    return {
        news,
        pagination: {
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit),
        },
    };
};

/**
 * Get single news article by ID
 */
exports.getNewsById = async (id) => {
    const news = await News.findOne({
        where: { id, isPublished: true },
    });

    if (!news) {
        throw new AppError(404, 'الخبر غير موجود');
    }

    return news;
};

/**
 * Get active license prices with calculated values for all durations
 */
exports.getActivePrices = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch all active base price records
    const basePrices = await LicensePrice.findAll({
        where: {
            isActive: true,
            effectiveFrom: {
                [Op.lte]: today,
            },
            [Op.or]: [
                { effectiveUntil: null },
                {
                    effectiveUntil: {
                        [Op.gte]: today,
                    },
                },
            ],
        },
        order: [
            ['licenseType', 'ASC'],
            ['category', 'ASC'],
        ],
    });

    // Calculate prices for all valid durations
    const pricesWithCalculations = basePrices.map((priceRecord) => {
        const baseDuration = priceRecord.baseDuration;
        const basePrice = parseFloat(priceRecord.price);
        const category = priceRecord.category;

        // Determine valid durations based on base duration
        let validDurations = [];
        if (baseDuration === '1_month') {
            validDurations = ['1_month', '3_months', '6_months', 'season'];
        } else if (baseDuration === '3_months') {
            validDurations = ['3_months', '6_months', 'season'];
        } else if (baseDuration === 'season') {
            validDurations = ['season'];
        }

        // Calculate price for each valid duration
        const calculatedPrices = {};
        validDurations.forEach((duration) => {
            calculatedPrices[duration] = LicensePrice.calculatePriceForDuration(
                basePrice,
                baseDuration,
                duration
            );
        });

        return {
            licenseType: priceRecord.licenseType,
            category: category,
            baseDuration: baseDuration,
            basePrice: basePrice,
            isRenewalPrice: priceRecord.isRenewalPrice,
            prices: calculatedPrices,
            boatType: priceRecord.boatType,
        };
    });

    return pricesWithCalculations;
};

/**
 * Get required documents for a service category
 */
exports.getRequiredDocuments = async (serviceCategory) => {
    const documents = await ServiceRequiredDocument.findAll({
        where: {
            serviceCategory: decodeURIComponent(serviceCategory),
            isActive: true,
        },
        order: [['displayOrder', 'ASC']],
        attributes: [
            'id',
            'documentCode',
            'documentNameAr',
            'documentNameEn',
            'inputType',
            'validationRules',
            'isRequired',
            'helpText',
            'displayOrder',
        ],
    });

    return documents;
};

/**
 * Get portal information
 */
exports.getPortalInfo = () => {
    return {
        portal: {
            nameAr: 'بوابة تراخيص بحيرة البردويل',
            nameEn: 'Bardawil Lake Licensing Portal',
            description: 'النظام الرقمي لإصدار وتجديد تراخيص الصيد والمراكب',
            version: '1.0.0',
            contact: {
                phone: '+20 1234567890',
                email: 'info@bardawil-lake.gov.eg',
                address: 'شمال سيناء، مصر',
            },
            workingHours: {
                days: 'الأحد - الخميس',
                hours: '8:00 ص - 4:00 م',
            },
        },
        licenseTypes: [
            {
                id: 'fisherman',
                nameAr: 'ترخيص صياد',
                categories: [
                    'صياد مؤمن عليه',
                    'صياد غير مؤمن عليه',
                    'صياد تحت السن',
                    'مندوب',
                    'تاجر',
                    'عامل تاجر',
                    'شيال',
                ],
            },
            { id: 'boat', nameAr: 'ترخيص مركب', categories: ['مركب'] },
            { id: 'vehicle', nameAr: 'ترخيص سيارة', categories: ['مركبة', 'تروسيكل'] },
        ],
    };
};

/**
 * Get application statuses
 */
exports.getApplicationStatuses = async (category) => {
    let statuses;
    if (category) {
        statuses = await ApplicationStatus.getByCategory(category);
    } else {
        statuses = await ApplicationStatus.getAllActive();
    }
    return statuses;
};
