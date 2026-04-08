'use strict';

// ── Roles ──────────────────────────────────────────────────
exports.ROLES = Object.freeze({
  PATIENT: 'patient',
  DOCTOR:  'doctor',
  ADMIN:   'admin',
});

// ── Doctor Verification Status ────────────────────────────
exports.VERIFICATION_STATUS = Object.freeze({
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

// ── Session Status ─────────────────────────────────────────
exports.SESSION_STATUS = Object.freeze({
  SCHEDULED:  'scheduled',
  COMPLETED:  'completed',
  CANCELLED:  'cancelled',
  RESCHEDULED:'rescheduled',
});

// ── Order Status ───────────────────────────────────────────
exports.ORDER_STATUS = Object.freeze({
  PROCESSING: 'processing',
  READY:      'ready',
  SHIPPED:    'shipped',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
});

// ── Order Mode ─────────────────────────────────────────────
exports.ORDER_MODE = Object.freeze({
  ONLINE: 'online',
  PICKUP: 'pickup',
});

// ── Notification Types ─────────────────────────────────────
exports.NOTIFICATION_TYPE = Object.freeze({
  PRE_PROCEDURE:  'pre_procedure',
  POST_PROCEDURE: 'post_procedure',
  GENERAL:        'general',
  SYSTEM:         'system',
});

exports.NOTIFICATION_PRIORITY = Object.freeze({
  NORMAL:   'normal',
  HIGH:     'high',
  CRITICAL: 'critical',
});

// ── Milestone Status ───────────────────────────────────────
exports.MILESTONE_STATUS = Object.freeze({
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
});

// ── Dosha Types ────────────────────────────────────────────
exports.DOSHA_TYPES = Object.freeze([
  'Vata', 'Pitta', 'Kapha',
  'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha',
]);

// ── Therapy Categories ─────────────────────────────────────
exports.THERAPY_CATEGORIES = Object.freeze([
  'Purvakarma', 'Pradhanakarma', 'Pashchatkarma', 'Keraliya',
]);

// ── Clinic Defaults ────────────────────────────────────────
exports.CLINIC_DEFAULTS = Object.freeze({
  DAILY_LIMIT:          8,
  SLOT_DURATION_MINS:   60,
  WORK_START:           '09:00',
  WORK_END:             '18:00',
  WORKING_DAYS:         ['Mon','Tue','Wed','Thu','Fri'],
  BOOKING_ADVANCE_DAYS: 30,
  PATIENT_ID_PREFIX:    'PKM',
  PICKUP_CODE_PREFIX:   'PKP',
  CANCEL_NOTICE_HOURS:  24,
  MAX_RESCHEDULE_COUNT: 3,
});

// ── Service Ports ──────────────────────────────────────────
exports.SERVICE_PORTS = Object.freeze({
  GATEWAY:      4000,
  AUTH:         4001,
  PATIENT:      4002,
  DOCTOR:       4003,
  SESSION:      4004,
  SHOP:         4005,
  NOTIFICATION: 4006,
  REPORT:       4007,
});

// ── HTTP Status Codes ──────────────────────────────────────
exports.HTTP = Object.freeze({
  OK:         200,
  CREATED:    201,
  NO_CONTENT: 204,
  BAD_REQUEST:400,
  UNAUTHORIZED:401,
  FORBIDDEN:  403,
  NOT_FOUND:  404,
  CONFLICT:   409,
  UNPROCESSABLE:422,
  TOO_MANY:   429,
  SERVER_ERR: 500,
});

// ── JWT Config ─────────────────────────────────────────────
exports.JWT = Object.freeze({
  EXPIRES_IN:         '7d',
  REFRESH_EXPIRES_IN: '30d',
  ALGORITHM:          'HS256',
});

// ── Audit Actions ──────────────────────────────────────────
exports.AUDIT_ACTIONS = Object.freeze({
  DOCTOR_APPROVED:  'DOCTOR_APPROVED',
  DOCTOR_REJECTED:  'DOCTOR_REJECTED',
  DOCTOR_REVOKED:   'DOCTOR_REVOKED',
  USER_DELETED:     'USER_DELETED',
  USER_CREATED:     'USER_CREATED',
  USER_ROLE_CHANGED:'USER_ROLE_CHANGED',
  SESSION_CANCELLED:'SESSION_CANCELLED',
  SESSION_COMPLETED:'SESSION_COMPLETED',
  ORDER_STATUS_CHANGED:'ORDER_STATUS_CHANGED',
});
