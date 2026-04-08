'use strict';

const db      = require('../models');
const R       = require('../../../../shared/utils/response');
const { writeAudit } = require('../../../../shared/utils/audit');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { ROLES, VERIFICATION_STATUS, AUDIT_ACTIONS } = require('../../../../shared/constants');
const logger  = require('../../../../shared/utils/logger');

// ── GET /api/doctors ──────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const where = { role: ROLES.DOCTOR };
    if (req.query.status) where.verificationStatus = req.query.status;

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password','passwordResetToken','passwordResetExpiry'] },
      limit, offset,
      order: [['createdAt','DESC']],
    });
    return R.paginated(res, rows, count, page, limit);
  } catch (err) {
    logger.error('[Doctor] list error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/doctors/:id ──────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const doctor = await db.User.findOne({
      where: { id: req.params.id, role: ROLES.DOCTOR },
      attributes: { exclude: ['password','passwordResetToken','passwordResetExpiry'] },
    });
    if (!doctor) return R.notFound(res, 'Doctor');
    return R.success(res, doctor);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PUT /api/doctors/:id ──────────────────────────────────
exports.update = async (req, res) => {
  try {
    const doctor = await db.User.findOne({ where: { id: req.params.id, role: ROLES.DOCTOR } });
    if (!doctor) return R.notFound(res, 'Doctor');

    if (req.user.role === ROLES.DOCTOR && req.user.id !== req.params.id)
      return R.forbidden(res);

    const allowed = ['name','phone','specialization','qualification','experience','bio',
                     'dailyLimit','workStart','workEnd','workingDays','address'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await doctor.update(updates);
    return R.success(res, doctor);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/doctors/:id/verify ─────────────────────────
exports.verify = async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN) return R.forbidden(res);

    const doctor = await db.User.findOne({ where: { id: req.params.id, role: ROLES.DOCTOR } });
    if (!doctor) return R.notFound(res, 'Doctor');

    const { decision, rejectionReason } = req.body;
    const prevStatus = doctor.verificationStatus;

    doctor.verificationStatus = decision;
    if (decision === VERIFICATION_STATUS.REJECTED) {
      doctor.rejectionReason = rejectionReason;
    } else {
      doctor.rejectionReason = null;
    }
    await doctor.save();

    // Notify doctor
    const title   = decision === VERIFICATION_STATUS.APPROVED
      ? '🎉 Account Approved — Welcome to Panchakarma!'
      : decision === VERIFICATION_STATUS.REJECTED
        ? '❌ Doctor Application Rejected'
        : '⚠️ Account Access Changed';
    const message = decision === VERIFICATION_STATUS.APPROVED
      ? `Congratulations ${doctor.name}! Your account has been verified. You can now sign in and access your dashboard.`
      : `Your doctor application was not approved. Reason: ${rejectionReason}. Contact admin@panchakarma.com to appeal.`;

    await db.Notification.create({
      userId: doctor.id, type: 'system', priority: 'high', read: false, title, message,
    });

    // Audit log
    await writeAudit({
      action: decision === 'approved' ? AUDIT_ACTIONS.DOCTOR_APPROVED
            : decision === 'rejected' ? AUDIT_ACTIONS.DOCTOR_REJECTED
            : AUDIT_ACTIONS.DOCTOR_REVOKED,
      actorId: req.user.id, actorRole: ROLES.ADMIN,
      targetId: doctor.id, targetType: 'user',
      metadata: { prevStatus, newStatus: decision, rejectionReason },
    });

    logger.info(`[Doctor] ${decision} — ${doctor.name} by admin ${req.user.id}`);
    return R.success(res, doctor, 200, {
      message: `Doctor ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`,
    });
  } catch (err) {
    logger.error('[Doctor] verify error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/doctors/:id/capacity ────────────────────────
exports.capacity = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return R.error(res, 'date is required.');

    const doctor = await db.User.findOne({
      where: { id: req.params.id, role: ROLES.DOCTOR },
      attributes: ['id','name','dailyLimit','workStart','workEnd','workingDays'],
    });
    if (!doctor) return R.notFound(res, 'Doctor');

    const { Op } = require('sequelize');
    const used = await db.Session.count({
      where: { doctorId: req.params.id, date, status: { [Op.ne]: 'cancelled' } },
    });

    return R.success(res, {
      doctorId: doctor.id, date,
      limit: doctor.dailyLimit, used,
      available: Math.max(0, doctor.dailyLimit - used),
      workStart: doctor.workStart, workEnd: doctor.workEnd,
      workingDays: doctor.workingDays,
    });
  } catch (err) {
    return R.serverError(res);
  }
};
