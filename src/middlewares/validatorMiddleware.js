const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Validation middleware - Handles express-validator errors
 * Returns Arabic error messages
 */
const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new AppError(400, 'بيانات غير صالحة', errorMessages));
  }

  next();
};

module.exports = validatorMiddleware;
