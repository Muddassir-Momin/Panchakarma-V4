'use strict';

const { Op }  = require('sequelize');
const db      = require('../models');
const R       = require('../../../../shared/utils/response');
const { parsePagination } = require('../../../../shared/utils/pagination');
const { generatePickupCode } = require('../../../../shared/utils/patientCode');
const { ROLES, ORDER_STATUS, ORDER_MODE } = require('../../../../shared/constants');
const logger  = require('../../../../shared/utils/logger');

// ── GET /api/shop/products ────────────────────────────────
exports.listProducts = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req, { page: 1, limit: 24 });
    const where = { isActive: true };
    if (req.query.category) where.category = req.query.category;
    if (req.query.doctorId)  where.doctorId = req.query.doctorId;
    if (req.query.q) where.name = { [Op.like]: `%${req.query.q}%` };

    const { count, rows } = await db.Product.findAndCountAll({
      where, limit, offset, order: [['recommended','DESC'],['createdAt','DESC']],
    });
    return R.paginated(res, rows, count, page, limit);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/shop/products ───────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== ROLES.DOCTOR && req.user.role !== ROLES.ADMIN)
      return R.forbidden(res);
    const product = await db.Product.create({ ...req.body, doctorId: req.user.id });
    return R.created(res, product);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PUT /api/shop/products/:id ───────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product = await db.Product.findByPk(req.params.id);
    if (!product) return R.notFound(res, 'Product');
    if (product.doctorId !== req.user.id && req.user.role !== ROLES.ADMIN)
      return R.forbidden(res);
    await product.update(req.body);
    return R.success(res, product);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── POST /api/shop/orders ─────────────────────────────────
exports.createOrder = async (req, res) => {
  if (req.user.role !== ROLES.PATIENT) return R.forbidden(res, 'Only patients can place orders.');

  const t = await db.sequelize.transaction();
  try {
    const { items, mode, address, pickupDate, pickupTime } = req.body;

    // ── 1. Validate all products and reserve stock inside transaction ──
    let total = 0;
    const enriched = [];

    for (const item of items) {
      // Lock the row for update to prevent concurrent overselling
      const product = await db.Product.findOne({
        where: { id: item.productId, isActive: true },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!product) {
        await t.rollback();
        return R.error(res, `Product not found: ${item.productId}`);
      }
      if (product.stock < item.qty) {
        await t.rollback();
        return R.error(res, `Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }
      enriched.push({ product, qty: item.qty });
      total += product.price * item.qty;
    }

    // ── 2. Deduct stock atomically ─────────────────────────────────────
    for (const { product, qty } of enriched) {
      await product.decrement('stock', { by: qty, transaction: t });
    }

    // ── 3. Generate pickup code (collision-resistant) ──────────────────
    let pickupCode = null;
    if (mode === ORDER_MODE.PICKUP) {
      // Ensure unique code
      let attempts = 0;
      do {
        pickupCode = generatePickupCode();
        const exists = await db.Order.findOne({ where: { pickupCode }, transaction: t });
        if (!exists) break;
      } while (++attempts < 10);
      if (attempts === 10) throw new Error('Could not generate unique pickup code.');
    }

    // ── 4. Create order ────────────────────────────────────────────────
    const order = await db.Order.create({
      patientId: req.user.id,
      mode, total, pickupCode,
      address:           mode === ORDER_MODE.ONLINE ? address : null,
      pickupDate:        mode === ORDER_MODE.PICKUP ? pickupDate : null,
      pickupTime:        mode === ORDER_MODE.PICKUP ? pickupTime : null,
      estimatedDelivery: mode === ORDER_MODE.ONLINE
        ? new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        : null,
      status: ORDER_STATUS.PROCESSING,
      placedAt: new Date(),
    }, { transaction: t });

    await db.OrderItem.bulkCreate(
      enriched.map(({ product, qty }) => ({
        orderId: order.id, productId: product.id, qty, unitPrice: product.price,
      })),
      { transaction: t }
    );

    // Notification
    await db.Notification.create({
      userId: req.user.id, type: 'system', priority: 'normal', read: false,
      title:   mode === ORDER_MODE.PICKUP
        ? `🏪 Pickup Order Ready — Code: ${pickupCode}`
        : '✅ Order Placed Successfully',
      message: mode === ORDER_MODE.PICKUP
        ? `Show code ${pickupCode} at our pharmacy counter to collect your order.`
        : `Your order of ₹${total.toLocaleString()} has been placed and will be delivered in 3 days.`,
    }, { transaction: t });

    await t.commit();
    logger.info(`[Shop] Order ${order.id} placed by patient ${req.user.id}, total ₹${total}`);
    return R.created(res, order);
  } catch (err) {
    await t.rollback();
    logger.error('[Shop] create order error', { error: err.message });
    return R.serverError(res);
  }
};

// ── GET /api/shop/orders ──────────────────────────────────
exports.listOrders = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const where = {};
    if (req.user.role === ROLES.PATIENT) where.patientId = req.user.id;
    if (req.query.status) where.status = req.query.status;

    const { count, rows } = await db.Order.findAndCountAll({
      where, limit, offset,
      order: [['createdAt','DESC']],
      include: [{
        model: db.OrderItem, as: 'items',
        include: [{ model: db.Product, as: 'product', attributes: ['id','name','emoji','category'] }],
      }],
    });
    return R.paginated(res, rows, count, page, limit);
  } catch (err) {
    return R.serverError(res);
  }
};

// ── PATCH /api/shop/orders/:id/status ────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await db.Order.findByPk(req.params.id);
    if (!order) return R.notFound(res, 'Order');
    if (req.user.role === ROLES.PATIENT) return R.forbidden(res);

    const { status } = req.body;
    if (!Object.values(ORDER_STATUS).includes(status))
      return R.error(res, 'Invalid status value.');

    order.status = status;
    await order.save();
    return R.success(res, order);
  } catch (err) {
    return R.serverError(res);
  }
};
