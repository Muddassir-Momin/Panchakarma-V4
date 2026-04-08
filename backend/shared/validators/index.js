'use strict';

/**
 * shared/validators/index.js
 * Re-usable Joi validation schemas shared across all services.
 * Install:  npm install joi
 */

let Joi;
try { Joi = require('joi'); } catch { Joi = null; }

if (!Joi) {
  // Lightweight fallback if Joi isn't installed — returns always-valid
  module.exports = { validate: () => ({ error: null }), schemas: {} };
  return;
}

// ── Common Field Schemas ───────────────────────────────────
const email    = Joi.string().email().lowercase().trim().max(255);
const password = Joi.string().min(8).max(128);
const phone    = Joi.string().pattern(/^[\d\s+\-().]{7,20}$/).allow('', null);
const uuid     = Joi.string().uuid({ version: 'uuidv4' });
const dateStr  = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeStr  = Joi.string().pattern(/^\d{2}:\d{2}$/);

// ── Auth Schemas ───────────────────────────────────────────
exports.loginSchema = Joi.object({
  email:    email.required(),
  password: password.required(),
});

exports.signupSchema = Joi.object({
  firstName:      Joi.string().min(2).max(50).trim().required(),
  lastName:       Joi.string().min(2).max(50).trim().required(),
  email:          email.required(),
  password:       password.required(),
  phone:          phone,
  role:           Joi.string().valid('patient', 'doctor').required(),
  dosha:          Joi.string().valid('Vata','Pitta','Kapha','Vata-Pitta','Pitta-Kapha','Vata-Kapha').when('role',{is:'patient',then:Joi.optional()}),
  dob:            dateStr.when('role',{is:'patient',then:Joi.optional()}),
  gender:         Joi.string().valid('Male','Female','Other').optional(),
  specialization: Joi.string().max(100).when('role',{is:'doctor',then:Joi.optional()}),
  qualification:  Joi.string().max(100).optional(),
  experience:     Joi.string().max(50).optional(),
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     password.required(),
});

// ── Patient Schemas ────────────────────────────────────────
exports.patientUpdateSchema = Joi.object({
  name:             Joi.string().min(2).max(100).trim(),
  phone,
  dob:              dateStr,
  gender:           Joi.string().valid('Male','Female','Other'),
  dosha:            Joi.string().valid('Vata','Pitta','Kapha','Vata-Pitta','Pitta-Kapha','Vata-Kapha'),
  address:          Joi.string().max(255).allow('', null),
  bloodGroup:       Joi.string().valid('A+','A-','B+','B-','O+','O-','AB+','AB-','—').allow(null),
  allergies:        Joi.string().max(255).allow('', null),
  emergencyContact: phone,
});

exports.addPatientSchema = Joi.object({
  name:       Joi.string().min(2).max(100).trim().required(),
  email:      email.required(),
  phone,
  dob:        dateStr,
  gender:     Joi.string().valid('Male','Female','Other'),
  dosha:      Joi.string().valid('Vata','Pitta','Kapha','Vata-Pitta','Pitta-Kapha','Vata-Kapha'),
  bloodGroup: Joi.string().valid('A+','A-','B+','B-','O+','O-','AB+','AB-','—').allow(null),
  allergies:  Joi.string().max(255).allow('', null),
});

// ── Session Schemas ────────────────────────────────────────
exports.createSessionSchema = Joi.object({
  therapyId: uuid.required(),
  doctorId:  uuid.required(),
  date:      dateStr.required(),
  time:      timeStr.required(),
  notes:     Joi.string().max(500).allow('', null),
});

exports.rescheduleSessionSchema = Joi.object({
  date:  dateStr.required(),
  time:  timeStr.required(),
  notes: Joi.string().max(500).allow('', null),
});

