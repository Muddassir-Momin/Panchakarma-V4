'use strict';
const router = require('express').Router();
router.use('/doctors', require('./doctor.routes'));
module.exports = router;
