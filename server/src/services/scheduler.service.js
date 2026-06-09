const cron = require('node-cron');
const { expireOverduePlans } = require('./razorpay.service');

function startScheduler() {
  cron.schedule('0 * * * *', expireOverduePlans);
  console.log('Scheduler started — plan expiry check every hour');
}

module.exports = { startScheduler };
