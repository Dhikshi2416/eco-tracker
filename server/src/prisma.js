const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Single shared Prisma client instance for the whole server
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;

