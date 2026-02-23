async function calculateStreak(userId) {
  const actions = await prisma.action.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });
  if (!actions.length) return 0;
  const daySet = new Set(actions.map(a => new Date(a.date).toDateString()));
  let streak = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (daySet.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}