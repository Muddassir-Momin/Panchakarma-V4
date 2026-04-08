'use strict';
const router = require('express').Router();
router.use('/shop', require('./shop.routes'));
module.exports = router;
