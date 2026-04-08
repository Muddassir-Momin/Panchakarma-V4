'use strict';

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { Op }    = require('sequelize');
const db        = require('../models');
const R         = require('../../../../shared/utils/response');
const { writeAudit } = require('../../../../shared/utils/audit');
const { generatePatientCode } = require('../../../../shared/utils/patientCode');
const { ROLES, VERIFICATION_STATUS, AUDIT_ACTIONS, JWT } = require('../../../../shared/constants');
const logger    = require('../../../../shared/utils/logger');

const SALT_ROUNDS = 12;

// ── Helpers ────────────────────────────────────────────────
function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, {
    expiresIn: JWT.EXPIRES_IN,
    algorithm: JWT.ALGORITHM,
  });
}

function sanitiseUser(u) {
  const obj = u.toJSON();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
}

// ── POST /api/auth/signup ──────────────────────────────────
exports.signup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { firstName, lastName, email, password, role, phone,
            dosha, dob, gender, specialization, qualification, experience } = req.body;

    // Email uniqueness
    const exists = await db.User.findOne({ where: { email }, transaction: t });
    if (exists) {
      await t.rollback();
      return R.conflict(res, 'An account with this email already exists.');
    }

    const hashed    = await bcrypt.hash(password, SALT_ROUNDS);
    const isDoctor  = role === ROLES.DOCTOR;
    const isPatient = role === ROLES.PATIENT;

    // Generate patient code inside transaction (prevents collisions)
    let patientCode = null;
    if (isPatient) {
      patientCode = await generatePatientCode(db.User, t);
    }

    const userData = {
      name:   `${firstName.trim()} ${lastName.trim()}`,
      email:  email.toLowerCase().trim(),
      password: hashed,
      role,
      phone:  phone || null,
      avatar: (firstName[0] + lastName[0]).toUpperCase(),
      // Patient fields
      ...(isPatient && { patientCode, dosha: dosha || 'Vata', dob: dob || null, gender: gender || null }),
      // Doctor fields
      verificationStatus: isDoctor ? VERIFICATION_STATUS.PENDING : null,
      appliedAt:          isDoctor ? new Date() : null,
      ...(isDoctor && { specialization, qualification, experience, dailyLimit: 8,
                        workStart: '09:00', workEnd: '18:00',
                        workingDays: JSON.stringify(['Mon','Tue','Wed','Thu','Fri']) }),
    };

    const user = await db.User.create(userData, { transaction: t });

    // Notify admins about new doctor application
    if (isDoctor) {
      const admins = await db.User.findAll({ where: { role: ROLES.ADMIN }, transaction: t });
      for (const admin of admins) {
        await db.Notification.create({
          userId: admin.id, type: 'system', priority: 'high', read: false,
          title:   `🩺 New Doctor Application — ${user.name}`,
          message: `${user.name} (${specialization || '—'}) has applied for a doctor account and is awaiting verification.`,
        }, { transaction: t });
      }
    }

    // Welcome notification
    await db.Notification.create({
      userId: user.id, type: 'system', priority: 'normal', read: false,
      title:   isDoctor ? `🌿 Application Received, ${firstName}!` : `🌿 Welcome to Panchakarma, ${firstName}!`,
      message: isDoctor
        ? `Your application is under review. You will be notified once approved (24–48 hours).`
        : `Your account is ready. Your Patient ID is ${patientCode}.`,
    }, { transaction: t });

    await t.commit();

    const token = isDoctor ? null : signToken(user.id, user.role);
    logger.info(`[Auth] New ${role} registered: ${email}`);
    return R.created(res, {
      user: sanitiseUser(user),
      token,
      requiresVerification: isDoctor,
    });
  } catch (err) {
    await t.rollback();
    logger.error('[Auth] Signup error', { error: err.message });
    return R.serverError(res);
  }
};

// ── POST /api/auth/login ───────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return R.unauthorized(res, 'Invalid email or password.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return R.unauthorized(res, 'Invalid email or password.');

    if (!user.isActive) return R.forbidden(res, 'Your account has been deactivated. Contact admin.');

    // Doctor-specific: check verification
    if (user.role === ROLES.DOCTOR) {
      if (user.verificationStatus === VERIFICATION_STATUS.PENDING) {
        return R.forbidden(res, 'DOCTOR_PENDING');
      }
      if (user.verificationStatus === VERIFICATION_STATUS.REJECTED) {
        return R.forbidden(res, 'DOCTOR_REJECTED');
      }
    }

    const token = signToken(user.id, user.role);
    logger.info(`[Auth] Login: ${email}`);
    return R.success(res, { user: sanitiseUser(user), token });
  } catch (err) {
    logger.error('[Auth] Login error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/auth/me ───────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) return R.notFound(res, 'User');
    return R.success(res, sanitiseUser(user));
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/auth/change-password ────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.User.findByPk(req.user.id);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return R.error(res, 'Current password is incorrect.');

    if (newPassword === currentPassword)
      return R.error(res, 'New password must differ from current password.');

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
    return R.success(res, null, 200, { message: 'Password updated successfully.' });
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/auth/forgot-password ────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.User.findOne({ where: { email: email.toLowerCase() } });

    // Always return 200 to prevent email enumeration
    if (!user) return R.success(res, null, 200, { message: 'If that email exists, a reset link has been sent.' });

    const token   = require('crypto').randomBytes(32).toString('hex');
    const expiry  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.passwordResetToken  = await bcrypt.hash(token, 10);
    user.passwordResetExpiry = expiry;
    await user.save();

    // In production: send email with reset link
    const { sendEmail } = require('../utils/email');
    if (sendEmail) await sendEmail({ to: email, token });

    return R.success(res, null, 200, { message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('[Auth] Forgot password error', { error: err.message });
    return R.serverError(res);
  }
};
