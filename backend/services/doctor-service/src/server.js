'use strict';
require('dotenv').config();
const app    = require('./app');
const db     = require('./models');
const logger = require('../../../shared/utils/logger');
const PORT   = process.env.PORT || 4003;
db.sequelize.authenticate()
  .then(() => db.sequelize.sync({ alter: process.env.NODE_ENV !== 'production' }))
  .then(() => app.listen(PORT, () => logger.info('Doctor Service :' + PORT)))
  .catch(err => { logger.error('DB connect failed', { error: err.message }); process.exit(1); });
