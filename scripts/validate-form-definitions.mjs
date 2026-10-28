import fs from "node:fs";
import definitions from "../src/data/form-definitions.json" with { type: "json" };

const errors = [];
const warnings = [];
const seenFormSlugs = new Set();
const seenQuestionIds = new Set();
const seenKeys = new Set();
const types = new Set(["text", "textarea", "select", "radio", "checkbox", "file"]);

for (const form of definitions) {
  if (seenFormSlugs.has(form.slug)) errors.push(`Duplicate form slug: ${form.slug}`);
  seenFormSlugs.add(form.slug);
  if (!form.sections?.length) errors.push(`${form.slug}: no sections`);
  for (const section of form.sections ?? []) {
    if (!section.title?.trim()) errors.push(`${form.slug}/${section.id}: empty section title`);
    for (const field of section.fields ?? []) {
      if (seenQuestionIds.has(field.id)) errors.push(`Duplicate question id: ${field.id}`);
      if (seenKeys.has(field.key)) errors.push(`Duplicate question key: ${field.key}`);
      seenQuestionIds.add(field.id); seenKeys.add(field.key);
      if (!types.has(field.type)) errors.push(`${field.id}: unsupported type ${field.type}`);
      if (["select", "radio", "checkbox"].includes(field.type) && !(field.options?.length)) errors.push(`${field.id}: choice field has no options`);
      if (field.type !== "text" && field.validation) errors.push(`${field.id}: validation ${field.validation} is only allowed on text fields`);
      if (field.type === "checkbox" && !Array.isArray(field.options)) errors.push(`${field.id}: checkbox options must be an array`);
      if (field.options && new Set(field.options).size !== field.options.length) errors.push(`${field.id}: duplicate options`);
      if (field.options?.some((option) => /^(Dropdown|Mark only one oval\.|Tick all that apply\.|Files submitted:)$/i.test(option))) warnings.push(`${field.id}: parser marker found in options`);
    }
  }
}

if (fs.existsSync("src/data/form-definitions.json")) {
  console.log(`Catalog validation: ${definitions.length} forms, ${seenQuestionIds.size} unique questions.`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
if (warnings.length) console.warn(warnings.join("\n"));
console.log("Catalog validation passed.");
