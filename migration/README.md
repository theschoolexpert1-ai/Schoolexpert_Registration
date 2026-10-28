# Production migration toolkit

The collection database is the source of truth until the production application is ready.

## Safety rules

1. Never map answers by question position or display label.
2. Map forms by stable slug + explicit production form ID.
3. Map versions by `formSlug:v<version>` + explicit production version ID.
4. Map sections by `formSlug:v<version>:sourceSectionId` + explicit production section ID.
5. Map questions by `formSlug:v<version>:questionKey` + explicit production question ID.
6. Preserve source submission/answer/file IDs when the target schema permits it; this makes imports idempotent.
7. Never mark a source submission migrated until its target rows and file checksums have been verified.
8. Always validate the export and run a dry run before production writes.
9. Keep the source `DATABASE_URL` and production `TARGET_DATABASE_URL` separate.

## End-to-end workflow

```powershell
npm run data:export
npm run data:validate
npm run data:migration:init -- --bundle .\data-export-...
npm run data:migration:plan -- --bundle .\data-export-... --mapping .\migration\mapping.json
npm run data:migration:dry-run -- --bundle .\data-export-... --mapping .\migration\mapping.json
npm run data:migration:import -- --bundle .\data-export-... --mapping .\migration\mapping.json --apply
npm run data:migration:verify -- --bundle .\data-export-...
```

The importer intentionally targets a PostgreSQL database implementing the same relational contract as this collection schema. If the final production schema differs, only the importer adapter should be changed; the export format, validation, mapping keys, dry-run and audit principles remain the same.

## Mark source submissions migrated

Only after production verification passes:

```powershell
npm run data:migration:mark -- --bundle .\data-export-...
```

This checks that every exported submission, answer and uploaded file exists in the target before changing the source submission status to `MIGRATED`.
