import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
function arg(name,fallback=''){const i=process.argv.indexOf(name);return i>=0&&process.argv[i+1]?process.argv[i+1]:fallback;}
const bundle=path.resolve(arg('--bundle')); if(!bundle) throw new Error('Usage: npm run data:migration:verify -- --bundle <bundle>');
const submissions=JSON.parse(await readFile(path.join(bundle,'submissions.json'),'utf8'));
const files=JSON.parse(await readFile(path.join(bundle,'files.json'),'utf8'));
const url=process.env.TARGET_DATABASE_URL; if(!url) throw new Error('TARGET_DATABASE_URL is required.');
const db=new PrismaClient({datasources:{db:{url}}});
try {
  let ok=true; const missing=[]; const bad=[];
  for(const s of submissions){const row=await db.submission.findUnique({where:{id:s.id},include:{answers:{include:{uploads:true}}}}); if(!row){missing.push(`submission:${s.id}`);continue;} const expectedAnswers=new Map((s.answers||[]).map(a=>[a.id,a])); for(const a of s.answers||[]){const ta=row.answers.find(x=>x.id===a.id);if(!ta){missing.push(`answer:${a.id}`);continue;}for(const u of a.uploads||[]){const tu=ta.uploads.find(x=>x.id===u.id);if(!tu)missing.push(`file:${u.id}`);else if(Buffer.from(tu.bytes).toString('hex')!==Buffer.from((await readFile(path.join(bundle,u.path)))).toString('hex'))bad.push(`file ${u.id}: target bytes differ from bundle.`);}} if(row.answers.length<expectedAnswers.size)bad.push(`submission ${s.id}: target has ${row.answers.length} answers, expected ${expectedAnswers.size}.`);}
  console.log('\nProduction migration verification'); console.log(`  submissions checked  ${submissions.length}`); console.log(`  files checked        ${files.length}`); if(missing.length){ok=false;console.log(`  missing              ${missing.length} ✗`);missing.slice(0,20).forEach(x=>console.log(`    - ${x}`));}else console.log('  missing              0 ✓');if(bad.length){ok=false;console.log(`  relationship/data issues ${bad.length} ✗`);bad.slice(0,20).forEach(x=>console.log(`    - ${x}`));}else console.log('  relationship/data issues 0 ✓');console.log(`\nVerification: ${ok?'PASS':'FAIL'}`);if(!ok)process.exitCode=1;
} finally {await db.$disconnect();}
