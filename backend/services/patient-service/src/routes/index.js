'use strict';
const router = require('express').Router();
router.use('/patients', require('./patient.routes'));
module.exports = router;
