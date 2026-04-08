'use strict';

const { Op }    = require('sequelize');
const db        = require('../models');
const R         = require('../../../../shared/utils/response');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { CLINIC_DEFAULTS, SESSION_STATUS, ROLES } = require('../../../../shared/constants');
const { writeAudit } = require('../../../../shared/utils/audit');
const logger    = require('../../../../shared/utils/logger');

// ── Capacity Helpers ───────────────────────────────────────
async function getDoctorCapacity(doctorId, date, t) {
  const doctor = await db.User.findByPk(doctorId, t ? { transaction: t } : {});
  if (!doctor) return null;

  const limit = doctor.dailyLimit || CLINIC_DEFAULTS.DAILY_LIMIT;
  const used  = await db.Session.count({
    where: { doctorId, date, status: { [Op.ne]: SESSION_STATUS.CANCELLED } },
    ...(t ? { transaction: t } : {}),
  });

  // Build available slots
  const workStart = doctor.workStart || CLINIC_DEFAULTS.WORK_START;
  const workEnd   = doctor.workEnd   || CLINIC_DEFAULTS.WORK_END;
  const slotMins  = CLINIC_DEFAULTS.SLOT_DURATION_MINS;

  const bookedTimes = (await db.Session.findAll({
    where: { doctorId, date, status: { [Op.ne]: SESSION_STATUS.CANCELLED } },
    attributes: ['time'],
    ...(t ? { transaction: t } : {}),
  })).map(s => s.time);

  const slots = [];
  let [sh, sm] = workStart.split(':').map(Number);
  const [eh, em] = workEnd.split(':').map(Number);
  while (sh * 60 + sm + slotMins <= eh * 60 + em) {
    const timeStr = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
    if (!bookedTimes.includes(timeStr)) slots.push(timeStr);
    sm += slotMins;
    while (sm >= 60) { sm -= 60; sh++; }
  }

  return { limit, used, available: Math.max(0, limit - used), slots, doctor };
}

// ── GET /api/sessions ─────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const where = {};

    if (req.user.role === ROLES.PATIENT) where.patientId = req.user.id;
    if (req.user.role === ROLES.DOCTOR)  where.doctorId  = req.user.id;
    if (req.query.status)   where.status    = req.query.status;
    if (req.query.doctorId) where.doctorId  = req.query.doctorId;
    if (req.query.date)     where.date      = req.query.date;
    if (req.query.from && req.query.to) {
      where.date = { [Op.between]: [req.query.from, req.query.to] };
    }

    const { count, rows } = await db.Session.findAndCountAll({
      where, limit, offset,
      order: [['date','ASC'],['time','ASC']],
      include: [
        { model: db.User,    as: 'patient',  attributes: ['id','name','patientCode','avatar','phone'] },
        { model: db.User,    as: 'doctor',   attributes: ['id','name','specialization','avatar'] },
        { model: db.Therapy, as: 'therapy',  attributes: ['id','name','duration','price','color'] },
      ],
    });

    return R.paginated(res, rows, count, page, limit);
  } catch (err) {
    logger.error('[Session] list error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/sessions/capacity ────────────────────────────
exports.capacity = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return R.error(res, 'doctorId and date are required.');
    const cap = await getDoctorCapacity(doctorId, date);
    if (!cap) return R.notFound(res, 'Doctor');
    return R.success(res, cap);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/sessions ────────────────────────────────────
exports.create = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { therapyId, doctorId, date, time, notes } = req.body;
    const patientId = req.user.id;

    // 1. Doctor must be approved
    const doctor = await db.User.findOne({
      where: { id: doctorId, role: ROLES.DOCTOR, verificationStatus: 'approved' },
      transaction: t,
    });
    if (!doctor) { await t.rollback(); return R.error(res, 'Selected doctor is not available for booking.'); }

    // 2. Working day check
    const dayName  = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const wDays    = doctor.workingDays || CLINIC_DEFAULTS.WORKING_DAYS;
    if (!wDays.includes(dayName)) {
      await t.rollback();
      return R.error(res, `Dr. ${doctor.name} does not work on ${dayName}s.`);
    }

    // 3. Daily capacity check — LOCKED to prevent race conditions
    const cap = await getDoctorCapacity(doctorId, date, t);
    if (cap.available <= 0) {
      await t.rollback();
      return R.error(res, `Dr. ${doctor.name} is fully booked on ${date}. Please choose another date.`);
    }

    // 4. Time slot still free? (double-check inside transaction)
    if (!cap.slots.includes(time)) {
      await t.rollback();
      return R.error(res, `The ${time} slot is no longer available. Please choose another time.`);
    }

    // 5. Duplicate booking guard
    const dup = await db.Session.findOne({
      where: { patientId, doctorId, date, status: SESSION_STATUS.SCHEDULED },
      transaction: t,
    });
    if (dup) {
      await t.rollback();
      return R.conflict(res, `You already have a session with this doctor on ${date}.`);
    }

    // 6. Advance booking limit
    const bookingLimit = new Date();
    bookingLimit.setDate(bookingLimit.getDate() + CLINIC_DEFAULTS.BOOKING_ADVANCE_DAYS);
    if (new Date(date) > bookingLimit) {
      await t.rollback();
      return R.error(res, `Bookings can only be made up to ${CLINIC_DEFAULTS.BOOKING_ADVANCE_DAYS} days in advance.`);
    }

    const therapy = await db.Therapy.findByPk(therapyId, { transaction: t });
    if (!therapy) { await t.rollback(); return R.notFound(res, 'Therapy'); }

    const session = await db.Session.create({
      patientId, doctorId, therapyId, date, time,
      status: SESSION_STATUS.SCHEDULED,
      duration: therapy.duration,
      notes: notes || null,
      rescheduleCount: 0,
    }, { transaction: t });

    // Notifications (non-blocking)
    const patient = await db.User.findByPk(patientId, { transaction: t });
    await db.Notification.bulkCreate([
      {
        userId: patientId, sessionId: session.id, type: 'system', priority: 'normal', read: false,
        title:   `✅ Session Confirmed — ${therapy.name}`,
        message: `Your ${therapy.name} with Dr. ${doctor.name} on ${date} at ${time} is confirmed.`,
      },
      {
        userId: doctorId, sessionId: session.id, type: 'system', priority: 'normal', read: false,
        title:   `📅 New Appointment — ${patient?.name || 'Patient'}`,
        message: `${patient?.name || 'A patient'} (${patient?.patientCode || '—'}) booked ${therapy.name} on ${date} at ${time}.`,
      },
    ], { transaction: t });

    await t.commit();
    logger.info(`[Session] Created ${session.id} — ${patientId} → Dr ${doctorId} on ${date}`);
    return R.created(res, session);
  } catch (err) {
    await t.rollback();
    logger.error('[Session] create error', { error: err.message });
    return R.serverError(res);
  }
};

