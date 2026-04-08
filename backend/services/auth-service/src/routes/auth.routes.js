'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { validateBody }  = require('../../../../shared/validators');
const {
  loginSchema, signupSchema,
  changePasswordSchema,
} = require('../../../../shared/validators');

router.post('/signup',          validateBody(signupSchema),         ctrl.signup);
router.post('/login',           validateBody(loginSchema),          ctrl.login);
router.get ('/me',              authenticate,                       ctrl.me);
router.post('/change-password', authenticate,
                                validateBody(changePasswordSchema), ctrl.changePassword);
router.post('/forgot-password',                                     ctrl.forgotPassword);

module.exports = router;
