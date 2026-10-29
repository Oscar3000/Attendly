-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "eventId" TEXT;

-- CreateIndex
CREATE INDEX "invitations_eventId_idx" ON "invitations"("eventId");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

