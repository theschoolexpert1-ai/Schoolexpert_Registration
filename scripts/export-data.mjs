import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { storageDownload } from './storage-client.mjs';

const prisma = new PrismaClient();

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function main() {
  const outputRoot = path.resolve(argValue('--out', `data-export-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(path.join(outputRoot, 'files'), { recursive: true });

  const [forms, submissions] = await Promise.all([
    prisma.form.findMany({
      orderBy: { id: 'asc' },
      include: {
        versions: {
          orderBy: { version: 'asc' },
          include: {
            sections: { orderBy: { position: 'asc' } },
            questions: {
              orderBy: { position: 'asc' },
              include: { options: { orderBy: { position: 'asc' } } },
            },
          },
        },
      },
    }),
    prisma.submission.findMany({
      orderBy: { id: 'asc' },
      include: {
        answers: {
          orderBy: { id: 'asc' },
          include: {
            question: { select: { id: true, versionId: true, key: true, label: true, type: true } },
            uploads: { orderBy: { id: 'asc' } },
          },
        },
      },
    }),
  ]);

  const formIds = new Set(forms.map((form) => form.id));
  const versionIds = new Set(forms.flatMap((form) => form.versions.map((version) => version.id)));
  const questionIds = new Set(forms.flatMap((form) => form.versions.flatMap((version) => version.questions.map((question) => question.id))));

  const exportedFiles = [];
  const exportSubmissions = [];

  for (const submission of submissions) {
    if (!formIds.has(submission.formId) || !versionIds.has(submission.formVersionId)) {
      throw new Error(`Submission ${submission.id} references a missing form or form version.`);
    }

    const answers = [];
    for (const answer of submission.answers) {
      if (!questionIds.has(answer.questionId) || answer.question.versionId !== submission.formVersionId) {
        throw new Error(`Answer ${answer.id} is not compatible with submission ${submission.id}'s form version.`);
      }

      const uploads = [];
      for (const upload of answer.uploads) {
        const relativePath = path.join('files', submission.id, upload.id, upload.filename || 'upload.bin');
        const target = path.join(outputRoot, relativePath);
        await mkdir(path.dirname(target), { recursive: true });
        let bytes;
        let storageSource = 'legacy-database';
        if (upload.storagePath) {
          bytes = await storageDownload(upload.storagePath);
          storageSource = 'supabase-storage';
        } else if (upload.bytes) {
          bytes = Buffer.from(upload.bytes);
        } else {
          throw new Error(`FileUpload ${upload.id} has neither storagePath nor legacy bytes.`);
        }
        await writeFile(target, bytes);
        const checksum = sha256(bytes);
        uploads.push({
          id: upload.id,
          answerId: upload.answerId,
          filename: upload.filename,
          mimeType: upload.mimeType,
          createdAt: upload.createdAt.toISOString(),
          path: relativePath.split(path.sep).join('/'),
          bytes: bytes.length,
          sha256: checksum,
          storagePath: upload.storagePath ?? null,
          storageSource,
        });
        exportedFiles.push({ id: upload.id, path: relativePath.split(path.sep).join('/'), bytes: bytes.length, sha256: checksum, storagePath: upload.storagePath ?? null, storageSource });
      }

      answers.push({
        id: answer.id,
        submissionId: answer.submissionId,
        questionId: answer.questionId,
        questionKey: answer.question.key,
        questionLabel: answer.question.label,
        questionType: answer.question.type,
        value: answer.value,
        uploads,
      });
    }

    exportSubmissions.push({
      id: submission.id,
      formId: submission.formId,
      formVersionId: submission.formVersionId,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      migratedAt: submission.migratedAt?.toISOString() ?? null,
      migrationError: submission.migrationError,
      answers,
    });
  }

  const exportForms = forms.map((form) => ({
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    currentVersion: form.currentVersion,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
    versions: form.versions.map((version) => ({
      id: version.id,
      formId: version.formId,
      version: version.version,
      title: version.title,
      description: version.description,
      createdAt: version.createdAt.toISOString(),
      sections: version.sections.map((section) => ({
        id: section.id,
        versionId: section.versionId,
        title: section.title,
        position: section.position,
      })),
      questions: version.questions.map((question) => ({
        id: question.id,
        versionId: question.versionId,
        sectionId: question.sectionId,
        key: question.key,
        label: question.label,
        type: question.type,
        required: question.required,
        allowOther: question.allowOther,
        validation: question.validation,
        position: question.position,
        options: question.options.map((option) => ({
          id: option.id,
          questionId: option.questionId,
          value: option.value,
          position: option.position,
        })),
      })),
    })),
  }));

  const manifest = {
    format: 'forms-data-migration-bundle',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    source: 'Supabase PostgreSQL via Prisma',
    counts: {
      forms: forms.length,
      formVersions: forms.reduce((n, form) => n + form.versions.length, 0),
      sections: forms.reduce((n, form) => n + form.versions.reduce((m, version) => m + version.sections.length, 0), 0),
      questions: forms.reduce((n, form) => n + form.versions.reduce((m, version) => m + version.questions.length, 0), 0),
      options: forms.reduce((n, form) => n + form.versions.reduce((m, version) => m + version.questions.reduce((q, question) => q + question.options.length, 0), 0), 0),
      submissions: exportSubmissions.length,
      answers: exportSubmissions.reduce((n, submission) => n + submission.answers.length, 0),
      files: exportedFiles.length,
    },
    identifiers: {
      formId: 'stable',
      formVersionId: 'stable',
      questionId: 'stable',
      questionKey: 'stable-semantic-key',
      submissionId: 'stable',
      answerId: 'stable',
      fileUploadId: 'stable',
    },
  };

  await writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(outputRoot, 'forms.json'), JSON.stringify(exportForms, null, 2));
  await writeFile(path.join(outputRoot, 'submissions.json'), JSON.stringify(exportSubmissions, null, 2));
  await writeFile(path.join(outputRoot, 'files.json'), JSON.stringify(exportedFiles, null, 2));

  const checksums = {};
  for (const file of ['manifest.json', 'forms.json', 'submissions.json', 'files.json']) {
    const bytes = await readFile(path.join(outputRoot, file));
    checksums[file] = sha256(bytes);
  }
  await writeFile(path.join(outputRoot, 'CHECKSUMS.json'), JSON.stringify(checksums, null, 2));

  console.log(`Export complete: ${outputRoot}`);
  console.log(JSON.stringify(manifest.counts, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
