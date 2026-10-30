-- T-405: theme preset for the event page. Existing events get the default (the original look)
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'terracotta';
