'use strict';

/**
 * shared/utils/audit.js — Audit Log Writer
 *
 * Every privileged admin action (approve doctor, delete user, etc.)
 * is written here. In production this writes to a dedicated
 * audit_logs DB table via the passed Sequelize model.
 * Falls back to structured console logging if no model is provided.
 */

const logger = require('./logger');

/**
 * @param {Object} opts
 * @param {string} opts.action      - e.g. 'DOCTOR_APPROVED' (from AUDIT_ACTIONS constant)
 * @param {string} opts.actorId     - ID of user performing the action
 * @param {string} opts.actorRole   - Role of actor (admin, doctor, system)
 * @param {string} opts.targetId    - ID of the entity being acted on
 * @param {string} opts.targetType  - 'user' | 'session' | 'order' | 'product'
 * @param {Object} [opts.metadata]  - Any additional context
 * @param {Object} [opts.AuditModel]- Optional Sequelize AuditLog model
 * @param {Object} [opts.t]         - Optional Sequelize transaction
 */
exports.writeAudit = async ({
  action, actorId, actorRole, targetId, targetType,
  metadata = {}, AuditModel = null, t = null,
}) => {
  const entry = {
    action,
    actorId,
    actorRole,
    targetId,
    targetType,
    metadata,
    timestamp: new Date().toISOString(),
  };

  logger.info('[Audit]', entry);

  if (AuditModel) {
    try {
      await AuditModel.create(entry, t ? { transaction: t } : {});
    } catch (err) {
      // Never let audit failure break the main request
      logger.error('[Audit] Failed to persist audit entry:', { error: err.message, entry });
    }
  }
};
