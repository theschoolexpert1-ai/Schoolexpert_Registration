import { PrismaClient } from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function arg(name,fallback=''){const i=process.argv.indexOf(name);return i>=0&&process.argv[i+1]?process.argv[i+1]:fallback;}
const bundle=path.resolve(arg('--bundle')); const out=path.resolve(arg('--out','migration/mapping.json')); if(!bundle)throw new Error('Usage: npm run data:migration:auto-map -- --bundle <bundle> [--out migration/mapping.json]');
const url=process.env.TARGET_DATABASE_URL;if(!url)throw new Error('TARGET_DATABASE_URL is required.');
const forms=JSON.parse(await readFile(path.join(bundle,'forms.json'),'utf8')); const db=new PrismaClient({datasources:{db:{url}}});
const mapping={format:'forms-data-production-mapping',version:2,forms:{},versions:{},sections:{},questions:{}};
try{const targets=await db.form.findMany({include:{versions:{include:{sections:true,questions:true}}}});const bySlug=new Map(targets.map(f=>[f.slug,f]));for(const sf of forms){const tf=bySlug.get(sf.slug);if(!tf)continue;mapping.forms[sf.slug]={targetFormId:tf.id};for(const sv of sf.versions){const tv=tf.versions.find(v=>v.version===sv.version);const vk=`${sf.slug}:v${sv.version}`;if(!tv)continue;mapping.versions[vk]={targetVersionId:tv.id};const sectionByPos=new Map(tv.sections.map(s=>[s.position,s]));for(const ss of sv.sections){const ts=sectionByPos.get(ss.position);if(ts)mapping.sections[`${vk}:${ss.id}`]={targetSectionId:ts.id};}const qByKey=new Map(tv.questions.map(q=>[q.key,q]));for(const sq of sv.questions){const tq=qByKey.get(sq.key);if(tq)mapping.questions[`${vk}:${sq.key}`]={targetQuestionId:tq.id};}}
}
await writeFile(out,JSON.stringify(mapping,null,2));console.log(`Auto-map written: ${out}`);console.log(`Forms mapped: ${Object.keys(mapping.forms).length}/${forms.length}`);console.log(`Versions mapped: ${Object.keys(mapping.versions).length}/${forms.reduce((n,f)=>n+f.versions.length,0)}`);console.log(`Sections mapped: ${Object.keys(mapping.sections).length}/${forms.reduce((n,f)=>n+f.versions.reduce((m,v)=>m+v.sections.length,0),0)}`);console.log(`Questions mapped: ${Object.keys(mapping.questions).length}/${forms.reduce((n,f)=>n+f.versions.reduce((m,v)=>m+v.questions.length,0),0)}`);
}finally{await db.$disconnect();}
