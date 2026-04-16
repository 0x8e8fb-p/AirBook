const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const queries = [
    `ALTER TABLE "SearchHistory" ADD COLUMN IF NOT EXISTS "returnDate" TIMESTAMP(3);`,
    `ALTER TABLE "SearchHistory" ADD COLUMN IF NOT EXISTS "passengers" INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE "SearchHistory" ADD COLUMN IF NOT EXISTS "adults" INTEGER DEFAULT 1;`,
    `ALTER TABLE "SearchHistory" ADD COLUMN IF NOT EXISTS "cabinClass" TEXT;`,
    `ALTER TABLE "SearchHistory" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE "SearchHistory" ALTER COLUMN "userId" DROP NOT NULL;`
  ];
  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log("Success:", q);
    } catch(e) { console.error("Error:", q, e.message); }
  }
}
run().finally(() => prisma.$disconnect());
