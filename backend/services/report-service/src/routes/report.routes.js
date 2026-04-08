'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/report.controller');
const { authenticate, requireRole } = require('../../auth-service/src/middleware/authenticate');

router.get('/admin',   authenticate, requireRole('admin'),   ctrl.adminReport);
router.get('/doctor',  authenticate, requireRole('doctor'),  ctrl.doctorReport);
router.get('/patient', authenticate, requireRole('patient'), ctrl.patientReport);

module.exports = router;
