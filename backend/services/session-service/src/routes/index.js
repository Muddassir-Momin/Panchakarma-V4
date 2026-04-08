'use strict';
const router = require('express').Router();
router.use('/sessions', require('./session.routes'));
module.exports = router;
