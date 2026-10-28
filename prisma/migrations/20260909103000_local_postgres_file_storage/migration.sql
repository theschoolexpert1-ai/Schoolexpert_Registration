-- File uploads are stored directly in PostgreSQL for the local/self-hosted setup.
-- The previous migration added storagePath for an external object-storage option.
-- This migration removes that unused integration and makes the file payload required.

DROP INDEX IF EXISTS "FileUpload_storagePath_key";
ALTER TABLE "FileUpload" DROP COLUMN IF EXISTS "storagePath";
ALTER TABLE "FileUpload" ALTER COLUMN "bytes" SET NOT NULL;
ALTER TABLE "FileUpload" ALTER COLUMN "size" SET NOT NULL;
