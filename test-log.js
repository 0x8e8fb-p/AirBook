const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.searchHistory.create({
      data: {
        userId: null,
        origin: "DEL",
        destination: "BOM",
        departureDate: new Date("2024-05-15")
      }
    });
    console.log("Success!");
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run().finally(() => prisma.$disconnect());
