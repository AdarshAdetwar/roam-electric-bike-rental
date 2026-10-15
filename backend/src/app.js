const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const requireAuth = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((origin) => origin.trim()) }));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', requireAuth, require('./routes/profile'));
app.use('/api/assets', requireAuth, require('./routes/assets'));
app.use('/api/rentals', requireAuth, require('./routes/rentals'));
app.use('/api/issues', requireAuth, require('./routes/issues'));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
