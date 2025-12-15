-- CreateEnum
CREATE TYPE "rsvp_status" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'RESCINDED');

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "status" "rsvp_status" NOT NULL DEFAULT 'PENDING',
    "plusOne" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);
