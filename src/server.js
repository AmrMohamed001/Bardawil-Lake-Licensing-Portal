require('dotenv').config({ path: './src/config/config.env', quiet: true });
const app = require('./app');
const { connectDB } = require('./config/db');
require('./models');

const cluster = require('cluster');
const isWorker = cluster.isWorker || cluster.isPrimary === false;

let server;
connectDB()
  .then(() => {
    server = app.listen(process.env.PORT || 3000, () => {
      if (isWorker) {
        console.log(`  └─ Worker ${process.pid} ready on port ${process.env.PORT || 3000}`);
      } else {
        console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
      }
    });
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
