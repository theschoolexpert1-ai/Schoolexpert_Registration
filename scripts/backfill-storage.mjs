import { PrismaClient } from '@prisma/client';
import { storageUpload, storageExists, bucketName } from './storage-client.mjs';

const prisma = new PrismaClient();
const clearBytes = process.argv.includes('--clear-bytes');

function extension(filename) {
  const match = filename?.match(/\.([a-zA-Z0-9]{1,10})$/);
  return match ? `.${match[1].toLowerCase()}` : '.bin';
}

async function main() {
  const uploads = await prisma.fileUpload.findMany({ orderBy: { id: 'asc' } });
  console.log(`Storage backfill: ${uploads.length} FileUpload record(s), bucket=${bucketName()}`);
  let migrated = 0, skipped = 0;
  for (const upload of uploads) {
    if (upload.storagePath) { skipped++; continue; }
    if (!upload.bytes) throw new Error(`FileUpload ${upload.id} has no legacy bytes to backfill.`);
    const storagePath = `submissions/${upload.answerId}/${upload.id}${extension(upload.filename)}`;
    if (!(await storageExists(storagePath))) {
      await storageUpload(storagePath, Buffer.from(upload.bytes), upload.mimeType || 'application/octet-stream');
    }
    await prisma.fileUpload.update({ where: { id: upload.id }, data: { storagePath, size: upload.bytes.length, ...(clearBytes ? { bytes: null } : {}) } });
    migrated++;
    console.log(`  ✓ ${upload.id} -> ${storagePath}${clearBytes ? ' (legacy bytes cleared)' : ''}`);
  }
  console.log(`\nBackfill complete: ${migrated} migrated, ${skipped} already in Storage.`);
  if (!clearBytes && migrated) console.log('Legacy bytes were retained. After verifying Storage, run this command again with --clear-bytes to reclaim PostgreSQL space.');
}
main().catch((e)=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
