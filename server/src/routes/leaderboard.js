const express = require('express');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');

const lbRouter = express.Router();
lbRouter.use(authMiddleware);

// GET /api/leaderboard
lbRouter.get('/', async (req, res, next) => {
  try {
    const { period = 'weekly', limit = 20 } = req.query;
    let dateFilter;
    if (period === 'weekly') dateFilter = new Date(Date.now() - 7 * 86400000);
    else if (period === 'monthly') dateFilter = new Date(Date.now() - 30 * 86400000);
    const where = dateFilter ? { date: { gte: dateFilter } } : {};
    const results = await prisma.action.groupBy({
      by: ['userId'],
      where,
      _sum: { carbonSaved: true },
      _count: { id: true },
    });
    // Prisma 5 groupBy doesn't support orderBy/take — sort and slice in JS
    const sorted = results
      .sort((a, b) => (b._sum.carbonSaved || 0) - (a._sum.carbonSaved || 0))
      .slice(0, +limit);
    const userIds = sorted.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const leaderboard = sorted.map((r, i) => ({
      rank: i + 1,
      user: userMap[r.userId],
      carbonSaved: r._sum.carbonSaved || 0,
      actionsCount: r._count.id,
      isMe: r.userId === req.userId,
    }));
    const myEntry = leaderboard.find((e) => e.isMe);
    res.json({ leaderboard, myRank: myEntry?.rank || null });
  } catch (e) {
    next(e);
  }
});

module.exports = lbRouter;
