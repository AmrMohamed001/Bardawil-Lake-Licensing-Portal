/**
 * Custom Error Class for operational errors
 */
class AppError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // For validation errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
