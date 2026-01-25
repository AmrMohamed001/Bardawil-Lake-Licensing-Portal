const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * User Model - Based on SRS Section 5.2.1
 * Supports citizens, admins, and super_admins
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nationalId: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
      validate: {
        len: [14, 14],
        isNumeric: true,
      },
      field: 'national_id',
    },
    firstNameAr: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name_ar',
    },
    lastNameAr: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name_ar',
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        is: /^(01|05)[0-9]{8,9}$/i, // Egyptian phone format
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('citizen', 'admin', 'super_admin'),
      defaultValue: 'citizen',
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('citizen', 'admin', 'super_admin', 'financial_officer'),
      defaultValue: 'citizen',
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended'),
      defaultValue: 'active',
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_login_attempts',
    },
    lockoutUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lockout_until',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login',
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token',
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires',
    },
    refreshTokens: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      field: 'refresh_tokens',
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_picture',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      // Hash password before creating user
      beforeCreate: async user => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(
            parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
          );
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      // Hash password before updating if changed
      beforeUpdate: async user => {
        if (user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(
            parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
          );
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
    },
  }
);

// Instance method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to check if account is locked
User.prototype.isLocked = function () {
  return this.lockoutUntil && this.lockoutUntil > new Date();
};

// Instance method to get full name in Arabic
User.prototype.getFullNameAr = function () {
  return `${this.firstNameAr} ${this.lastNameAr}`;
};

// Class method to find by national ID
User.findByNationalId = async function (nationalId) {
  return this.findOne({ where: { nationalId } });
};

module.exports = User;
