ALTER TABLE "FileUpload" ADD COLUMN "storagePath" TEXT;
ALTER TABLE "FileUpload" ADD COLUMN "size" INTEGER;
ALTER TABLE "FileUpload" ALTER COLUMN "bytes" DROP NOT NULL;
CREATE UNIQUE INDEX "FileUpload_storagePath_key" ON "FileUpload"("storagePath");
