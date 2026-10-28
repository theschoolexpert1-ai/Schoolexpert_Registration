# Production migration readiness

This project now contains the complete collection-side migration pipeline:

**collect → PostgreSQL → export → validate → map → dry-run → import → verify**.

The final production application's database schema is not present in this repository. Therefore the included importer is a **compatible-schema adapter**, not a guessed adapter for an unknown production schema. This is deliberate: inventing production table/field mappings before the real schema exists could corrupt data.

When the production schema is available:

1. Create `migration/mapping.json` with `data:migration:init`.
2. Fill target IDs for forms, versions, sections and questions.
3. Run the migration plan and dry-run.
4. Configure `TARGET_DATABASE_URL` to the production PostgreSQL database.
5. Ensure the target database implements the contract in `prisma/schema.prisma` (or replace only the adapter in `scripts/import-to-postgres.mjs`).
6. Run the importer with `--apply`.
7. Run migration verification.
8. Re-export and validate if additional source records arrive.

The source database remains untouched by export, validation, planning and dry-run operations.
