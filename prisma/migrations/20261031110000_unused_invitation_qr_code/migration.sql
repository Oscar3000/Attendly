-- T-503: QR codes are now made from the invitation's accessToken when read, not stored. The
-- stored codes point at the old /invite/[id] pages, so clear them. The column stays (nullable)
-- so the previous release still runs after a rollback; T-508 drops it
ALTER TABLE "invitations" ALTER COLUMN "qrCode" DROP NOT NULL;
UPDATE "invitations" SET "qrCode" = NULL;
