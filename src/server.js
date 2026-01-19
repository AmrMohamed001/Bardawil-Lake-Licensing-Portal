require('dotenv').config({ path: './src/config/config.env' });
const app = require('./app');
const { connectDB } = require('./config/db');

// Import models to register associations
require('./models');

let server;
connectDB()
  .then(() => {
    server = app.listen(process.env.PORT || 3000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`)
    );
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });

process.on('unhandledRejection', err => {
  console.log(`UNHANDLED REJECTION ${err.name} : ${err.message}`);
  console.log(err);
  server.close(() => {
    console.log('SHUTTING DOWN . . . ');
    process.exit(1);
  });
});
