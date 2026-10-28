import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read JSON file ${file}: ${error instanceof Error ? error.message : error}`);
  }
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fail(errors, message) {
  errors.push(message);
}

function expectString(value, name, errors) {
  if (typeof value !== 'string' || value.length === 0) fail(errors, `${name} must be a non-empty string.`);
}

function expectNumber(value, name, errors) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(errors, `${name} must be a number.`);
}

async function findLatestExport() {
  const entries = await readdir(process.cwd(), { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('data-export-')) continue;
    const full = path.join(process.cwd(), entry.name);
    const info = await stat(full);
    candidates.push({ full, mtime: info.mtimeMs });
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.full;
}

async function main() {
  const requested = argValue('--input', null);
  const outputRoot = requested ? path.resolve(requested) : await findLatestExport();
  if (!outputRoot) throw new Error('No data-export-* folder found. Run npm run data:export first or pass --input <folder>.');

  const errors = [];
  const warnings = [];
  const requiredFiles = ['manifest.json', 'forms.json', 'submissions.json', 'files.json', 'CHECKSUMS.json'];

  for (const file of requiredFiles) {
    try {
      await stat(path.join(outputRoot, file));
    } catch {
      fail(errors, `Missing required export file: ${file}`);
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));

  const manifest = await readJson(path.join(outputRoot, 'manifest.json'));
  const forms = await readJson(path.join(outputRoot, 'forms.json'));
  const submissions = await readJson(path.join(outputRoot, 'submissions.json'));
  const files = await readJson(path.join(outputRoot, 'files.json'));
  const checksums = await readJson(path.join(outputRoot, 'CHECKSUMS.json'));

  if (manifest.format !== 'forms-data-migration-bundle') fail(errors, `Unexpected manifest.format: ${manifest.format}`);
  if (manifest.formatVersion !== 1) fail(errors, `Unsupported manifest.formatVersion: ${manifest.formatVersion}`);
  if (!Array.isArray(forms)) fail(errors, 'forms.json must contain an array.');
  if (!Array.isArray(submissions)) fail(errors, 'submissions.json must contain an array.');
  if (!Array.isArray(files)) fail(errors, 'files.json must contain an array.');
  if (!manifest.counts || typeof manifest.counts !== 'object') fail(errors, 'manifest.counts is missing or invalid.');

  const formIds = new Set();
  const versionIds = new Set();
  const questionIds = new Set();
  const answerIds = new Set();
  const fileIds = new Set();
  const versionQuestionKeys = new Map();
  const sectionIds = new Set();
  const optionIds = new Set();
  const optionKeys = new Set();

  let sectionCount = 0;
  let questionCount = 0;
  let optionCount = 0;

  for (const form of forms) {
    expectString(form?.id, 'form.id', errors);
    expectString(form?.slug, `form(${form?.id}).slug`, errors);
    if (formIds.has(form.id)) fail(errors, `Duplicate form id: ${form.id}`);
    formIds.add(form.id);
    if (!Array.isArray(form.versions)) {
      fail(errors, `Form ${form.id} is missing versions array.`);
      continue;
    }

    for (const version of form.versions) {
      expectString(version?.id, `version.id for form ${form.id}`, errors);
      if (version.formId !== form.id) fail(errors, `Version ${version.id} has formId ${version.formId}, expected ${form.id}.`);
      if (versionIds.has(version.id)) fail(errors, `Duplicate formVersion id: ${version.id}`);
      versionIds.add(version.id);

      if (!Number.isInteger(version.version) || version.version < 1) fail(errors, `Version ${version.id} has invalid version number.`);

      if (!Array.isArray(version.sections)) fail(errors, `Version ${version.id} is missing sections array.`);
      else {
        for (const section of version.sections) {
          sectionCount += 1;
          expectString(section?.id, `section.id in version ${version.id}`, errors);
          if (section.versionId !== version.id) fail(errors, `Section ${section.id} has versionId ${section.versionId}, expected ${version.id}.`);
          if (sectionIds.has(section.id)) fail(errors, `Duplicate section id: ${section.id}`);
          sectionIds.add(section.id);
        }
      }

      if (!Array.isArray(version.questions)) {
        fail(errors, `Version ${version.id} is missing questions array.`);
        continue;
      }

      const keys = new Set();
      for (const question of version.questions) {
        questionCount += 1;
        expectString(question?.id, `question.id in version ${version.id}`, errors);
        expectString(question?.key, `question.key in version ${version.id}`, errors);
        if (question.versionId !== version.id) fail(errors, `Question ${question.id} has versionId ${question.versionId}, expected ${version.id}.`);
        if (!sectionIds.has(question.sectionId)) fail(errors, `Question ${question.id} references missing section ${question.sectionId}.`);
        if (questionIds.has(question.id)) fail(errors, `Duplicate question id: ${question.id}`);
        questionIds.add(question.id);
        if (keys.has(question.key)) fail(errors, `Duplicate question key '${question.key}' in formVersion ${version.id}.`);
        keys.add(question.key);
        versionQuestionKeys.set(`${version.id}:${question.key}`, question.id);

        if (!Array.isArray(question.options)) fail(errors, `Question ${question.id} is missing options array.`);
        else {
          const optionValues = new Set();
          for (const option of question.options) {
            optionCount += 1;
            expectString(option?.id, `option.id for question ${question.id}`, errors);
            if (option.questionId !== question.id) fail(errors, `Option ${option.id} has questionId ${option.questionId}, expected ${question.id}.`);
            if (optionIds.has(option.id)) fail(errors, `Duplicate option id: ${option.id}`);
            optionIds.add(option.id);
            const optionKey = `${question.id}:${String(option.value)}`;
            if (optionValues.has(optionKey)) fail(errors, `Duplicate option value '${option.value}' for question ${question.id}.`);
            optionValues.add(optionKey);
          }
        }
      }
    }
  }

  for (const submission of submissions) {
    expectString(submission?.id, 'submission.id', errors);
    if (answerIds.has(submission.id)) warnings.push(`Submission id ${submission.id} also appears in answer id namespace; IDs are scoped separately.`);
    if (!formIds.has(submission.formId)) fail(errors, `Submission ${submission.id} references missing form ${submission.formId}.`);
    if (!versionIds.has(submission.formVersionId)) fail(errors, `Submission ${submission.id} references missing formVersion ${submission.formVersionId}.`);
    if (!['DRAFT', 'SUBMITTED', 'MIGRATED', 'MIGRATION_FAILED'].includes(submission.status)) warnings.push(`Submission ${submission.id} has unrecognized status '${submission.status}'.`);
    if (!Array.isArray(submission.answers)) fail(errors, `Submission ${submission.id} is missing answers array.`);
    else {
      for (const answer of submission.answers) {
        expectString(answer?.id, 'answer.id', errors);
        if (answer.submissionId !== submission.id) fail(errors, `Answer ${answer.id} has submissionId ${answer.submissionId}, expected ${submission.id}.`);
        if (answerIds.has(answer.id)) fail(errors, `Duplicate answer id: ${answer.id}`);
        answerIds.add(answer.id);
        const question = questionIds.has(answer.questionId) ? answer.questionId : null;
        if (!question) fail(errors, `Answer ${answer.id} references missing question ${answer.questionId}.`);
        const expectedQuestion = versionQuestionKeys.get(`${submission.formVersionId}:${answer.questionKey}`);
        if (!expectedQuestion) fail(errors, `Answer ${answer.id} references questionKey '${answer.questionKey}' not found in submission version ${submission.formVersionId}.`);
        else if (expectedQuestion !== answer.questionId) fail(errors, `Answer ${answer.id} has questionId ${answer.questionId}, but questionKey '${answer.questionKey}' resolves to ${expectedQuestion}.`);

        if (!Array.isArray(answer.uploads)) fail(errors, `Answer ${answer.id} is missing uploads array.`);
        else for (const upload of answer.uploads) {
          expectString(upload?.id, 'upload.id', errors);
          if (upload.answerId !== answer.id) fail(errors, `Upload ${upload.id} has answerId ${upload.answerId}, expected ${answer.id}.`);
          if (fileIds.has(upload.id)) fail(errors, `Duplicate fileUpload id: ${upload.id}`);
          fileIds.add(upload.id);
        }
      }
    }
  }

  const filesById = new Map();
  for (const file of files) {
    expectString(file?.id, 'file.id', errors);
    if (fileIds.size && !fileIds.has(file.id)) warnings.push(`files.json contains file ${file.id} that is not referenced by a submission answer.`);
    if (filesById.has(file.id)) fail(errors, `Duplicate files.json id: ${file.id}`);
    filesById.set(file.id, file);
    expectString(file?.path, `file(${file.id}).path`, errors);
    expectString(file?.sha256, `file(${file.id}).sha256`, errors);
    if (typeof file.bytes !== 'number' || file.bytes < 0) fail(errors, `File ${file.id} has invalid byte count.`);
  }

  for (const fileId of fileIds) {
    if (!filesById.has(fileId)) fail(errors, `Referenced file ${fileId} is missing from files.json.`);
  }

  const fileRoot = path.join(outputRoot, 'files');
  for (const file of files) {
    const target = path.join(outputRoot, file.path);
    const relative = path.relative(fileRoot, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      fail(errors, `File ${file.id} has an unsafe path: ${file.path}`);
      continue;
    }
    try {
      const bytes = await readFile(target);
      if (bytes.length !== file.bytes) fail(errors, `File ${file.id} byte count mismatch: metadata=${file.bytes}, actual=${bytes.length}.`);
      const digest = sha256(bytes);
      if (digest !== file.sha256) fail(errors, `File ${file.id} checksum mismatch: metadata=${file.sha256}, actual=${digest}.`);
    } catch (error) {
      fail(errors, `File ${file.id} is missing or unreadable at ${file.path}: ${error instanceof Error ? error.message : error}`);
    }
  }

  const actualCounts = {
    forms: forms.length,
    formVersions: versionIds.size,
    sections: sectionCount,
    questions: questionCount,
    options: optionCount,
    submissions: submissions.length,
    answers: answerIds.size,
    files: files.length,
  };

  for (const [key, expected] of Object.entries(manifest.counts ?? {})) {
    if (actualCounts[key] !== expected) fail(errors, `Manifest count mismatch for ${key}: manifest=${expected}, actual=${actualCounts[key]}.`);
  }

  for (const [key, value] of Object.entries(actualCounts)) {
    if (!(key in (manifest.counts ?? {}))) warnings.push(`Manifest does not declare a count for ${key}.`);
  }

  for (const file of ['manifest.json', 'forms.json', 'submissions.json', 'files.json']) {
    const expected = checksums?.[file];
    if (!expected) {
      fail(errors, `CHECKSUMS.json is missing checksum for ${file}.`);
      continue;
    }
    const actual = sha256(await readFile(path.join(outputRoot, file)));
    if (actual !== expected) fail(errors, `Checksum mismatch for ${file}.`);
  }

  console.log(`\nMigration export validation: ${errors.length ? 'FAIL' : 'PASS'}`);
  console.log(`Bundle: ${outputRoot}`);
  console.log('\nCounts:');
  for (const [key, value] of Object.entries(actualCounts)) {
    const expected = manifest.counts?.[key];
    console.log(`  ${key.padEnd(14)} ${String(value).padStart(6)}${expected === value ? '  ✓' : `  ✗ expected ${expected}`}`);
  }

  console.log('\nIntegrity checks:');
  console.log(`  Relationships     ${errors.some((e) => /references missing|has .*Id|resolves to|Duplicate/.test(e)) ? '✗' : '✓'}`);
  console.log(`  Question keys     ${errors.some((e) => /question key|questionKey/.test(e)) ? '✗' : '✓'}`);
  console.log(`  File checksums    ${errors.some((e) => /checksum|byte count|missing or unreadable|unsafe path/.test(e)) ? '✗' : '✓'}`);
  console.log(`  Manifest checks   ${errors.some((e) => /Manifest|manifest/.test(e)) ? '✗' : '✓'}`);

  if (warnings.length) {
    console.log('\nWarnings:');
    for (const warning of warnings) console.log(`  ⚠ ${warning}`);
  }

  if (errors.length) {
    console.log('\nErrors:');
    for (const error of errors) console.log(`  ✗ ${error}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nMigration export validation: FAIL\n${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
