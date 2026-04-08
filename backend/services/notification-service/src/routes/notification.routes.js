'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/notification.controller');
const { authenticate, requireRole } = require('../../auth-service/src/middleware/authenticate');

router.get ('/read-all',    authenticate,                               ctrl.markAllRead);
router.get ('/',            authenticate,                               ctrl.list);
router.post('/',            authenticate, requireRole('admin','doctor'), ctrl.send);
router.post('/broadcast',   authenticate, requireRole('admin'),          ctrl.broadcast);
router.patch('/:id/read',   authenticate,                               ctrl.markRead);

module.exports = router;
