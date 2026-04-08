'use strict';

const isProd = process.env.NODE_ENV === 'production';

const level = (lv) => {
  const ts = new Date().toISOString();
  return isProd
    ? (msg, meta = {}) => console[lv === 'error' ? 'error' : 'log'](JSON.stringify({ ts, level: lv, msg, ...meta }))
    : (msg, meta = {}) => {
        const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
        console[lv === 'error' ? 'error' : lv === 'warn' ? 'warn' : 'log'](`${ts} [${lv.toUpperCase()}] ${msg}${extra}`);
      };
};

module.exports = {
  error: level('error'),
  warn:  level('warn'),
  info:  level('info'),
  debug: isProd ? () => {} : level('debug'),
  http:  isProd ? () => {} : level('http'),

  /** Express middleware — log every HTTP request */
  requestMiddleware: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms  = Date.now() - start;
      const lv  = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
      module.exports[lv](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
        method: req.method, url: req.originalUrl, status: res.statusCode, ms,
      });
    });
    next();
  },
};
