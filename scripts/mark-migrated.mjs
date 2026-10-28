import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
function arg(name,fallback=''){const i=process.argv.indexOf(name);return i>=0&&process.argv[i+1]?process.argv[i+1]:fallback;}
const bundle=path.resolve(arg('--bundle'));if(!bundle)throw new Error('Usage: npm run data:migration:mark -- --bundle <bundle>');
const source=new PrismaClient(); const targetUrl=process.env.TARGET_DATABASE_URL;if(!targetUrl)throw new Error('TARGET_DATABASE_URL is required.'); const target=new PrismaClient({datasources:{db:{url:targetUrl}}});
const submissions=JSON.parse(await readFile(path.join(bundle,'submissions.json'),'utf8')); const files=JSON.parse(await readFile(path.join(bundle,'files.json'),'utf8'));
try{let marked=0;for(const s of submissions){const t=await target.submission.findUnique({where:{id:s.id},include:{answers:{include:{uploads:true}}}});if(!t)throw new Error(`Target submission missing: ${s.id}`);for(const a of s.answers||[]){const ta=t.answers.find(x=>x.id===a.id);if(!ta)throw new Error(`Target answer missing: ${a.id}`);for(const u of a.uploads||[]){if(!ta.uploads.some(x=>x.id===u.id))throw new Error(`Target file missing: ${u.id}`);}}await source.submission.update({where:{id:s.id},data:{status:'MIGRATED',migratedAt:new Date(),migrationError:null}});marked++;}console.log(`Marked ${marked} source submissions as MIGRATED.`);}finally{await source.$disconnect();await target.$disconnect();}
