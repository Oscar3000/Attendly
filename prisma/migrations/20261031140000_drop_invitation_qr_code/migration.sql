-- T-508b: QR codes are made from accessToken on read (T-503); the stored column has been empty since
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "qrCode";

