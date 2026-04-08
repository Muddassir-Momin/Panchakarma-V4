'use strict';
require('dotenv').config();
const { Sequelize } = require('sequelize');
const cfg    = require('../config/db.config');
const define = require('../../../../shared/models');
const logger = require('../../../../shared/utils/logger');

const sequelize = new Sequelize(cfg.DB_NAME, cfg.DB_USER, cfg.DB_PASS, {
  host:    cfg.DB_HOST,
  port:    cfg.DB_PORT,
  dialect: cfg.DB_DIALECT || 'mysql',
  logging: cfg.DB_LOGGING ? (m) => logger.debug(m) : false,
  pool:    { max: 10, min: 2, acquire: 30000, idle: 10000 },
  define:  { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
});

module.exports = define(sequelize);