// ── Doctor Schemas ─────────────────────────────────────────
exports.doctorUpdateSchema = Joi.object({
  name:           Joi.string().min(2).max(100).trim(),
  phone,
  specialization: Joi.string().max(100),
  qualification:  Joi.string().max(100),
  experience:     Joi.string().max(50),
  bio:            Joi.string().max(1000).allow('', null),
  dailyLimit:     Joi.number().integer().min(1).max(50),
  workStart:      timeStr,
  workEnd:        timeStr,
  workingDays:    Joi.array().items(Joi.string().valid('Mon','Tue','Wed','Thu','Fri','Sat','Sun')).min(1).max(7),
});

exports.verifyDoctorSchema = Joi.object({
  decision:        Joi.string().valid('approved','rejected').required(),
  rejectionReason: Joi.string().max(500).when('decision',{is:'rejected',then:Joi.required()}),
});

// ── Prescription Schema ────────────────────────────────────
exports.prescriptionSchema = Joi.object({
  patientId: uuid.required(),
  medicines: Joi.array().items(Joi.object({
    name:     Joi.string().min(1).max(100).required(),
    dose:     Joi.string().max(50).required(),
    freq:     Joi.string().max(100).required(),
    duration: Joi.string().max(50).required(),
  })).min(1).required(),
  diet:      Joi.string().max(1000).allow('', null),
  lifestyle: Joi.string().max(1000).allow('', null),
  notes:     Joi.string().max(500).allow('', null),
});

// ── Feedback Schema ────────────────────────────────────────
exports.feedbackSchema = Joi.object({
  sessionId:   uuid.required(),
  rating:      Joi.number().integer().min(1).max(10).required(),
  energyLevel: Joi.string().valid('much_improved','slightly_improved','same','slightly_worse').required(),
  symptoms:    Joi.string().max(1000).allow('', null),
  comments:    Joi.string().max(500).allow('', null),
});

// ── Shop Schemas ───────────────────────────────────────────
exports.productSchema = Joi.object({
  name:        Joi.string().min(2).max(150).trim().required(),
  category:    Joi.string().max(60).required(),
  price:       Joi.number().positive().required(),
  mrp:         Joi.number().positive().required(),
  stock:       Joi.number().integer().min(0).required(),
  unit:        Joi.string().max(40).allow('', null),
  emoji:       Joi.string().max(10).allow('', null),
  description: Joi.string().max(500).allow('', null),
  tags:        Joi.array().items(Joi.string()),
  dosha:       Joi.array().items(Joi.string()),
  recommended: Joi.boolean(),
});

exports.orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    productId: uuid.required(),
    qty:       Joi.number().integer().min(1).required(),
  })).min(1).required(),
  mode:        Joi.string().valid('online','pickup').required(),
  address:     Joi.string().max(400).when('mode',{is:'online',then:Joi.required()}),
  pickupDate:  dateStr.when('mode',{is:'pickup',then:Joi.optional()}),
  pickupTime:  Joi.string().max(30).when('mode',{is:'pickup',then:Joi.optional()}),
});

// ── Announcement Schema ────────────────────────────────────
exports.announcementSchema = Joi.object({
  title:    Joi.string().min(3).max(200).trim().required(),
  message:  Joi.string().min(5).max(2000).required(),
  audience: Joi.string().valid('all','patient','doctor').required(),
  pinned:   Joi.boolean().default(false),
  notify:   Joi.boolean().default(true),
});

// ── Validation helper ──────────────────────────────────────
/**
 * Validate req.body against a Joi schema.
 * Returns { value, error } — error is an array of { field, message } or null.
 */
exports.validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly:      false,
    stripUnknown:    true,
    allowUnknown:    false,
  });
  if (!error) return { value, error: null };
  const errors = error.details.map(d => ({
    field:   d.path.join('.'),
    message: d.message.replace(/"/g, ''),
  }));
  return { value: null, error: errors };
};

/**
 * Express middleware factory — validate req.body with schema.
 * Usage:  router.post('/login', validateBody(loginSchema), ctrl.login)
 */
exports.validateBody = (schema) => (req, res, next) => {
  const { value, error } = exports.validate(schema, req.body);
  if (error) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: error });
  }
  req.body = value; // replace with sanitised/stripped value
  next();
};
