const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:AirBookQwerty%40997@db.vffwryvhyworvkrkagvc.supabase.co:5432/postgres"
    }
  }
});
async function test() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Success:", user);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();