import { PrismaClient } from '@prisma/client';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

function arg(name, fallback='') { const i=process.argv.indexOf(name); return i>=0 && process.argv[i+1] ? process.argv[i+1] : fallback; }
function sha256(b){return crypto.createHash('sha256').update(b).digest('hex');}
const bundle = path.resolve(arg('--bundle'));
const mappingPath = path.resolve(arg('--mapping', 'migration/mapping.json'));
const apply = process.argv.includes('--apply');
const includeDefinitions = process.argv.includes('--include-definitions');
if (!bundle) throw new Error('Usage: npm run data:migration:import -- --bundle <bundle> --mapping <mapping.json> [--apply]');
if (!apply) { console.log('No --apply supplied. Importer is in safety mode and will not write anything.'); process.exit(0); }
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!targetUrl) throw new Error('TARGET_DATABASE_URL is required for --apply. Keep it separate from the source DATABASE_URL.');
const mapping = JSON.parse(await readFile(mappingPath,'utf8'));
const forms = JSON.parse(await readFile(path.join(bundle,'forms.json'),'utf8'));
const submissions = JSON.parse(await readFile(path.join(bundle,'submissions.json'),'utf8'));
const files = JSON.parse(await readFile(path.join(bundle,'files.json'),'utf8'));
for (const [slug,v] of Object.entries(mapping.forms||{})) if (!v.targetFormId) throw new Error(`Missing target form mapping: ${slug}`);
for (const form of forms) for (const version of form.versions) {
  const vk=`${form.slug}:v${version.version}`;
  if (!mapping.versions?.[vk]?.targetVersionId) throw new Error(`Missing target version mapping: ${vk}`);
  for (const section of version.sections) if (!mapping.sections?.[`${vk}:${section.id}`]?.targetSectionId) throw new Error(`Missing target section mapping: ${vk}:${section.id}`);
  for (const q of version.questions) if (!mapping.questions?.[`${vk}:${q.key}`]?.targetQuestionId) throw new Error(`Missing target question mapping: ${vk}:${q.key}`);
}
const db = new PrismaClient({ datasources: { db: { url: targetUrl } } });
const fileById = new Map(files.map(f=>[f.id,f]));
const report = {startedAt:new Date().toISOString(), forms:0, versions:0, sections:0, questions:0, options:0, submissions:0, answers:0, files:0, skippedSubmissions:0};
try {
  // This importer targets a production database that uses the same relational contract.
  // If the production schema differs, keep the bundle/mapping contract and replace only this adapter layer.
  // By default, existing production definitions are required and are not overwritten.
  if (includeDefinitions) {
  for (const form of forms) {
    const targetFormId=mapping.forms[form.slug].targetFormId;
    await db.form.upsert({where:{id:targetFormId},update:{slug:form.slug,title:form.title,description:form.description,currentVersion:form.currentVersion},create:{id:targetFormId,slug:form.slug,title:form.title,description:form.description,currentVersion:form.currentVersion}});
    report.forms++;
    for (const version of form.versions) {
      const vk=`${form.slug}:v${version.version}`; const targetVersionId=mapping.versions[vk].targetVersionId;
      await db.formVersion.upsert({where:{id:targetVersionId},update:{formId:targetFormId,version:version.version,title:version.title,description:version.description},create:{id:targetVersionId,formId:targetFormId,version:version.version,title:version.title,description:version.description}}); report.versions++;
      for (const section of version.sections) { const tid=mapping.sections[`${vk}:${section.id}`].targetSectionId; await db.formSection.upsert({where:{id:tid},update:{versionId:targetVersionId,title:section.title,position:section.position},create:{id:tid,versionId:targetVersionId,title:section.title,position:section.position}}); report.sections++; }
      for (const q of version.questions) { const tid=mapping.questions[`${vk}:${q.key}`].targetQuestionId; const sectionTarget=mapping.sections[`${vk}:${q.sectionId}`]?.targetSectionId; if(!sectionTarget) throw new Error(`Missing target section for question ${q.id}`); await db.formQuestion.upsert({where:{id:tid},update:{versionId:targetVersionId,sectionId:sectionTarget,key:q.key,label:q.label,type:q.type,required:q.required,allowOther:q.allowOther,validation:q.validation,position:q.position},create:{id:tid,versionId:targetVersionId,sectionId:sectionTarget,key:q.key,label:q.label,type:q.type,required:q.required,allowOther:q.allowOther,validation:q.validation,position:q.position}}); report.questions++; for(const o of q.options){await db.formQuestionOption.upsert({where:{id:o.id},update:{questionId:tid,value:o.value,position:o.position},create:{id:o.id,questionId:tid,value:o.value,position:o.position}});report.options++;} }
    }
  }
  } else {
    for (const form of forms) {
      const targetFormId=mapping.forms[form.slug].targetFormId;
      const target=await db.form.findUnique({where:{id:targetFormId},select:{id:true}});
      if(!target) throw new Error(`Target form does not exist: ${form.slug} -> ${targetFormId}. Use --include-definitions only when the target should receive definitions.`);
      for(const version of form.versions){const vk=`${form.slug}:v${version.version}`;const tv=await db.formVersion.findUnique({where:{id:mapping.versions[vk].targetVersionId},select:{id:true}});if(!tv)throw new Error(`Target version does not exist: ${vk}`);for(const q of version.questions){const tq=await db.formQuestion.findUnique({where:{id:mapping.questions[`${vk}:${q.key}`].targetQuestionId},select:{id:true}});if(!tq)throw new Error(`Target question does not exist: ${vk}:${q.key}`);}}
    }
  }
  for (const s of submissions) {
    const sourceForm=forms.find(f=>f.id===s.formId); if(!sourceForm) throw new Error(`Missing source form for submission ${s.id}`); const version=sourceForm.versions.find(v=>v.id===s.formVersionId); if(!version) throw new Error(`Missing source version for submission ${s.id}`); const targetFormId=mapping.forms[sourceForm.slug].targetFormId; const targetVersionId=mapping.versions[`${sourceForm.slug}:v${version.version}`].targetVersionId;
    const existing=await db.submission.findUnique({where:{id:s.id},select:{id:true}}); if(existing){report.skippedSubmissions++; continue;}
    await db.submission.create({data:{id:s.id,formId:targetFormId,formVersionId:targetVersionId,status:s.status==='MIGRATED'?'MIGRATED':s.status==='MIGRATION_FAILED'?'MIGRATION_FAILED':'SUBMITTED',createdAt:new Date(s.createdAt),submittedAt:s.submittedAt?new Date(s.submittedAt):null,migratedAt:s.migratedAt?new Date(s.migratedAt):null,migrationError:s.migrationError,answers:{create:s.answers.map(a=>({id:a.id,questionId:mapping.questions[`${sourceForm.slug}:v${version.version}:${a.questionKey}`].targetQuestionId,value:a.value}))}}});
    for(const a of s.answers){const targetAnswer=await db.answer.findUnique({where:{id:a.id},select:{id:true}}); if(!targetAnswer) throw new Error(`Answer import failed: ${a.id}`); report.answers++; for(const u of a.uploads||[]){const meta=fileById.get(u.id); if(!meta) throw new Error(`Missing file metadata: ${u.id}`); const bytes=await readFile(path.join(bundle,meta.path)); if(sha256(bytes)!==meta.sha256) throw new Error(`Checksum mismatch: ${u.id}`); await db.fileUpload.upsert({where:{id:u.id},update:{answerId:a.id,filename:u.filename,mimeType:u.mimeType,bytes,createdAt:new Date(u.createdAt)},create:{id:u.id,answerId:a.id,filename:u.filename,mimeType:u.mimeType,bytes,createdAt:new Date(u.createdAt)}}); report.files++; } }
    report.submissions++;
  }
  report.completedAt=new Date().toISOString(); console.log('\nMigration import complete'); console.log(JSON.stringify(report,null,2));
} finally { await db.$disconnect(); }
