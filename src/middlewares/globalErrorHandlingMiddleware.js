const AppError = require('../utils/appError');
//////////////////////////////////////////////////////

const handleCastErrorDB = err => {
  const message = `قيمة غير صالحة: ${err.value}`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg?.match(/["']([^"']*)["']/)?.[1];
  const message = `القيمة "${value}" موجودة بالفعل. يرجى استخدام قيمة أخرى`;
  return new AppError(400, message);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors || {}).map(el => el.message);
  const message = `بيانات غير صالحة: ${errors.join('. ')}`;
  return new AppError(400, message);
};

const handleSequelizeValidationError = err => {
  const errors = err.errors?.map(e => e.message) || [];
  const message = `بيانات غير صالحة: ${errors.join('. ')}`;
  return new AppError(400, message);
};

const handleSequelizeUniqueConstraint = err => {
  const fields = err.fields ? Object.keys(err.fields).join(', ') : '';
  const message = `القيمة موجودة بالفعل${fields ? ` في الحقل: ${fields}` : ''}`;
  return new AppError(400, message);
};

const handleSequelizeDatabaseError = err => {
  console.error('Database Error:', err.message);
  return new AppError(500, 'حدث خطأ في قاعدة البيانات');
};

const handleJWTError = () =>
  new AppError(401, 'الجلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى');

const handleJWTExpiredError = () =>
  new AppError(401, 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');

// Check if request is from browser or API
const isApiRequest = req => {
  return (
    req.originalUrl.startsWith('/api') ||
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'))
  );
};

// Render error page for browser requests
const renderErrorPage = (err, req, res) => {
  res.status(err.statusCode).render('layouts/error', {
    statusCode: err.statusCode,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : null,
    user: req.user || null,
  });
};

// Send JSON error for API requests
const sendJsonError = (err, res, isDev) => {
  const response = {
    status: err.status,
    message: err.message,
  };

  if (isDev) {
    response.error = err;
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

// Send error in development mode
const sendErrorDev = (err, req, res) => {
  if (isApiRequest(req)) {
    sendJsonError(err, res, true);
  } else {
    renderErrorPage(err, req, res);
  }
};

// Send error in production mode
const sendErrorProd = (err, req, res) => {
  if (isApiRequest(req)) {
    if (err.isOperational) {
      sendJsonError(err, res, false);
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'حدث خطأ غير متوقع',
      });
    }
  } else {
    // For browser requests, always render the error page
    renderErrorPage(
      {
        statusCode: err.statusCode || 500,
        status: err.status || 'error',
        message: err.isOperational
          ? err.message
          : 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً',
      },
      req,
      res
    );
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;
  error.status = err.status;
  error.isOperational = err.isOperational;
  error.stack = err.stack;

  // Handle specific database errors (Sequelize)
  if (err.name === 'SequelizeValidationError')
    error = handleSequelizeValidationError(err);
  if (err.name === 'SequelizeUniqueConstraintError')
    error = handleSequelizeUniqueConstraint(err);
  if (err.name === 'SequelizeDatabaseError')
    error = handleSequelizeDatabaseError(err);

  // Handle Mongoose errors (if using both)
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};
