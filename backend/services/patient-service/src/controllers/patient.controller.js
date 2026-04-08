'use strict';

const { Op }  = require('sequelize');
const db      = require('../models');
const R       = require('../../../../shared/utils/response');
const { parsePagination, parseSort } = require('../../../../shared/utils/pagination');
const { generatePatientCode } = require('../../../../shared/utils/patientCode');
const { writeAudit }  = require('../../../../shared/utils/audit');
const { findDuplicates } = require('../utils/duplicate.util');
const { ROLES, AUDIT_ACTIONS } = require('../../../../shared/constants');
const logger  = require('../../../../shared/utils/logger');

// ── GET /api/patients ─────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const { field, direction }    = parseSort(req, ['name','patientCode','createdAt','registeredAt']);
    const q = req.query.q?.trim();

    const where = { role: ROLES.PATIENT };
    if (q) {
      where[Op.or] = [
        { name:        { [Op.like]: `%${q}%` } },
        { patientCode: { [Op.like]: `%${q}%` } },
        { email:       { [Op.like]: `%${q}%` } },
        { phone:       { [Op.like]: `%${q.replace(/\s/g,'')}%` } },
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: { exclude: ['password','passwordResetToken','passwordResetExpiry'] },
      limit, offset,
      order: [[field, direction]],
    });

    return R.paginated(res, rows, count, page, limit);
  } catch (err) {
    logger.error('[Patient] list error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/patients/:id ─────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const patient = await db.User.findOne({
      where: { id: req.params.id, role: ROLES.PATIENT },
      attributes: { exclude: ['password','passwordResetToken','passwordResetExpiry'] },
    });
    if (!patient) return R.notFound(res, 'Patient');
    return R.success(res, patient);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/patients (doctor registers a patient) ───────
exports.create = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { name, email, phone, dob, gender, dosha, bloodGroup, allergies } = req.body;

    // Email uniqueness
    const exists = await db.User.findOne({ where: { email: email.toLowerCase() }, transaction: t });
    if (exists) {
      await t.rollback();
      return R.conflict(res, 'A patient with this email already exists.');
    }

    // Duplicate detection (same name OR phone — advisory, not blocking)
    const dupes = await findDuplicates(db.User, name, phone, t);

    const patientCode = await generatePatientCode(db.User, t);
    const parts       = name.trim().split(' ').filter(Boolean);
    const avatar      = parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
                                           : parts[0].slice(0,2).toUpperCase();

    const patient = await db.User.create({
      name: name.trim(), email: email.toLowerCase().trim(),
      password: '$2a$12$disabled.account.no.login', // doctor-added patients get temp password
      role: ROLES.PATIENT, phone: phone || null,
      patientCode, avatar,
      dob: dob || null, gender: gender || null,
      dosha: dosha || 'Vata', bloodGroup: bloodGroup || null,
      allergies: allergies || 'None', registeredAt: new Date(),
      registeredByDoctorId: req.user?.id,
    }, { transaction: t });

    // Welcome notification
    await db.Notification.create({
      userId: patient.id, type: 'system', priority: 'normal', read: false,
      title:   `🌿 Welcome to Panchakarma, ${name.split(' ')[0]}!`,
      message: `Your patient account has been created. Your unique Patient ID is: ${patientCode}.`,
    }, { transaction: t });

    await t.commit();
    logger.info(`[Patient] Created ${patientCode} by doctor ${req.user?.id}`);
    return R.created(res, patient, { duplicateWarning: dupes.length > 0 ? dupes : null });
  } catch (err) {
    await t.rollback();
    logger.error('[Patient] create error', { error: err.message });
    return R.serverError(res);
  }
};

// ── PUT /api/patients/:id ─────────────────────────────────
exports.update = async (req, res) => {
  try {
    const patient = await db.User.findOne({ where: { id: req.params.id, role: ROLES.PATIENT } });
    if (!patient) return R.notFound(res, 'Patient');

    // Patients can only update their own record; doctors/admins can update any
    if (req.user.role === ROLES.PATIENT && req.user.id !== req.params.id)
      return R.forbidden(res);

    const allowed = ['name','phone','dob','gender','dosha','bloodGroup','allergies','emergencyContact','address'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await patient.update(updates);
    return R.success(res, patient);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── GET /api/patients/:id/stats ───────────────────────────
exports.stats = async (req, res) => {
  try {
    const patient = await db.User.findOne({ where: { id: req.params.id, role: ROLES.PATIENT } });
    if (!patient) return R.notFound(res, 'Patient');

    const sessions     = await db.Session.count({ where: { patientId: req.params.id } });
    const completed    = await db.Session.count({ where: { patientId: req.params.id, status: 'completed' } });
    const prescriptions= await db.Prescription.count({ where: { patientId: req.params.id } });
    const orders       = await db.Order.count({ where: { patientId: req.params.id } });
    const milestones   = await db.Milestone.findAll({ where: { patientId: req.params.id } });
    const done         = milestones.filter(m => m.status === 'completed').length;

    return R.success(res, {
      totalSessions: sessions, completedSessions: completed,
      adherencePct: sessions > 0 ? Math.round(completed/sessions*100) : 0,
      prescriptions, orders, milestones: milestones.length, completedMilestones: done,
    });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── GET /api/patients/check-duplicate ────────────────────
exports.checkDuplicate = async (req, res) => {
  try {
    const { name, phone } = req.query;
    if (!name && !phone) return R.success(res, []);
    const dupes = await findDuplicates(db.User, name || '', phone || '');
    return R.success(res, dupes.map(p => ({
      id: p.id, patientCode: p.patientCode, name: p.name, phone: p.phone, email: p.email,
    })));
  } catch (err) {
    return R.serverError(res);
  }
};
