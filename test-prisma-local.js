const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log("Prisma datasource url is:", prisma._engineConfig?.env?.DATABASE_URL || "unknown");
