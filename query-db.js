const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.searchHistory.count();
  const clickCount = await prisma.bookingClick.count();
  const searchCountClicks = await prisma.bookingClick.count({ where: { airline: "SEARCH_COUNT" }});
  console.log({
    "searchHistory rows": count,
    "bookingClick total rows": clickCount,
    "bookingClick 'SEARCH_COUNT' rows": searchCountClicks
  });
}
run().finally(() => prisma.$disconnect());
