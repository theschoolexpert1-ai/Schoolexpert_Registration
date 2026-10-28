# Migration readiness

This repository now contains the complete source-side workflow:

1. PostgreSQL/Prisma persistence
2. Immutable form versioning
3. Stable semantic question keys
4. Idempotent seed
5. Read-only export bundle with file checksums
6. Export integrity validation
7. Production mapping template generation
8. Mapping/plan generation
9. Production dry-run
10. Idempotent PostgreSQL import adapter
11. Post-import verification
12. Source-side MIGRATED marking only after verification

## What cannot be pre-wired yet

The final production application's database schema and real production IDs are not part of this project. Therefore the importer is deliberately isolated as a compatible-schema adapter. When the production schema is supplied, use the existing bundle/mapping contract and adapt only `scripts/import-to-postgres.mjs` if necessary.

Never point `TARGET_DATABASE_URL` at the source database during a real migration.
