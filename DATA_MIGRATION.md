# Data migration / export

This project is a data-collection application whose PostgreSQL data will eventually be moved into the production application.

## Export a migration bundle

With the project connected to the source PostgreSQL database:

```bash
npm run data:export
```

To choose the output directory:

```bash
npm run data:export -- --out ./migration-export
```

The exporter creates:

- `manifest.json` — format version, export timestamp, and record counts.
- `forms.json` — forms, immutable versions, sections, questions, stable question keys, and options.
- `submissions.json` — submissions and answers, including the stable question key alongside each answer.
- `files.json` — uploaded-file metadata and SHA-256 checksums.
- `files/` — uploaded file bytes, stored separately from the JSON data.
- `CHECKSUMS.json` — SHA-256 checksums for the core JSON files.

## Migration principle

Do not map answers by question label or display position. The intended production mapping key is:

```text
source form ID + source form version + question key
```

Stable database IDs are also exported so a future migration can preserve relationships when appropriate.

## Recommended future migration flow

```text
Source PostgreSQL
      ↓
Export bundle
      ↓
Validate manifest/checksums
      ↓
Transform/map to production schema
      ↓
Import forms + versions
      ↓
Import submissions + answers
      ↓
Import files
      ↓
Run row-count / checksum / relationship verification
      ↓
Mark successfully migrated submissions
```

The current exporter is intentionally read-only: it never changes source data and never marks submissions as migrated. A production import tool should be built only after the final application's database schema is known.

## Validate an export

After creating an export, validate the bundle before moving data to another database:

```bash
npm run data:validate
```

By default the validator uses the newest `data-export-*` folder in the project directory. To validate a specific bundle:

```bash
npm run data:validate -- --input data-export-YYYY-MM-DDTHH-MM-SS-SSSZ
```

The validator checks required files, manifest counts, form/version/section/question/option relationships, stable question keys, submission/answer relationships, uploaded-file presence and SHA-256 checksums, and export-file checksums. It exits with code `1` when a migration-safety check fails.
