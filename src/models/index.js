/**
 * Models Index - Sets up all model associations
 */
const User = require('./userModel');
const Application = require('./applicationModel');
const Document = require('./documentModel');
const Notification = require('./notificationModel');
const LicensePrice = require('./licensePriceModel');
const ApplicationStatusHistory = require('./applicationStatusHistoryModel');
const ApplicationStatus = require('./applicationStatusModel');
const News = require('./newsModel');
const AuditLog = require('./auditLogModel');
const ServiceRequiredDocument = require('./serviceRequiredDocumentModel');

// ==========================================
// Model Associations
// ==========================================

// User has many Applications
User.hasMany(Application, {
  foreignKey: 'userId',
  as: 'applications',
});
Application.belongsTo(User, {
  foreignKey: 'userId',
  as: 'applicant',
});

// User (admin) reviews Applications
Application.belongsTo(User, {
  foreignKey: 'reviewedBy',
  as: 'reviewer',
});

// User (admin/financial) verifies payment
Application.belongsTo(User, {
  foreignKey: 'paymentVerifiedBy',
  as: 'paymentVerifier',
});

// User currently reviewing (lock holder)
Application.belongsTo(User, {
  foreignKey: 'activeReviewerId',
  as: 'activeReviewer',
});

// Application belongs to ApplicationStatus (lookup table)
Application.belongsTo(ApplicationStatus, {
  foreignKey: 'statusId',
  as: 'statusInfo',
});
ApplicationStatus.hasMany(Application, {
  foreignKey: 'statusId',
  as: 'applications',
});

// Application has many Documents
Application.hasMany(Document, {
  foreignKey: 'applicationId',
  as: 'documents',
  onDelete: 'CASCADE',
});
Document.belongsTo(Application, {
  foreignKey: 'applicationId',
  as: 'application',
});

// User has many Notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Notification can reference Application (optional)
Notification.belongsTo(Application, {
  foreignKey: 'applicationId',
  as: 'application',
});
Application.hasMany(Notification, {
  foreignKey: 'applicationId',
  as: 'notifications',
});

// Application has many StatusHistory entries
Application.hasMany(ApplicationStatusHistory, {
  foreignKey: 'applicationId',
  as: 'statusHistory',
  onDelete: 'CASCADE',
});
ApplicationStatusHistory.belongsTo(Application, {
  foreignKey: 'applicationId',
  as: 'application',
});

// User (admin) changes status
ApplicationStatusHistory.belongsTo(User, {
  foreignKey: 'changedBy',
  as: 'changedByUser',
});

// LicensePrice created by User (admin)
LicensePrice.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});
User.hasMany(LicensePrice, {
  foreignKey: 'createdBy',
  as: 'createdPrices',
});

// News created by User (admin)
News.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'author',
});
User.hasMany(News, {
  foreignKey: 'createdBy',
  as: 'newsArticles',
});

// AuditLog belongs to User
AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
});

module.exports = {
  User,
  Application,
  Document,
  Notification,
  LicensePrice,
  ApplicationStatusHistory,
  ApplicationStatus,
  News,
  AuditLog,
  ServiceRequiredDocument,
};
