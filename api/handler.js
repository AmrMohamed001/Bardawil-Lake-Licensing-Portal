require('dotenv').config({ path: './src/config/config.env', quiet: true });
const app = require('../src/app');
require('../src/models');

module.exports = app;
