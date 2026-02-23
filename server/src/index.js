const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const actionsRoutes = require('./routes/actions');
const challengesRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const photosRoutes = require('./routes/photos');
const tipsRoutes = require('./routes/tips');
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 4000;