'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/shop.controller');
const { authenticate, requireRole } = require('../../auth-service/src/middleware/authenticate');
const { validateBody } = require('../../../../shared/validators');
const { productSchema, orderSchema } = require('../../../../shared/validators');

// Products
router.get ('/products',            authenticate,                                         ctrl.listProducts);
router.post('/products',            authenticate, requireRole('doctor','admin'),
                                    validateBody(productSchema),                          ctrl.createProduct);
router.put ('/products/:id',        authenticate, requireRole('doctor','admin'),
                                    validateBody(productSchema),                          ctrl.updateProduct);

// Orders
router.get ('/orders',              authenticate,                                         ctrl.listOrders);
router.post('/orders',              authenticate, requireRole('patient'),
                                    validateBody(orderSchema),                            ctrl.createOrder);
router.patch('/orders/:id/status',  authenticate, requireRole('doctor','admin'),          ctrl.updateOrderStatus);

module.exports = router;
