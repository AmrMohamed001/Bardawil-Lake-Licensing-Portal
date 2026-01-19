const catchAsync = require('../utils/catchAsync');
const auditLogService = require('../services/auditLogService');

/**
 * Audit Log Controller
 * Handles HTTP layer for audit log endpoints (super_admin only)
 */

// @desc    Get all audit logs with filtering
// @route   GET /api/v1/admin/audit-logs
// @access  Private/SuperAdmin
exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const result = await auditLogService.getAuditLogs(req.query);

  res.status(200).json({
    status: 'success',
    results: result.logs.length,
    pagination: result.pagination,
    data: {
      logs: result.logs,
      actionTypes: auditLogService.getActionTypes(),
      entityTypes: auditLogService.getEntityTypes(),
    },
  });
});