// ── PATCH /api/sessions/:id/complete ─────────────────────
exports.complete = async (req, res) => {
  try {
    const session = await db.Session.findByPk(req.params.id);
    if (!session) return R.notFound(res, 'Session');
    if (session.doctorId !== req.user.id && req.user.role !== ROLES.ADMIN)
      return R.forbidden(res);
    if (session.status !== SESSION_STATUS.SCHEDULED)
      return R.error(res, 'Only scheduled sessions can be completed.');

    session.status = SESSION_STATUS.COMPLETED;
    session.completedAt = new Date();
    if (req.body.notes) session.notes = req.body.notes;
    await session.save();

    const therapy = await db.Therapy.findByPk(session.therapyId);
    await db.Notification.create({
      userId: session.patientId, sessionId: session.id,
      type: 'post_procedure', priority: 'high', read: false,
      title:   `Post-Session Care: ${therapy?.name || 'Session'}`,
      message: 'Your session is complete. Rest for 2 hours. Consume warm light food. Avoid cold water and direct sunlight for 24 hours.',
    });

    await writeAudit({
      action: AUDIT_ACTIONS?.SESSION_COMPLETED || 'SESSION_COMPLETED',
      actorId: req.user.id, actorRole: req.user.role,
      targetId: session.id, targetType: 'session',
    });

    return R.success(res, session);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PATCH /api/sessions/:id/cancel ───────────────────────
exports.cancel = async (req, res) => {
  try {
    const session = await db.Session.findByPk(req.params.id);
    if (!session) return R.notFound(res, 'Session');

    const isOwner = session.patientId === req.user.id || session.doctorId === req.user.id;
    if (!isOwner && req.user.role !== ROLES.ADMIN) return R.forbidden(res);
    if (session.status !== SESSION_STATUS.SCHEDULED)
      return R.error(res, 'Only scheduled sessions can be cancelled.');

    // Cancellation notice: patients must cancel ≥24h before
    if (req.user.role === ROLES.PATIENT) {
      const sessionTime  = new Date(`${session.date}T${session.time}`);
      const hoursUntil   = (sessionTime - Date.now()) / 3600000;
      if (hoursUntil < CLINIC_DEFAULTS.CANCEL_NOTICE_HOURS) {
        return R.error(res,
          `Cancellations must be made at least ${CLINIC_DEFAULTS.CANCEL_NOTICE_HOURS} hours in advance.`);
      }
    }

    session.status     = SESSION_STATUS.CANCELLED;
    session.cancelledAt = new Date();
    session.cancelReason = req.body.reason || null;
    await session.save();

    return R.success(res, session, 200, { message: 'Session cancelled successfully.' });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PATCH /api/sessions/:id/reschedule ───────────────────
exports.reschedule = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const session = await db.Session.findByPk(req.params.id, { transaction: t });
    if (!session) { await t.rollback(); return R.notFound(res, 'Session'); }
    if (session.patientId !== req.user.id && req.user.role !== ROLES.ADMIN) {
      await t.rollback(); return R.forbidden(res);
    }
    if (session.status !== SESSION_STATUS.SCHEDULED) {
      await t.rollback(); return R.error(res, 'Only scheduled sessions can be rescheduled.');
    }
    if ((session.rescheduleCount || 0) >= CLINIC_DEFAULTS.MAX_RESCHEDULE_COUNT) {
      await t.rollback();
      return R.error(res, `Maximum ${CLINIC_DEFAULTS.MAX_RESCHEDULE_COUNT} reschedules allowed per session.`);
    }

    const { date, time } = req.body;
    const cap = await getDoctorCapacity(session.doctorId, date, t);
    if (!cap.slots.includes(time)) {
      await t.rollback();
      return R.error(res, 'Selected time slot is not available.');
    }

    session.date  = date;
    session.time  = time;
    session.rescheduleCount = (session.rescheduleCount || 0) + 1;
    session.status = SESSION_STATUS.SCHEDULED;
    await session.save({ transaction: t });

    await t.commit();
    return R.success(res, session);
  } catch (err) {
    await t.rollback();
    return R.serverError(res);
  }
};
