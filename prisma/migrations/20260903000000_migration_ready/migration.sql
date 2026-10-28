CREATE TYPE "QuestionType" AS ENUM ('text', 'textarea', 'select', 'radio', 'checkbox', 'file');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MIGRATED', 'MIGRATION_FAILED');

CREATE TABLE "Form" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "currentVersion" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

CREATE TABLE "FormVersion" (
  "id" TEXT NOT NULL, "formId" TEXT NOT NULL, "version" INTEGER NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FormVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FormVersion_formId_version_key" ON "FormVersion"("formId", "version");
CREATE INDEX "FormVersion_formId_version_idx" ON "FormVersion"("formId", "version");

CREATE TABLE "FormSection" (
  "id" TEXT NOT NULL, "versionId" TEXT NOT NULL, "title" TEXT NOT NULL, "position" INTEGER NOT NULL,
  CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FormSection_versionId_position_key" ON "FormSection"("versionId", "position");
CREATE INDEX "FormSection_versionId_idx" ON "FormSection"("versionId");

CREATE TABLE "FormQuestion" (
  "id" TEXT NOT NULL, "versionId" TEXT NOT NULL, "sectionId" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL,
  "type" "QuestionType" NOT NULL, "required" BOOLEAN NOT NULL DEFAULT false, "allowOther" BOOLEAN NOT NULL DEFAULT false,
  "validation" TEXT, "position" INTEGER NOT NULL, CONSTRAINT "FormQuestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FormQuestion_versionId_key_key" ON "FormQuestion"("versionId", "key");
CREATE UNIQUE INDEX "FormQuestion_sectionId_position_key" ON "FormQuestion"("sectionId", "position");
CREATE INDEX "FormQuestion_versionId_idx" ON "FormQuestion"("versionId");
CREATE INDEX "FormQuestion_sectionId_idx" ON "FormQuestion"("sectionId");

CREATE TABLE "FormQuestionOption" (
  "id" TEXT NOT NULL, "questionId" TEXT NOT NULL, "value" TEXT NOT NULL, "position" INTEGER NOT NULL,
  CONSTRAINT "FormQuestionOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FormQuestionOption_questionId_value_key" ON "FormQuestionOption"("questionId", "value");
CREATE UNIQUE INDEX "FormQuestionOption_questionId_position_key" ON "FormQuestionOption"("questionId", "position");

CREATE TABLE "Submission" (
  "id" TEXT NOT NULL, "formId" TEXT NOT NULL, "formVersionId" TEXT NOT NULL, "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3), "migratedAt" TIMESTAMP(3), "migrationError" TEXT,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Submission_formId_createdAt_idx" ON "Submission"("formId", "createdAt");
CREATE INDEX "Submission_formVersionId_createdAt_idx" ON "Submission"("formVersionId", "createdAt");
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

CREATE TABLE "Answer" (
  "id" TEXT NOT NULL, "submissionId" TEXT NOT NULL, "questionId" TEXT NOT NULL, "value" JSONB NOT NULL,
  CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Answer_submissionId_questionId_key" ON "Answer"("submissionId", "questionId");
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

CREATE TABLE "FileUpload" (
  "id" TEXT NOT NULL, "answerId" TEXT NOT NULL, "filename" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FileUpload_answerId_idx" ON "FileUpload"("answerId");

ALTER TABLE "FormVersion" ADD CONSTRAINT "FormVersion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormQuestion" ADD CONSTRAINT "FormQuestion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormQuestion" ADD CONSTRAINT "FormQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormQuestionOption" ADD CONSTRAINT "FormQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
