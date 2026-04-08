'use strict';

/**
 * Standard API response helpers.
 * Every service uses these so response shape is consistent.
 */

exports.success = (res, data = null, statusCode = 200, meta = {}) => {
  const body = { success: true, ...meta };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

exports.created = (res, data, meta = {}) =>
  exports.success(res, data, 201, meta);

exports.noContent = (res) => res.status(204).end();

exports.error = (res, message, statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

exports.unauthorized = (res, message = 'Authentication required') =>
  exports.error(res, message, 401);

exports.forbidden = (res, message = 'Insufficient permissions') =>
  exports.error(res, message, 403);

exports.notFound = (res, resource = 'Resource') =>
  exports.error(res, `${resource} not found`, 404);

exports.conflict = (res, message = 'Conflict') =>
  exports.error(res, message, 409);

exports.unprocessable = (res, errors) =>
  exports.error(res, 'Validation failed', 422, errors);

exports.serverError = (res, message = 'Internal server error') =>
  exports.error(res, message, 500);

exports.tooMany = (res, message = 'Too many requests') =>
  exports.error(res, message, 429);

/**
 * Paginated response wrapper.
 * @param {Response} res
 * @param {Array}    items
 * @param {number}   total   - total record count (pre-pagination)
 * @param {number}   page
 * @param {number}   limit
 */
exports.paginated = (res, items, total, page, limit) =>
  res.status(200).json({
    success: true,
    data:    items,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
    },
  });
