// worker.js
require('dotenv').config();
const cron = require('node-cron');
const { runOnce } = require('./scrape');

const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *'; // default every 6 hours

console.log('Starting scraper cron with schedule:', schedule);

cron.schedule(schedule, async () => {
  console.log('Cron job started at', new Date().toISOString());
  try {
    await runOnce();
  } catch (err) {
    console.error('Cron job failed:', err);
  }
});

// keep process alive
