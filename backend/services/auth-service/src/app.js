'use strict';

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const logger     = require('../../../shared/utils/logger');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true })); // Gateway handles external CORS
app.use(express.json({ limit: '1mb' }));
app.use(logger.requestMiddleware);

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Health ─────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// ── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
