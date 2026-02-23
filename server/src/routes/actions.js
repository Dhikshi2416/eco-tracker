const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');
const { calculateCO2 } = require('../services/carbonCalculator');

const actionsRouter = express.Router();
actionsRouter.use(authMiddleware);

const actionSchema = z.object({
  category: z.enum(['transport', 'food', 'energy', 'waste', 'water']),
  type: z.string().min(1),
  description: z.string().optional(),
  date: z.string().optional(),
  photoId: z.string().optional(),
});

// GET /api/actions — list user actions with optional filters
actionsRouter.get('/', async (req, res, next) => {
  try {
    const { category, period, limit = 50, offset = 0 } = req.query;
    const where = { userId: req.userId };
    if (category) where.category = category;
    if (period === 'week') where.date = { gte: new Date(Date.now() - 7 * 86400000) };
    if (period === 'month') where.date = { gte: new Date(Date.now() - 30 * 86400000) };
    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where,
        orderBy: { date: 'desc' },
        take: +limit,
        skip: +offset,
        include: { photo: true },
      }),
      prisma.action.count({ where }),
    ]);
    res.json({ actions, total, hasMore: +offset + +limit < total });
  } catch (e) {
    next(e);
  }
});

// GET /api/actions/stats — aggregated stats
actionsRouter.get('/stats', async (req, res, next) => {
  try {
    const actions = await prisma.action.findMany({ where: { userId: req.userId } });
    const totalCo2 = actions.reduce((s, a) => s + a.carbonSaved, 0);
    const totalActions = actions.length;
    // Streak calculation
    const daySet = new Set(actions.map((a) => new Date(a.date).toDateString()));
    let streak = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    while (daySet.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    // Weekly
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weekActions = actions.filter((a) => new Date(a.date) >= weekAgo);
    const weekCo2 = weekActions.reduce((s, a) => s + a.carbonSaved, 0);
    // Category breakdown
    const cats = {};
    actions.forEach((a) => {
      cats[a.category] = (cats[a.category] || 0) + a.carbonSaved;
    });
    res.json({ totalCo2, totalActions, streak, weekCo2, weekActions: weekActions.length, categories: cats });
  } catch (e) {
    next(e);
  }
});

// POST /api/actions — log new action
actionsRouter.post('/', async (req, res, next) => {
  try {
    const data = actionSchema.parse(req.body);
    const carbonSaved = calculateCO2(data.category, data.type);
    const action = await prisma.action.create({
      data: {
        userId: req.userId,
        category: data.category,
        type: data.type,
        description: data.description,
        carbonSaved,
        date: data.date ? new Date(data.date) : new Date(),
        photoId: data.photoId,
      },
      include: { photo: true },
    });
    // Update challenge progress
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId: req.userId, completed: false },
      include: { challenge: true },
    });
    for (const uc of userChallenges) {
      if (uc.challenge.category === data.category) {
        const newProgress = Math.min(uc.progress + 1, uc.challenge.targetCount);
        await prisma.userChallenge.update({
          where: { id: uc.id },
          data: {
            progress: newProgress,
            completed: newProgress >= uc.challenge.targetCount,
            completedAt: newProgress >= uc.challenge.targetCount ? new Date() : undefined,
          },
        });
      }
    }
    res.status(201).json(action);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/actions/:id
actionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const action = await prisma.action.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!action) return res.status(404).json({ error: 'Not found' });
    await prisma.action.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = actionsRouter;
