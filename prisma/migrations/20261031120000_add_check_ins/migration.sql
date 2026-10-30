-- T-504: door check-in. admittedCount is how many people an invitation has let in so far;
-- check_ins records each admission (how many, when, by whom)
-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "admittedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "checkedInByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "check_ins_invitationId_createdAt_idx" ON "check_ins"("invitationId", "createdAt");

-- CreateIndex
CREATE INDEX "check_ins_eventId_createdAt_idx" ON "check_ins"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checkedInByUserId_fkey" FOREIGN KEY ("checkedInByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

