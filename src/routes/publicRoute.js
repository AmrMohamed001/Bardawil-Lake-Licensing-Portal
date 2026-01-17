const express = require('express');
const router = express.Router();

const { News, LicensePrice } = require('../models');
const documentService = require('../services/documentService');
const catchAsync = require('../utils/catchAsync');

/**
 * Public Routes - No authentication required
 * Based on SRS Section 3.6
 */

// @route   GET /api/v1/public/news
// @desc    Get published news/announcements
// @access  Public
router.get(
  '/news',
  catchAsync(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;

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

    res.status(200).json({
      status: 'success',
      results: news.length,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
      data: { news },
    });
  })
);

// @route   GET /api/v1/public/news/:id
// @desc    Get single news article
// @access  Public
router.get(
  '/news/:id',
  catchAsync(async (req, res, next) => {
    const news = await News.findOne({
      where: { id: req.params.id, isPublished: true },
    });

    if (!news) {
      return next(new (require('../utils/appError'))(404, 'الخبر غير موجود'));
    }

    res.status(200).json({
      status: 'success',
      data: { news },
    });
  })
);

// @route   GET /api/v1/public/prices
// @desc    Get current license prices
// @access  Public
router.get(
  '/prices',
  catchAsync(async (req, res) => {
    const prices = await LicensePrice.findAll({
      where: { isActive: true },
      attributes: ['licenseType', 'category', 'price', 'isRenewalPrice'],
      order: [
        ['licenseType', 'ASC'],
        ['category', 'ASC'],
      ],
    });

    res.status(200).json({
      status: 'success',
      data: { prices },
    });
  })
);

// @route   GET /api/v1/public/required-documents/:applicationType
// @desc    Get required documents for application type
// @access  Public
router.get(
  '/required-documents/:applicationType',
  catchAsync(async (req, res, next) => {
    const { applicationType } = req.params;
    const { isRenewal } = req.query;

    const validTypes = ['fisherman', 'boat', 'vehicle', 'individual_float'];
    if (!validTypes.includes(applicationType)) {
      return next(
        new (require('../utils/appError'))(400, 'نوع الطلب غير صالح')
      );
    }

    const documents = documentService.getRequiredDocuments(
      applicationType,
      isRenewal === 'true'
    );

    res.status(200).json({
      status: 'success',
      data: { documents },
    });
  })
);

// @route   GET /api/v1/public/info
// @desc    Get portal information
// @access  Public
router.get('/info', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
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
            'صياد',
            'صياد تحت السن',
            'مندوب',
            'تاجر',
            'عامل تاجر',
            'شيال',
          ],
        },
        { id: 'boat', nameAr: 'ترخيص مركب', categories: ['مركب'] },
        { id: 'vehicle', nameAr: 'ترخيص سيارة', categories: ['سيارة'] },
        {
          id: 'individual_float',
          nameAr: 'عائمة أفراد',
          categories: ['عائمة أفراد'],
        },
      ],
    },
  });
});

module.exports = router;
