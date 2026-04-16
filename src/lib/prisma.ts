import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// When deployed to Vercel, we MUST rely entirely on Vercel's Environment Variables.
// Vercel serverless functions will use DATABASE_URL (the connection pooler) to prevent 
// exhausting your Supabase database connections.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
