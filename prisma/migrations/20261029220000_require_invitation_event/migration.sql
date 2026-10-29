-- T-304: every invitation must belong to an event.
-- Stop with instructions if the T-303 backfill hasn't run, instead of a bare constraint error
DO $$
DECLARE
  unlinked integer;
BEGIN
  SELECT count(*) INTO unlinked FROM "invitations" WHERE "eventId" IS NULL;
  IF unlinked > 0 THEN
    RAISE EXCEPTION '% invitation(s) have no event. Run `npm run db:backfill-wedding` first (see DEPLOYMENT.md), then deploy again.', unlinked;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "eventId" SET NOT NULL;
