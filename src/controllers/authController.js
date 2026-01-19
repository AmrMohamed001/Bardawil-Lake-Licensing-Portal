const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');
const AppError = require('../utils/appError');

/**
 * Auth Controller - Based on SRS Section 3.1
 * Handles HTTP layer for authentication
 */

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.signup = catchAsync(async (req, res, next) => {
  const result = await authService.register(req.body);

  // Set access token cookie (15 minutes)
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Set refresh token cookie (7 days)
  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const result = await authService.login(
    req.body.nationalId,
    req.body.password
  );

  // Set access token cookie (15 minutes)
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Set refresh token cookie (7 days)
  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError(400, 'رمز التحديث مطلوب'));
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Set new cookies
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = catchAsync(async (req, res, next) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
  const result = await authService.logout(req.user.id, refreshToken);

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const result = await authService.forgotPassword(
    req.body.nationalId,
    req.body.phone
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
  const result = await authService.resetPassword(
    req.body.token,
    req.body.newPassword,
    req.body.confirmPassword
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Update password for logged-in user
// @route   PATCH /api/v1/auth/update-password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const result = await authService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword,
    confirmPassword
  );

  // Set new cookies
  res.cookie('accessToken', result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
