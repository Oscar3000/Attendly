-- T-506: door helper check-in links, and which link admitted each check-in
-- AlterTable
ALTER TABLE "check_ins" ADD COLUMN     "doorLinkId" TEXT;

-- CreateTable
CREATE TABLE "door_links" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "door_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "door_links_tokenHash_key" ON "door_links"("tokenHash");

-- CreateIndex
CREATE INDEX "door_links_eventId_idx" ON "door_links"("eventId");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_doorLinkId_fkey" FOREIGN KEY ("doorLinkId") REFERENCES "door_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "door_links" ADD CONSTRAINT "door_links_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

