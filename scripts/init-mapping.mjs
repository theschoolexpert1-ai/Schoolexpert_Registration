import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

const bundle = path.resolve(process.argv[process.argv.indexOf('--bundle') + 1] || '');
const out = path.resolve(process.argv[process.argv.indexOf('--out') + 1] || 'migration/mapping.json');
if (!bundle) throw new Error('Usage: npm run data:migration:init -- --bundle <data-export-folder> [--out migration/mapping.json]');
const forms = JSON.parse(await readFile(path.join(bundle, 'forms.json'), 'utf8'));
const mapping = { format: 'forms-data-production-mapping', version: 2, forms: {}, versions: {}, sections: {}, questions: {} };
for (const form of forms) {
  mapping.forms[form.slug] = { targetFormId: '' };
  for (const version of form.versions) {
    const versionKey = `${form.slug}:v${version.version}`;
    mapping.versions[versionKey] = { targetVersionId: '' };
    for (const section of version.sections) {
      mapping.sections[`${versionKey}:${section.id}`] = { targetSectionId: '' };
    }
    for (const q of version.questions) {
      mapping.questions[`${versionKey}:${q.key}`] = { targetQuestionId: '' };
    }
  }
}
await fs.promises.mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(mapping, null, 2));
console.log(`Migration mapping template created: ${out}`);
console.log(`Forms: ${Object.keys(mapping.forms).length}`);
console.log(`Versions: ${Object.keys(mapping.versions).length}`);
console.log(`Sections: ${Object.keys(mapping.sections).length}`);
console.log(`Questions: ${Object.keys(mapping.questions).length}`);
