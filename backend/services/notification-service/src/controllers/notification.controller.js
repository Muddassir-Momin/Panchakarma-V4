'use strict';

const db     = require('../models');
const R      = require('../../../../shared/utils/response');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { ROLES, NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require('../../../../shared/constants');
const logger = require('../../../../shared/utils/logger');

// ── GET /api/notifications ────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req, { page: 1, limit: 30 });
    const where = { userId: req.user.id };
    if (req.query.type)     where.type     = req.query.type;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.read !== undefined) where.read = req.query.read === 'true';

    const { count, rows } = await db.Notification.findAndCountAll({
      where, limit, offset, order: [['createdAt','DESC']],
    });
    const unreadCount = await db.Notification.count({ where: { userId: req.user.id, read: false } });
    return R.paginated(res, rows, count, page, limit, { unreadCount });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────
exports.markRead = async (req, res) => {
  try {
    const notif = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notif) return R.notFound(res, 'Notification');
    notif.read = true;
    await notif.save();
    return R.success(res, notif);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await db.Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
    return R.success(res, null, 200, { message: 'All notifications marked as read.' });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/notifications/broadcast ────────────────────
// Admin broadcasts announcement to targeted audience
exports.broadcast = async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN) return R.forbidden(res);

    const { title, message, audience, priority = 'normal' } = req.body;
    if (!title || !message || !audience) return R.error(res, 'title, message and audience are required.');

    const roleFilter = audience === 'all'     ? ['patient','doctor']
                     : audience === 'patient' ? ['patient']
                     : audience === 'doctor'  ? ['doctor']
                     : null;
    if (!roleFilter) return R.error(res, 'audience must be all, patient, or doctor.');

    const targets = await db.User.findAll({
      where: { role: roleFilter, isActive: true },
      attributes: ['id'],
    });

    await db.Notification.bulkCreate(targets.map(u => ({
      userId: u.id, type: NOTIFICATION_TYPE.SYSTEM,
      priority: Object.values(NOTIFICATION_PRIORITY).includes(priority) ? priority : 'normal',
      title: `📢 ${title}`, message, read: false,
    })));

    logger.info(`[Notification] Broadcast to ${targets.length} users by admin ${req.user.id}`);
    return R.success(res, null, 200, { sentTo: targets.length });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/notifications (send to single user) ────────
exports.send = async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.DOCTOR)
      return R.forbidden(res);

    const notif = await db.Notification.create({ ...req.body, read: false });
    return R.created(res, notif);
  } catch (err) {
    return R.serverError(res);
  }
};
