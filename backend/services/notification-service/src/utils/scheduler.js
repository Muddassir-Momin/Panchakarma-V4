'use strict';

/**
 * Automated Scheduler — Session reminders, overdue cleanup
 * Runs inside notification-service on startup.
 * Requires: npm install node-cron
 */

const logger = require('../../../../shared/utils/logger');
const { CLINIC_DEFAULTS } = require('../../../../shared/constants');

let cron;
try { cron = require('node-cron'); } catch { cron = null; }

async function sendTomorrowReminders(db) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  try {
    const sessions = await db.Session.findAll({
      where: { date: dateStr, status: 'scheduled' },
      include: [
        { model: db.User,    as: 'patient',  attributes: ['id','name','phone','email'] },
        { model: db.Therapy, as: 'therapy',  attributes: ['name'] },
      ],
    });

    logger.info(`[Scheduler] 24h reminders: ${sessions.length} sessions for ${dateStr}`);

    for (const s of sessions) {
      const existing = await db.Notification.findOne({
        where: { userId: s.patientId, sessionId: s.id, type: 'pre_procedure' },
      });
      if (existing) continue;

      await db.Notification.create({
        userId: s.patientId, sessionId: s.id,
        type: 'pre_procedure', priority: 'high', read: false,
        title:   `🌿 Session Tomorrow: ${s.therapy?.name}`,
        message: `Your ${s.therapy?.name} session is tomorrow at ${s.time}. Fast 2 hours before. Arrive 10 minutes early. Wear loose comfortable clothing.`,
      });

      // Optional SMS
      if (s.patient?.phone && process.env.TWILIO_SID) {
        try {
          const { sendSMS } = require('./sms');
          await sendSMS(s.patient.phone,
            `Panchakarma: Your ${s.therapy?.name} session is tomorrow at ${s.time}. Arrive 10 min early.`);
        } catch {}
      }
    }
  } catch (err) {
    logger.error('[Scheduler] 24h reminder error', { error: err.message });
  }
}

async function resolveOverdueSessions(db) {
  const { Op } = require('sequelize');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  try {
    const [updated] = await db.Session.update(
      { status: 'cancelled', cancelReason: 'Auto-cancelled: session date passed' },
      { where: { status: 'scheduled', date: { [Op.lt]: dateStr } } }
    );
    if (updated > 0) logger.info(`[Scheduler] Auto-cancelled ${updated} overdue sessions.`);
  } catch (err) {
    logger.error('[Scheduler] Overdue cleanup error', { error: err.message });
  }
}

/**
 * Start all cron jobs.
 * @param {Object} db - Sequelize models object
 */
exports.start = (db) => {
  if (!cron) {
    logger.warn('[Scheduler] node-cron not installed. Run: npm install node-cron');
    // Run once at startup for testing
    sendTomorrowReminders(db);
    return;
  }

  // 08:00 AM IST — tomorrow session reminders
  cron.schedule('0 8 * * *', () => sendTomorrowReminders(db), { timezone: 'Asia/Kolkata' });

  // 00:05 AM IST — auto-cancel overdue sessions
  cron.schedule('5 0 * * *', () => resolveOverdueSessions(db), { timezone: 'Asia/Kolkata' });

  logger.info('[Scheduler] Cron jobs started: reminders (08:00 IST), cleanup (00:05 IST)');
};
