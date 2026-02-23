const express = require('express');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');

const challengesRouter = express.Router();
challengesRouter.use(authMiddleware);

// GET /api/challenges
challengesRouter.get('/', async (req, res, next) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    const userChallenges = await prisma.userChallenge.findMany({ where: { userId: req.userId } });
    const ucMap = Object.fromEntries(userChallenges.map((uc) => [uc.challengeId, uc]));
    res.json(
      challenges.map((c) => ({
        ...c,
        userChallenge: ucMap[c.id] || null,
        participantCount: 0, // could JOIN participants for real count
      })),
    );
  } catch (e) {
    next(e);
  }
});

// POST /api/challenges/:id/join
challengesRouter.post('/:id/join', async (req, res, next) => {
  try {
    const existing = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId: req.userId, challengeId: req.params.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already joined' });
    const uc = await prisma.userChallenge.create({
      data: { userId: req.userId, challengeId: req.params.id },
    });
    res.status(201).json(uc);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/challenges/:id/progress
challengesRouter.patch('/:id/progress', async (req, res, next) => {
  try {
    const uc = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId: req.userId, challengeId: req.params.id } },
      include: { challenge: true },
    });
    if (!uc) return res.status(404).json({ error: 'Not in challenge' });
    const newProgress = Math.min(uc.progress + 1, uc.challenge.targetCount);
    const updated = await prisma.userChallenge.update({
      where: { id: uc.id },
      data: { progress: newProgress, completed: newProgress >= uc.challenge.targetCount },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

module.exports = challengesRouter;
