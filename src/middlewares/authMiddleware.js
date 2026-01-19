const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Auth Middleware - Protect routes and check permissions
 * Based on SRS Section 4.2
 */

/**
 * Generate new access token
 */
const generateAccessToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  });
};

/**
 * Generate new refresh token
 */
const generateRefreshToken = userId => {
  return jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Try to refresh access token using refresh token
 */
const tryRefreshToken = async (refreshToken, res) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return null;
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return null;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id);
    // const newRefreshToken = generateRefreshToken(user.id); // Disable rotation

    // Update refresh tokens in database
    // user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    // user.refreshTokens.push(newRefreshToken);
    // await user.save(); // No need to save if not rotating

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Protect route - Verify JWT token with auto-refresh
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from Authorization header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // If no access token, check for refresh token immediately
  if (!token && req.cookies.refreshToken) {
    const user = await tryRefreshToken(req.cookies.refreshToken, res);
    if (user) {
      req.user = user;
      return next();
    }
  }

  if (!token) {
    // Check if this is a browser request
    const isBrowserRequest = !req.originalUrl.startsWith('/api');
    if (isBrowserRequest) {
      return res.redirect('/login');
    }
    return next(new AppError(401, 'يجب تسجيل الدخول للوصول إلى هذا المحتوى'));
  }

  // 2) Verify token
  let decoded;
  let tokenExpired = false;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      tokenExpired = true;
    } else {
      return next(new AppError(401, 'رمز الوصول غير صالح'));
    }
  }

  // 3) If token expired, try to refresh using refresh token
  if (tokenExpired) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const user = await tryRefreshToken(refreshToken, res);

      if (user) {
        // Token refreshed successfully, continue with request
        req.user = user;
        return next();
      }
    }

    // Could not refresh, redirect to login for browser or return error for API
    const isBrowserRequest = !req.originalUrl.startsWith('/api');
    if (isBrowserRequest) {
      return res.redirect('/login');
    }
    return next(
      new AppError(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً')
    );
  }

  // 4) Check if user still exists
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new AppError(401, 'المستخدم غير موجود'));
  }

  // 5) Check if user is active
  if (user.status === 'suspended') {
    return next(
      new AppError(403, 'تم تعليق حسابك. يرجى التواصل مع الدعم الفني')
    );
  }

  // 6) Grant access
  req.user = user;
  next();
});

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'ليس لديك صلاحية للوصول إلى هذا المحتوى'));
    }
    next();
  };
};

/**
 * Check if user is admin
 */
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new AppError(403, 'هذا المحتوى متاح للمسؤولين فقط'));
  }
  next();
};

/**
 * Check if user is super admin
 */
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return next(new AppError(403, 'هذا المحتوى متاح للمسؤول الرئيسي فقط'));
  }
  next();
};

/**
 * Optional authentication - Attaches user if token exists (with auto-refresh)
 */
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (error) {
      // If token expired, try to refresh
      if (error.name === 'TokenExpiredError' && req.cookies.refreshToken) {
        const user = await tryRefreshToken(req.cookies.refreshToken, res);
        if (user) {
          req.user = user;
        }
      }
      // Otherwise continue without user
    }
  }

  next();
});
