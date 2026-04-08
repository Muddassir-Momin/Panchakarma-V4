'use strict';

const { CLINIC_DEFAULTS } = require('../constants');

/**
 * Generate the next PKM-XXXX patient code.
 * In production this should use a DB sequence or atomic counter.
 * Accepts a sequelize model and uses a transaction to prevent collisions.
 *
 * @param {Object} UserModel  - Sequelize User model
 * @param {Object} [t]        - Optional Sequelize transaction
 * @returns {Promise<string>} - e.g. "PKM-0042"
 */
exports.generatePatientCode = async (UserModel, t) => {
  const opts = t ? { transaction: t, lock: t.LOCK?.UPDATE } : {};

  // Find the highest existing code
  const latest = await UserModel.findOne({
    where: { role: 'patient' },
    attributes: ['patientCode'],
    order: [['patientCode', 'DESC']],
    ...opts,
  });

  let next = 1;
  if (latest?.patientCode) {
    const match = latest.patientCode.match(/(\d+)$/);
    if (match) next = parseInt(match[1]) + 1;
  }

  return `${CLINIC_DEFAULTS.PATIENT_ID_PREFIX}-${String(next).padStart(4, '0')}`;
};

/**
 * Generate a random pickup code — collision-resistant 6-char alphanumeric.
 * Format: PKP-AB12CD
 */
exports.generatePickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 lookalikes
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${CLINIC_DEFAULTS.PICKUP_CODE_PREFIX}-${code}`;
};
