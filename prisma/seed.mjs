import { PrismaClient } from "@prisma/client";
import definitions from "../src/data/form-definitions.json" with { type: "json" };

const db = new PrismaClient();
const VALID_TYPES = new Set(["text", "textarea", "select", "radio", "checkbox", "file"]);

function questionType(type) {
  if (!VALID_TYPES.has(type)) throw new Error(`Unsupported question type "${type}" in form definitions.`);
  return type;
}

function definitionQuestions(form) {
  return form.sections.flatMap((section) =>
    section.fields.map((field) => ({
      sourceId: field.id,
      key: field.key,
      sectionSourceId: section.id,
      sectionPosition: section.order,
      label: field.label,
      type: questionType(field.type),
      required: Boolean(field.required),
      allowOther: Boolean(field.allowOther),
      validation: field.validation ?? null,
      position: field.order,
      options: (field.options ?? []).map((value, index) => ({ value, position: index + 1 })),
    }))
  );
}

function sameArray(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function versionMatchesDefinition(version, form) {
  const desiredSections = [...form.sections].sort((a, b) => a.order - b.order);
  const actualSections = [...version.sections].sort((a, b) => a.position - b.position);
  if (desiredSections.length !== actualSections.length) return false;

  const sectionByPosition = new Map(actualSections.map((section) => [section.position, section]));
  for (const desired of desiredSections) {
    const actual = sectionByPosition.get(desired.order);
    if (!actual || actual.title !== desired.title) return false;
  }

  const desiredQuestions = definitionQuestions(form);
  if (desiredQuestions.length !== version.questions.length) return false;
  const questionsByKey = new Map(version.questions.map((question) => [question.key, question]));

  for (const desired of desiredQuestions) {
    const actual = questionsByKey.get(desired.key);
    const actualSection = actual ? actual.section : null;
    if (!actual || !actualSection) return false;
    if (actual.label !== desired.label || actual.type !== desired.type || actual.required !== desired.required || actual.allowOther !== desired.allowOther || actual.validation !== desired.validation || actual.position !== desired.position || actualSection.position !== desired.sectionPosition) return false;
    const actualOptions = [...actual.options].sort((a, b) => a.position - b.position).map((option) => option.value);
    const desiredOptions = desired.options.map((option) => option.value);
    if (!sameArray(actualOptions, desiredOptions)) return false;
  }
  return true;
}

function idsFor(form, version, sectionSourceId, questionSourceId) {
  if (version === 1) return {
    sectionId: sectionSourceId,
    questionId: questionSourceId,
  };
  return {
    sectionId: `${form.id}-v${version}-section-${sectionSourceId}`,
    questionId: `${form.id}-v${version}-question-${questionSourceId}`,
  };
}

async function createVersion(form, versionNumber) {
  const versionId = `${form.id}-v${versionNumber}`;
  const sections = form.sections.map((section) => ({
    sectionId: idsFor(form, versionNumber, section.id, section.id).sectionId,
    sourceSectionId: section.id,
    versionId,
    title: section.title,
    position: section.order,
  }));

  await db.formVersion.create({
    data: {
      id: versionId,
      formId: form.id,
      version: versionNumber,
      title: form.title,
      description: form.description ?? null,
    },
  });

  await db.formSection.createMany({
    data: sections.map(({ sectionId, versionId, title, position }) => ({ id: sectionId, versionId, title, position })),
  });

  const sectionIds = new Map(sections.map((section) => [section.sourceSectionId, section.sectionId]));
  const questions = definitionQuestions(form).map((question) => {
    const { questionId } = idsFor(form, versionNumber, question.sectionSourceId, question.sourceId);
    return {
      id: questionId,
      versionId,
      sectionId: sectionIds.get(question.sectionSourceId),
      key: question.key,
      label: question.label,
      type: question.type,
      required: question.required,
      allowOther: question.allowOther,
      validation: question.validation,
      position: question.position,
      options: question.options,
    };
  });

  await db.formQuestion.createMany({
    data: questions.map(({ options, ...question }) => question),
  });

  const options = questions.flatMap((question) => question.options.map((option) => ({ questionId: question.id, value: option.value, position: option.position })));
  if (options.length) await db.formQuestionOption.createMany({ data: options });

  return { versionId, sectionCount: sections.length, questionCount: questions.length, optionCount: options.length };
}

async function loadVersion(versionId) {
  return db.formVersion.findUnique({
    where: { id: versionId },
    include: {
      sections: { orderBy: { position: "asc" } },
      questions: { include: { options: true, section: true }, orderBy: { position: "asc" } },
      _count: { select: { submissions: true } },
    },
  });
}

async function replaceUnusedVersion(form, versionNumber, versionId) {
  await db.formQuestion.deleteMany({ where: { versionId } });
  await db.formSection.deleteMany({ where: { versionId } });
  await db.formVersion.delete({ where: { id: versionId } });
  return createVersion(form, versionNumber);
}

async function syncForm(form) {
  const existingForm = await db.form.findUnique({
    where: { id: form.id },
    include: { versions: { orderBy: { version: "asc" }, select: { id: true, version: true } } },
  });

  if (!existingForm) {
    await db.form.create({
      data: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description ?? null,
        currentVersion: 1,
      },
    });
    const created = await createVersion(form, 1);
    return { version: 1, ...created, action: "created" };
  }

  await db.form.update({
    where: { id: form.id },
    data: { slug: form.slug, title: form.title, description: form.description ?? null },
  });

  // Prefer any existing version that already exactly matches the checked-in catalog.
  for (const candidate of [...existingForm.versions].sort((a, b) => b.version - a.version)) {
    const version = await loadVersion(candidate.id);
    if (version && versionMatchesDefinition(version, form)) {
      await db.form.update({ where: { id: form.id }, data: { currentVersion: version.version } });
      return { version: version.version, sectionCount: version.sections.length, questionCount: version.questions.length, optionCount: version.questions.reduce((n, q) => n + q.options.length, 0), action: "unchanged" };
    }
  }

  const currentVersionNumber = existingForm.currentVersion;
  const currentVersionId = `${form.id}-v${currentVersionNumber}`;
  const current = await loadVersion(currentVersionId);

  if (current && current._count.submissions === 0) {
    const result = await replaceUnusedVersion(form, currentVersionNumber, currentVersionId);
    await db.form.update({ where: { id: form.id }, data: { currentVersion: currentVersionNumber } });
    return { version: currentVersionNumber, ...result, action: "rebuilt-unused-version" };
  }

  const maxVersion = Math.max(0, ...existingForm.versions.map((version) => version.version));
  const nextVersion = maxVersion + 1;
  const result = await createVersion(form, nextVersion);
  await db.form.update({ where: { id: form.id }, data: { currentVersion: nextVersion } });
  return { version: nextVersion, ...result, action: "created-new-version" };
}

try {
  for (const form of definitions) {
    const result = await syncForm(form);
    console.log(`Seeded ${form.slug} (v${result.version}): ${result.sectionCount} sections, ${result.questionCount} questions, ${result.optionCount} options [${result.action}]`);
  }
  console.log(`Seed complete: ${definitions.length} forms.`);
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
