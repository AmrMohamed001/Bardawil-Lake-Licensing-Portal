const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * Public Routes - No authentication required
 * Based on SRS Section 3.6
 */

// @route   GET /api/v1/public/news
router.get('/news', publicController.getNews);

// @route   GET /api/v1/public/news/:id
router.get('/news/:id', publicController.getNewsById);

// @route   GET /api/v1/public/prices
router.get('/prices', publicController.getPrices);

// @route   GET /api/v1/public/required-documents/:serviceCategory
router.get('/required-documents/:serviceCategory', publicController.getRequiredDocuments);

// @route   GET /api/v1/public/info
router.get('/info', publicController.getPortalInfo);

// @route   GET /api/v1/public/statuses
router.get('/statuses', publicController.getStatuses);

module.exports = router;
