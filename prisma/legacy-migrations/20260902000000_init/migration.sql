CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "formSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Submission_formSlug_createdAt_idx" ON "Submission"("formSlug", "createdAt");
CREATE INDEX "Answer_submissionId_idx" ON "Answer"("submissionId");
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");
CREATE INDEX "Upload_answerId_idx" ON "Upload"("answerId");

ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
