-- T-312d: drop the legacy invitation date/venue columns (the event holds them since T-304).
-- Safe only once T-312c (which stopped writing them) has been live: until its container is
-- replaced, the previous release still writes these columns. If T-312c's migration ran moments
-- ago (both in one deploy) on a database with invitations, stop and ask for two deploys.
-- Fresh databases (CI, a new dev setup) have no invitations and pass straight through
DO $$
DECLARE
  previous_finished timestamptz;
BEGIN
  SELECT finished_at INTO previous_finished FROM "_prisma_migrations"
  WHERE migration_name = '20261030090000_make_legacy_invitation_columns_nullable';

  IF EXISTS (SELECT 1 FROM "invitations")
     AND previous_finished > now() - interval '10 minutes' THEN
    RAISE EXCEPTION 'T-312d must deploy after T-312c is live: T-312c''s migration finished at %. Redeploy in 10 minutes.', previous_finished;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "eventDate",
DROP COLUMN "venue";
