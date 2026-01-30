const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const AppError = require('../utils/appError');

/**
 * Auth Service - Handles authentication logic
 * Based on SRS Section 3.1
 */

// Generate access token (2 hours)
const generateAccessToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  });
};

// Generate refresh token (7 days)
const generateRefreshToken = userId => {
  return jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new user (FR-AUTH-001)
 * @param {Object} userData - User registration data
 */
exports.register = async userData => {
  const {
    nationalId,
    firstNameAr,
    lastNameAr,
    phone,
    password,
    passwordConfirm,
  } = userData;

  // Check if passwords match
  if (password !== passwordConfirm) {
    throw new AppError(400, 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
  }

  // Check for existing user with same national ID
  const existingByNationalId = await User.findByNationalId(nationalId);
  if (existingByNationalId) {
    throw new AppError(400, 'الرقم القومي مسجل بالفعل');
  }

  // Check for existing user with same phone
  const existingByPhone = await User.findOne({ where: { phone } });
  if (existingByPhone) {
    throw new AppError(400, 'رقم الهاتف مسجل بالفعل');
  }

  // Create user
  const user = await User.create({
    nationalId,
    firstNameAr,
    lastNameAr,
    phone,
    passwordHash: password, // Will be hashed by model hook
    role: 'citizen',
    status: 'active',
  });

  // Generate tokens so user is logged in after signup (same as login)
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  user.refreshTokens = [refreshToken];
  await user.save();

  return {
    message: 'تم التسجيل بنجاح',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nationalId: user.nationalId,
      fullName: user.getFullNameAr(),
      phone: user.phone,
      role: user.role,
    },
  };
};

/**
 * Login user (FR-AUTH-002)
 * @param {string} nationalId - User's national ID
 * @param {string} password - User's password
 */
exports.login = async (nationalId, password) => {
  // Find user by national ID
  const user = await User.findByNationalId(nationalId);
  if (!user) {
    throw new AppError(401, 'الرقم القومي أو كلمة المرور غير صحيحة');
  }

  // Check if account is suspended
  if (user.status === 'suspended') {
    throw new AppError(403, 'تم تعليق حسابك. يرجى التواصل مع الدعم الفني');
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new AppError(423, 'تم قفل الحساب مؤقتاً. يرجى المحاولة لاحقاً');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment failed login attempts
    user.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts (BR-046)
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await user.save();
    throw new AppError(401, 'الرقم القومي أو كلمة المرور غير صحيحة');
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.lastLogin = new Date();

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  user.refreshTokens = [...(user.refreshTokens || []), refreshToken];
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nationalId: user.nationalId,
      fullName: user.getFullNameAr(),
      phone: user.phone,
      role: user.role,
    },
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 */
exports.refreshAccessToken = async refreshToken => {
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError(401, 'رمز التحديث غير صالح أو منتهي الصلاحية');
  }

  if (decoded.type !== 'refresh') {
    throw new AppError(401, 'رمز غير صالح');
  }

  // Find user and check if refresh token is valid
  const user = await User.findByPk(decoded.id);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError(401, 'رمز التحديث غير صالح');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  // Replace old refresh token with new one
  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout user
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 */
exports.logout = async (userId, refreshToken) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Remove refresh token
  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    await user.save();
  }

  return { message: 'تم تسجيل الخروج بنجاح' };
};

/**
 * Forgot password - Generate reset token (FR-AUTH-003)
 * @param {string} nationalId - User's national ID
 * @param {string} phone - User's phone number for verification
 */
exports.forgotPassword = async (nationalId, phone) => {
  const user = await User.findOne({ where: { nationalId, phone } });
  if (!user) {
    throw new AppError(404, 'لم يتم العثور على حساب بهذه البيانات');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // TODO: Send SMS with reset code (for now, return token for testing)
  return {
    message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى رقم الهاتف المسجل',
    resetToken, // Remove in production - only for testing
  };
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirm new password
 */
exports.resetPassword = async (token, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    throw new AppError(400, 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError(400, 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية');
  }

  // Update password
  user.passwordHash = newPassword; // Will be hashed by model hook
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  return { message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول' };
};

/**
 * Update password for logged-in user
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirm new password
 */
exports.updatePassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword
) => {
  if (newPassword !== confirmPassword) {
    throw new AppError(400, 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError(401, 'كلمة المرور الحالية غير صحيحة');
  }

  // Update password
  user.passwordHash = newPassword; // Will be hashed by model hook
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  // Generate new tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  user.refreshTokens = [refreshToken];
  await user.save();

  return {
    message: 'تم تغيير كلمة المرور بنجاح',
    accessToken,
    refreshToken,
  };
};
