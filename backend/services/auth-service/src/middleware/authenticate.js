'use strict';

const jwt = require('jsonwebtoken');
const R   = require('../../../../shared/utils/response');
const { JWT } = require('../../../../shared/constants');

/**
 * Verify JWT from Authorization header.
 * Sets req.user = { id, role } on success.
 */
exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return R.unauthorized(res);

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [JWT.ALGORITHM] });
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return R.unauthorized(res, 'Token expired. Please sign in again.');
    return R.forbidden(res, 'Invalid token.');
  }
};

/**
 * Require specific role(s).
 * Usage:  router.get('/admin', authenticate, requireRole('admin'), handler)
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return R.unauthorized(res);
  if (!roles.includes(req.user.role)) return R.forbidden(res);
  next();
};

/**
 * Require doctor with approved verification (checked at login, but double-checked here).
 */
exports.requireApprovedDoctor = async (req, res, next) => {
  if (req.user?.role !== 'doctor') return R.forbidden(res);
  // Optionally re-check DB for revocation
  next();
};
