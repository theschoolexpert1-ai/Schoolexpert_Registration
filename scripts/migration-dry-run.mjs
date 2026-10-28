import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

function arg(name, fallback='') { const i=process.argv.indexOf(name); return i>=0 && process.argv[i+1] ? process.argv[i+1] : fallback; }
const bundle = path.resolve(arg('--bundle'));
const mappingPath = path.resolve(arg('--mapping', 'migration/mapping.json'));
if (!bundle) throw new Error('Usage: npm run data:migration:dry-run -- --bundle <bundle> --mapping <mapping.json>');
const planPath = path.join(bundle, 'migration-plan.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const mapping = JSON.parse(await readFile(mappingPath, 'utf8'));
const blanks=[];
for (const [k,v] of Object.entries(mapping.forms||{})) if (!v.targetFormId) blanks.push(`form:${k}`);
for (const [k,v] of Object.entries(mapping.versions||{})) if (!v.targetVersionId) blanks.push(`version:${k}`);
for (const [k,v] of Object.entries(mapping.sections||{})) if (!v.targetSectionId) blanks.push(`section:${k}`);
for (const [k,v] of Object.entries(mapping.questions||{})) if (!v.targetQuestionId) blanks.push(`question:${k}`);
console.log('\nProduction migration DRY RUN');
console.log(`Bundle: ${bundle}`);
console.log(`Plan ready: ${plan.readyForImport ? 'YES' : 'NO'}`);
console.log(`Unfilled mappings: ${blanks.length}`);
if (blanks.length) { console.log('\nFirst mappings to fill:'); blanks.slice(0,25).forEach(x=>console.log(`  - ${x}`)); }
if (plan.errors?.length) { console.log(`\nPlan errors: ${plan.errors.length}`); plan.errors.slice(0,20).forEach(x=>console.log(`  ✗ ${x}`)); }
if (!plan.readyForImport || blanks.length) { console.log('\nDRY RUN RESULT: NOT READY'); process.exitCode=1; }
else console.log('\nDRY RUN RESULT: READY FOR IMPORT');
