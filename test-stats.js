const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const actualSearches = await prisma.searchHistory.count();
  const inflatedSearches = await prisma.bookingClick.count({ where: { airline: "SEARCH_COUNT" } });
  const totalSearches = actualSearches + inflatedSearches;
  const savingsAgg = await prisma.bookingClick.aggregate({
    where: { airline: { not: "SEARCH_COUNT" } },
    _sum: { discountSaved: true }
  });
  console.log("Stats:", { searchesToday: totalSearches || 0, moneySavedMonth: savingsAgg._sum.discountSaved || 0 });
}
run().finally(() => prisma.$disconnect());
