'use strict';

/**
 * Parse pagination query params from Express request.
 * Usage:  const { page, limit, offset } = parsePagination(req);
 */
exports.parsePagination = (req, defaults = { page: 1, limit: 20 }) => {
  const page  = Math.max(1, parseInt(req.query.page)  || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaults.limit));
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * Parse sort query params.
 * Allowed: ?sort=name&order=asc  →  { field: 'name', direction: 'ASC' }
 */
exports.parseSort = (req, allowedFields = [], defaultField = 'createdAt') => {
  const field     = allowedFields.includes(req.query.sort) ? req.query.sort : defaultField;
  const direction = req.query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return { field, direction };
};
