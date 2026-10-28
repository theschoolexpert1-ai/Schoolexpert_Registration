import { PrismaClient } from '@prisma/client';
import { storageExists, bucketName } from './storage-client.mjs';
const prisma = new PrismaClient();
async function main(){
 const uploads=await prisma.fileUpload.findMany({orderBy:{id:'asc'},select:{id:true,filename:true,storagePath:true,size:true,bytes:true}});
 console.log(`Storage check: bucket=${bucketName()}`); let ok=true, storage=0, legacy=0;
 for(const u of uploads){
   if(!u.storagePath){ legacy++; console.log(`  ⚠ ${u.id}: no storagePath (legacy bytes: ${u.bytes?u.bytes.length:0})`); ok=false; continue; }
   storage++; const exists=await storageExists(u.storagePath); if(!exists){ok=false;console.log(`  ✗ ${u.id}: missing ${u.storagePath}`);} else if(u.size===null){ok=false;console.log(`  ✗ ${u.id}: storagePath exists but size is null`);} else console.log(`  ✓ ${u.id}: ${u.storagePath}`);
 }
 console.log(`\nRecords: ${uploads.length} | Storage-backed: ${storage} | Legacy-only: ${legacy}`); console.log(`Storage check: ${ok?'PASS':'FAIL'}`); if(!ok)process.exitCode=1;
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
