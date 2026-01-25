const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandlingMiddleware = require('./middlewares/globalErrorHandlingMiddleware');
/////////////////////////////////////////////////////////////////
// ROUTE IMPORTS
const viewRoutes = require('./routes/viewRoute');
const authRoutes = require('./routes/authRoute');
const applicationRoutes = require('./routes/applicationRoute');
const adminRoutes = require('./routes/adminRoute');
const notificationRoutes = require('./routes/notificationRoute');
const userRoutes = require('./routes/userRoute');
const publicRoutes = require('./routes/publicRoute');
const paymentRoutes = require('./routes/paymentRoute');

const app = express();

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9)
}));

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////////////////////////////////////////////////
// SECURITY MIDDLEWARES
// Disable CSP for development - allows inline scripts and event handlers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

/////////////////////////////////////////////////////////////////
// BODY PARSING MIDDLEWARES
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Add request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/////////////////////////////////////////////////////////////////
// ROUTE MOUNTING
app.use('/', viewRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/financial', require('./routes/financialRoute'));
app.use('/api/v1/financial', require('./routes/financialRoute'));

/////////////////////////////////////////////////////////////////
// 404 Handler - Express v5 compatible
app.use((req, res, next) => {
  return next(new AppError(404, `Cannot find route: ${req.originalUrl}`));
});

// Global error handler
app.use(globalErrorHandlingMiddleware);

module.exports = app;
