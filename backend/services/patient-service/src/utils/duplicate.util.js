'use strict';

const { Op } = require('sequelize');
const { ROLES } = require('../../../../shared/constants');

/**
 * Find existing patients who share the same name OR same phone.
 * Two patients CAN have the same name or phone — this is advisory only.
 *
 * @param {Object} UserModel  - Sequelize User model
 * @param {string} name       - Patient full name
 * @param {string} phone      - Patient phone number
 * @param {Object} [t]        - Optional Sequelize transaction
 * @returns {Promise<User[]>}
 */
exports.findDuplicates = async (UserModel, name, phone, t) => {
  const orClauses = [];

  if (name?.trim()) {
    // Case-insensitive name match
    orClauses.push({ name: { [Op.like]: name.trim() } });
  }

  if (phone?.trim()) {
    // Strip whitespace before comparing phone
    const stripped = phone.replace(/\s/g, '');
    orClauses.push({
      // Match if stored phone (stripped) equals query phone
      // NOTE: Full collation-based comparison is done in application layer for demo
      phone: { [Op.like]: `%${stripped.slice(-8)}%` },
    });
  }

  if (!orClauses.length) return [];

  const opts = {
    where: { role: ROLES.PATIENT, [Op.or]: orClauses },
    attributes: ['id','patientCode','name','phone','email','dosha','dob'],
    limit: 10,
  };
  if (t) opts.transaction = t;

  return UserModel.findAll(opts);
};
