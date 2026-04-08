'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/doctor.controller');
const { authenticate, requireRole } = require('../../auth-service/src/middleware/authenticate');
const { validateBody } = require('../../../../shared/validators');
const { doctorUpdateSchema, verifyDoctorSchema } = require('../../../../shared/validators');

router.get ('/',            authenticate, requireRole('admin'),          ctrl.list);
router.get ('/:id',         authenticate,                                 ctrl.getOne);
router.get ('/:id/capacity',authenticate,                                 ctrl.capacity);
router.put ('/:id',         authenticate, validateBody(doctorUpdateSchema), ctrl.update);
router.post('/:id/verify',  authenticate, requireRole('admin'),
                            validateBody(verifyDoctorSchema),             ctrl.verify);

module.exports = router;
