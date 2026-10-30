-- T-401: content for the public event page. All nullable or defaulted, so existing events are unaffected
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "colorPalette" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "dressCode" TEXT,
ADD COLUMN     "familyLines" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "hostNames" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tagline" TEXT;
