const cron = require('node-cron');
const prisma = require('../prisma');
// const nodemailer = require('nodemailer');

function startScheduler() {
  // Daily reminder at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily reminder job...');
    try {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
      // In production: check streak, send email reminders to users who haven't logged today
      for (const user of users) {
        const todayAction = await prisma.action.findFirst({
          where: { userId: user.id, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        });
        if (!todayAction) {
          // sendReminderEmail(user); // implement with nodemailer
          console.log(`Reminder: ${user.email} hasn't logged today`);
        }
      }
    } catch (e) {
      console.error('Scheduler error:', e);
    }
  });

  // Weekly leaderboard summary (Monday 9 AM)
  cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Running weekly leaderboard summary...');
    // Compile top performers and send summary emails
  });

  console.log('📅 Scheduler started');
}

module.exports = {
  startScheduler,
};