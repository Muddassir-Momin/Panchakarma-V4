'use strict';
module.exports = {
  DB_NAME:    process.env.DB_NAME    || 'panchakarma_db',
  DB_USER:    process.env.DB_USER    || 'root',
  DB_PASS:    process.env.DB_PASS    || '',
  DB_HOST:    process.env.DB_HOST    || 'localhost',
  DB_PORT:    parseInt(process.env.DB_PORT) || 3306,
  DB_DIALECT: process.env.DB_DIALECT || 'mysql',
  DB_LOGGING: process.env.NODE_ENV !== 'production',
};
