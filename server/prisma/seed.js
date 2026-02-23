const { PrismaClient: SeedPrisma } = require('@prisma/client');
const bcryptSeed = require('bcryptjs');
require('dotenv').config();

const seedPrisma = new SeedPrisma({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Seeding database...');
  
  // Seed challenges
  const challenges = [
    { title:'Car-Free Week', description:'Avoid using a car for 7 days straight', category:'transport', durationDays:7, targetCount:7, carbonGoal:16.8 },
    { title:'Plant-Based Month', description:'Eat plant-based meals for 30 days', category:'food', durationDays:30, targetCount:30, carbonGoal:45.0 },
    { title:'Energy Saver', description:'Reduce home energy use for 14 days', category:'energy', durationDays:14, targetCount:14, carbonGoal:16.8 },
    { title:'Zero Waste Week', description:'Produce minimal waste for 7 days', category:'waste', durationDays:7, targetCount:7, carbonGoal:3.5 },
    { title:'Water Warrior', description:'Conserve water every day for 10 days', category:'water', durationDays:10, targetCount:10, carbonGoal:8.0 },
    { title:'Cyclist of the Month', description:'Cycle to work or errands for 20 days', category:'transport', durationDays:30, targetCount:20, carbonGoal:32.0 },
  ];
  
  for (const c of challenges) {
    await seedPrisma.challenge.upsert({ where: { id: c.title }, update: c, create: c });
  }
  
  // Demo user
  const password = await bcryptSeed.hash('demo123', 12);
  await seedPrisma.user.upsert({
    where: { email: 'demo@ecotrack.app' },
    update: {},
    create: { name: 'Demo User', email: 'demo@ecotrack.app', password },
  });
  
  console.log('✅ Database seeded!');
}

main().catch(console.error).finally(() => seedPrisma.$disconnect());
