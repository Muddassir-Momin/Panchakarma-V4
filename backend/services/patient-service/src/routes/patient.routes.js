'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/patient.controller');
const { authenticate, requireRole } = require('../../../auth-service/src/middleware/authenticate');
const { validateBody } = require('../../../../shared/validators');
const { addPatientSchema, patientUpdateSchema } = require('../../../../shared/validators');

const DOCTOR_ADMIN = ['doctor','admin'];

router.get ('/',                    authenticate, requireRole(...DOCTOR_ADMIN), ctrl.list);
router.get ('/check-duplicate',     authenticate, requireRole(...DOCTOR_ADMIN), ctrl.checkDuplicate);
router.get ('/:id',                 authenticate,                               ctrl.getOne);
router.get ('/:id/stats',           authenticate,                               ctrl.stats);
router.post('/',                    authenticate, requireRole(...DOCTOR_ADMIN),
                                    validateBody(addPatientSchema),             ctrl.create);
router.put ('/:id',                 authenticate, validateBody(patientUpdateSchema), ctrl.update);

module.exports = router;
