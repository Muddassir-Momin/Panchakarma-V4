'use strict';
const router = require('express').Router();
router.use('/reports', require('./report.routes'));
module.exports = router;
