-- T-501: a secret per invitation for the guest's ticket link
ALTER TABLE "invitations" ADD COLUMN "accessToken" TEXT;

-- Backfill existing invitations with 32 random bytes as base64url, the format the app generates.
-- gen_random_uuid() is cryptographically random and built in (no pgcrypto); two of them give
-- 32 bytes, of which 244 bits are random (each UUID fixes 6 version and variant bits)
UPDATE "invitations"
SET "accessToken" = rtrim(
  translate(
    encode(
      decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex'),
      'base64'
    ),
    '+/', '-_'
  ),
  '='
);

ALTER TABLE "invitations" ALTER COLUMN "accessToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invitations_accessToken_key" ON "invitations"("accessToken");
