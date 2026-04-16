import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// We intercept any cached or bad terminal environment variables 
// and force it to use the correct direct Supabase connection format
let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (dbUrl.includes('postgres.vffwryvhyworvkrkagvc')) {
  dbUrl = dbUrl.replace('postgres.vffwryvhyworvkrkagvc', 'postgres');
}
if (dbUrl.includes('aws-0-ap-northeast-2.pooler.supabase.com:6543')) {
  dbUrl = dbUrl.replace('aws-0-ap-northeast-2.pooler.supabase.com:6543', 'db.vffwryvhyworvkrkagvc.supabase.co:5432');
  dbUrl = dbUrl.replace('?pgbouncer=true', '');
}

// Fallback just in case everything is completely undefined
if (!dbUrl) {
  dbUrl = "postgres://postgres:AirBookQwerty%40997@db.vffwryvhyworvkrkagvc.supabase.co:5432/postgres";
}

// Force a clean new instance with the direct URL
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
