'use strict';

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger       = require('../../shared/utils/logger');
const { SERVICE_PORTS } = require('../../shared/constants');

const app  = express();
const PORT = process.env.PORT || SERVICE_PORTS.GATEWAY;

// ── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-ID'],
}));

// ── Rate Limiting ──────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message:  { success: false, message: 'Too many authentication attempts. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  standardHeaders: true, legacyHeaders: false,
}));

// ── Request ID ─────────────────────────────────────────────
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2,6)}`;
  next();
});

// ── Logging ────────────────────────────────────────────────
app.use(logger.requestMiddleware);

// ── Service Registry ───────────────────────────────────────
const HOST   = process.env.SERVICE_HOST || 'localhost';
const svcUrl = (port) => `http://${HOST}:${port}`;

const services = {
  auth:         svcUrl(process.env.AUTH_PORT         || SERVICE_PORTS.AUTH),
  patient:      svcUrl(process.env.PATIENT_PORT      || SERVICE_PORTS.PATIENT),
  doctor:       svcUrl(process.env.DOCTOR_PORT       || SERVICE_PORTS.DOCTOR),
  session:      svcUrl(process.env.SESSION_PORT      || SERVICE_PORTS.SESSION),
  shop:         svcUrl(process.env.SHOP_PORT         || SERVICE_PORTS.SHOP),
  notification: svcUrl(process.env.NOTIFICATION_PORT || SERVICE_PORTS.NOTIFICATION),
  report:       svcUrl(process.env.REPORT_PORT       || SERVICE_PORTS.REPORT),
};

const proxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      logger.error(`[Gateway] Proxy error → ${target}: ${err.message}`);
      res.status(502).json({ success: false, message: 'Service temporarily unavailable. Please retry.' });
    },
  },
});

// ── Route Mapping ──────────────────────────────────────────
app.use('/api/auth',          proxy(services.auth));
app.use('/api/patients',      proxy(services.patient));
app.use('/api/doctors',       proxy(services.doctor));
app.use('/api/sessions',      proxy(services.session));
app.use('/api/shop',          proxy(services.shop));
app.use('/api/notifications', proxy(services.notification));
app.use('/api/reports',       proxy(services.report));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'healthy', service: 'api-gateway',
  timestamp: new Date().toISOString(), uptime: process.uptime(),
}));

// ── 404 ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => logger.info(`🌿 API Gateway listening on :${PORT}`));

module.exports = app;
