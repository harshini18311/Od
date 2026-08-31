import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// and provide a single shared instance for production to prevent connection exhaustion.
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
