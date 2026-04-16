-- Alter User table
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "mobile" TEXT;
ALTER TABLE "User" ADD COLUMN "dob" TIMESTAMP(3);

-- Add unique constraints
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- Alter SearchHistory table
ALTER TABLE "SearchHistory" ADD COLUMN "adults" INTEGER DEFAULT 1;
ALTER TABLE "SearchHistory" ADD COLUMN "cabinClass" TEXT;
