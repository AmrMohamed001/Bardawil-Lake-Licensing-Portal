const { User } = require('../models');
const AppError = require('../utils/appError');

/**
 * User Service - Handles user profile management
 * Based on SRS Section 3.3
 */

/**
 * Get user by ID
 * @param {string} userId - User ID
 */
exports.getUserById = async userId => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: [
        'passwordHash',
        'refreshTokens',
        'passwordResetToken',
        'passwordResetExpires',
      ],
    },
  });

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  return user;
};

/**
 * Get current user profile
 * @param {string} userId - User ID
 */
exports.getCurrentUser = async userId => {
  return this.getUserById(userId);
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Update data
 */
exports.updateProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Fields that can be updated by user
  const allowedFields = ['firstNameAr', 'lastNameAr', 'phone'];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  // Return user without sensitive fields
  const {
    passwordHash,
    refreshTokens,
    passwordResetToken,
    passwordResetExpires,
    ...safeUser
  } = user.toJSON();

  return safeUser;
};

/**
 * Get all users (admin)
 * @param {Object} query - Query parameters
 */
exports.getAllUsers = async (query = {}) => {
  const { role, status, page = 1, limit = 20, search } = query;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { nationalId: { [Op.like]: `%${search}%` } },
      { firstNameAr: { [Op.like]: `%${search}%` } },
      { lastNameAr: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: {
      exclude: [
        'passwordHash',
        'refreshTokens',
        'passwordResetToken',
        'passwordResetExpires',
      ],
    },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return {
    users,
    pagination: {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    },
  };
};

/**
 * Update user by admin
 * @param {string} userId - User ID
 * @param {Object} updateData - Update data
 */
exports.updateUser = async (userId, updateData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Admin can update these fields
  const allowedFields = [
    'firstNameAr',
    'lastNameAr',
    'phone',
    'role',
    'status',
  ];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  const { passwordHash, refreshTokens, ...safeUser } = user.toJSON();
  return safeUser;
};

/**
 * Suspend user (admin)
 * @param {string} userId - User ID
 */
exports.suspendUser = async userId => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  if (user.role === 'super_admin') {
    throw new AppError(403, 'لا يمكن تعليق حساب المسؤول الرئيسي');
  }

  user.status = 'suspended';
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  return { message: 'تم تعليق الحساب بنجاح' };
};

/**
 * Activate user (admin)
 * @param {string} userId - User ID
 */
exports.activateUser = async userId => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  user.status = 'active';
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  await user.save();

  return { message: 'تم تفعيل الحساب بنجاح' };
};

/**
 * Delete user (super_admin only)
 * @param {string} userId - User ID
 */
exports.deleteUser = async userId => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  if (user.role === 'super_admin') {
    throw new AppError(403, 'لا يمكن حذف حساب المسؤول الرئيسي');
  }

  await user.destroy();

  return { message: 'تم حذف الحساب بنجاح' };
};

/**
 * Update profile picture
 * @param {string} userId - User ID
 * @param {string} picturePath - Path to uploaded picture
 */
exports.updateProfilePicture = async (userId, picturePath) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Delete old profile picture if exists
  if (user.profilePicture) {
    const fs = require('fs').promises;
    const path = require('path');
    try {
      const uploadPath = process.env.UPLOAD_PATH || './src/public/uploads';
      // Check if it's a full path (legacy) or filename
      const fullPath =
        user.profilePicture.includes('/') || user.profilePicture.includes('\\')
          ? user.profilePicture
          : path.join(uploadPath, user.profilePicture);

      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting old profile picture:', error.message);
    }
  }

  user.profilePicture = picturePath;
  await user.save();

  return {
    message: 'تم تحديث صورة الملف الشخصي بنجاح',
    profilePicture: user.profilePicture,
  };
};

/**
 * Delete profile picture
 * @param {string} userId - User ID
 */
exports.deleteProfilePicture = async userId => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  if (!user.profilePicture) {
    throw new AppError(400, 'لا توجد صورة شخصية لحذفها');
  }

  // Delete file
  const fs = require('fs').promises;
  const path = require('path');
  try {
    const uploadPath = process.env.UPLOAD_PATH || './src/public/uploads';
    const fullPath =
      user.profilePicture.includes('/') || user.profilePicture.includes('\\')
        ? user.profilePicture
        : path.join(uploadPath, user.profilePicture);

    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting profile picture:', error.message);
  }

  user.profilePicture = null;
  await user.save();

  return { message: 'تم حذف صورة الملف الشخصي بنجاح' };
};
