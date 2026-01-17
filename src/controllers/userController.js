const catchAsync = require('../utils/catchAsync');
const userService = require('../services/userService');

/**
 * User Controller - Handles user profile management
 * Based on SRS Section 3.3
 */

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await userService.getCurrentUser(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// @desc    Update current user profile
// @route   PATCH /api/v1/users/me
// @access  Private
exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// @desc    Get all users (admin)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query);

  res.status(200).json({
    status: 'success',
    results: result.users.length,
    pagination: result.pagination,
    data: { users: result.users },
  });
});

// @desc    Get user by ID (admin)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// @desc    Update user (admin)
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// @desc    Suspend user (admin)
// @route   PUT /api/v1/users/:id/suspend
// @access  Private/Admin
exports.suspendUser = catchAsync(async (req, res, next) => {
  const result = await userService.suspendUser(req.params.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Activate user (admin)
// @route   PUT /api/v1/users/:id/activate
// @access  Private/Admin
exports.activateUser = catchAsync(async (req, res, next) => {
  const result = await userService.activateUser(req.params.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Delete user (super_admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = catchAsync(async (req, res, next) => {
  const result = await userService.deleteUser(req.params.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Update profile picture
// @route   PUT /api/v1/users/me/picture
// @access  Private
exports.updateProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new (require('../utils/appError'))(400, 'يرجى رفع صورة'));
  }

  const result = await userService.updateProfilePicture(
    req.user.id,
    req.file.filename
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

// @desc    Delete profile picture
// @route   DELETE /api/v1/users/me/picture
// @access  Private
exports.deleteProfilePicture = catchAsync(async (req, res, next) => {
  const result = await userService.deleteProfilePicture(req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
