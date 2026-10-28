# Production schema contract for the generic importer

The included importer is intentionally conservative. It can write to a target PostgreSQL database only when that database exposes the same logical Prisma models used by this collection project:

- Form
- FormVersion
- FormSection
- FormQuestion
- FormQuestionOption
- Submission
- Answer
- FileUpload

The target must preserve the relationships between these models. IDs can differ from source IDs through `migration/mapping.json`.

If the real production application uses a different schema, **do not force the generic importer onto it**. Keep the bundle and mapping contract unchanged and replace only `scripts/import-to-postgres.mjs` with a production-specific adapter. This prevents accidental data loss caused by guessing the final schema.
