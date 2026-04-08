'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/session.controller');
const { authenticate, requireRole } = require('../../auth-service/src/middleware/authenticate');
const { validateBody } = require('../../../../shared/validators');
const { createSessionSchema, rescheduleSessionSchema } = require('../../../../shared/validators');

router.get ('/',                      authenticate,                                       ctrl.list);
router.get ('/capacity',              authenticate,                                       ctrl.capacity);
router.post('/',                      authenticate, requireRole('patient'),
                                      validateBody(createSessionSchema),                  ctrl.create);
router.patch('/:id/complete',         authenticate, requireRole('doctor','admin'),        ctrl.complete);
router.patch('/:id/cancel',           authenticate,                                       ctrl.cancel);
router.patch('/:id/reschedule',       authenticate, requireRole('patient','admin'),
                                      validateBody(rescheduleSessionSchema),              ctrl.reschedule);

module.exports = router;
