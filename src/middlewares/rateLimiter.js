const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    status: 'error',
    message:
      'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    status: 'error',
    message: 'Too many password reset attempts, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    status: 'error',
    message:
      'Too many verification email requests, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
