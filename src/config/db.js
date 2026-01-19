const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, // Disable logging
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true, // Use snake_case for column names
    },
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Sync models (in development, use { alter: true } for schema updates)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    } else {
      await sequelize.sync();
    }
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
