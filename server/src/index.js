// server/src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const actionsRoutes = require('./routes/actions');
const challengesRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const photosRoutes = require('./routes/photos');
const tipsRoutes = require('./routes/tips');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/actions',     actionsRoutes);
app.use('/api/challenges',  challengesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/photos',      photosRoutes);
app.use('/api/tips',        tipsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

function listenWithFallback(startPort, maxAttempts = 10) {
  let attempts = 0;

  const tryListen = (port) => {
    const server = app.listen(port);

    server.on('listening', () => {
      console.log(`🌿 EcoTrack server running on http://localhost:${port}`);
      startScheduler();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempts < maxAttempts) {
        attempts += 1;
        const nextPort = port + 1;
        console.error(`Port ${port} is already in use. Trying ${nextPort}...`);
        return tryListen(nextPort);
      }
      console.error('Server failed to start:', err.message);
      process.exit(1);
    });
  };

  tryListen(startPort);
}

listenWithFallback(PORT);

module.exports = app;