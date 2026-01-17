const crypto = require('crypto');

module.exports = function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = crypto.randomInt(100000, 999999).toString();
  return `ORD-${timestamp}-${random}`;
};
