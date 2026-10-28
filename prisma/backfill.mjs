import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

console.log("Backfill check: the migration-safe schema is designed for fresh collection.");
console.log("If an older database already contains submissions, create an explicit formSlug -> form/version mapping before importing them.");
await db.$disconnect();
