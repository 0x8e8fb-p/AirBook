-- Drop NOT NULL constraint on SearchHistory userId
ALTER TABLE "SearchHistory" ALTER COLUMN "userId" DROP NOT NULL;

-- Create BookingClick table
CREATE TABLE "BookingClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "route" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discountSaved" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingClick_pkey" PRIMARY KEY ("id")
);
