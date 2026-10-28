# Forms_Data

**Forms_Data** is a temporary data-collection application for The School
Expert. It provides a single registration platform for multiple school,
education-partner, and ambassador forms while keeping the collected data
structured and ready for later migration into the final production
application.

## 1. Technology

-   **Next.js 15 + React 19 + TypeScript** --- web application and form
    UI
-   **Prisma + PostgreSQL** --- relational data model and persistence
-   **Supabase PostgreSQL** --- collection database
-   **Supabase Storage** --- uploaded files
-   **Zod / server validation** --- request and data validation
-   **JSON form catalog** --- reusable form definitions and stable field
    keys

## 2. Application Architecture

``` text
User
 │
 ▼
Next.js Form UI
 │
 ├── Form definitions
 │      └── src/data/form-definitions.json
 │
 ▼
POST /api/submissions
 │
 ├── Validate form + version
 ├── Validate every answer
 ├── Upload files to Supabase Storage
 └── Store submission + answers in PostgreSQL
 │
 ▼
Collection Database
 │
 └── Export / Migration Toolkit
          │
          ├── Validate
          ├── Map source → production IDs
          ├── Dry run
          ├── Import
          └── Verify
```

### Important principle

The **form catalog defines what the application displays**, while the
**database stores the form structure and submissions used for
persistence and migration**. Form definitions use stable slugs and
question keys so data is not dependent on question position or display
text.

## 3. Database Architecture

The main relationship is:

``` text
Form
 └── FormVersion
      ├── FormSection
      │    └── FormQuestion
      │         └── FormQuestionOption
      │
      └── Submission
           └── Answer
                └── FileUpload
```

### Main tables

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `Form`                              Identifies a registration form
                                      using a unique slug

  `FormVersion`                       Stores a versioned snapshot of a
                                      form

  `FormSection`                       Groups questions and preserves
                                      section order

  `FormQuestion`                      Stores the field key, label, type,
                                      required state and validation rules

  `FormQuestionOption`                Stores options for
                                      radio/select/checkbox fields

  `Submission`                        One completed registration and its
                                      status

  `Answer`                            One answer linked to a submission
                                      and question

  `FileUpload`                        File metadata and optional stored
                                      file bytes/path
  -----------------------------------------------------------------------

### How an answer is stored

An answer is linked to both:

``` text
Submission → Answer → FormQuestion
```

The actual answer is stored in the `Answer.value` JSON column. This
allows different field types to use appropriate values without changing
the database schema for every form.

Examples:

``` text
text      → "ABC School"
radio     → "CBSE"
select    → "Delhi"
checkbox  → ["Instagram", "WhatsApp"]
```

Files are represented separately through `FileUpload`, allowing metadata
and storage references to be retained independently from the answer
value.

## 4. Form Versioning

Every form has a `currentVersion`.

A submission stores both:

-   `formId`
-   `formVersionId`

This is important because a form may change later. Existing submissions
continue to point to the version that was used when they were submitted.

**Do not identify questions during migration by their position or
visible label.** Use the stable question `key`.

## 5. Submission Flow

1.  User opens a form using its slug.
2.  The application loads the form definition.
3.  User completes the sections.
4.  Client-side validation provides immediate feedback.
5.  The submission API performs authoritative server-side validation.
6.  Files are uploaded to Supabase Storage when present.
7.  A `Submission` is created with its `Answer` records.
8.  File metadata is linked to the relevant answer.
9.  The submission remains in the collection database until migration.

Submission statuses include:

``` text
DRAFT
SUBMITTED
MIGRATED
MIGRATION_FAILED
```

## 6. Data Migration

The collection database is the **source of truth until the production
application is ready**.

Migration is deliberately separated from the form application.

``` text
Collection PostgreSQL
        │
        ▼
data:export
        │
        ▼
Migration Bundle
(forms.json / submissions.json / files.json)
        │
        ▼
data:validate
        │
        ▼
Explicit Mapping
        │
        ▼
data:migration:dry-run
        │
        ▼
Production PostgreSQL
        │
        ▼
data:migration:verify
        │
        ▼
Mark source submissions as MIGRATED
```

### Mapping strategy

Migration uses stable identifiers:

``` text
Form:
form slug → production form ID

Version:
formSlug:v<version> → production version ID

Section:
formSlug:v<version>:sourceSectionId → production section ID

Question:
formSlug:v<version>:questionKey → production question ID
```

This prevents data from being corrupted if question order or labels
change.

### Migration safety

The migration toolkit follows these rules:

-   Never map answers by question position.
-   Never depend on display labels as identifiers.
-   Keep source and production database URLs separate.
-   Validate the export before writing.
-   Always run a dry run first.
-   Verify imported rows and file checksums.
-   Only mark source submissions as migrated after verification.
-   Preserve stable IDs where the target schema allows it.
-   If the final production schema differs, adapt the importer rather
    than changing the export contract.

## 7. Main Commands

### Development

``` bash
npm run dev
npm run build
npm run start
```

### Database

``` bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:migrate:deploy
```

### Export

``` bash
npm run data:export
npm run data:validate
```

### Migration

``` bash
npm run data:migration:init
npm run data:migration:plan
npm run data:migration:dry-run
npm run data:migration:import
npm run data:migration:verify
npm run data:migration:mark
npm run data:migration:auto-map
```

### Storage checks

``` bash
npm run data:storage:backfill
npm run data:storage:check
```

## 8. Important Project Files

``` text
src/
 ├── app/
 │    ├── api/submissions/route.ts   # submission API
 │    ├── forms/[slug]/page.tsx      # form route
 │    └── page.tsx                   # form catalogue/home
 │
 ├── components/
 │    └── registration-form.tsx      # reusable form renderer
 │
 ├── data/
 │    └── form-definitions.json      # form catalogue
 │
 └── lib/
      ├── db.ts                      # Prisma client
      └── storage.ts                 # Supabase Storage

prisma/
 ├── schema.prisma                   # database schema
 └── seed.mjs                        # form/database synchronisation

scripts/
 ├── export-data.mjs
 ├── validate-export.mjs
 ├── migration-plan.mjs
 ├── migration-dry-run.mjs
 ├── import-to-postgres.mjs
 └── verify-migration.mjs

migration/
 ├── mapping.json                    # source → production mapping
 └── README.md                       # migration operations
```

## 9. Environment Variables

At minimum, the application/database setup requires:

``` text
DATABASE_URL
DIRECT_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
```

Migration writes require a separate:

``` text
TARGET_DATABASE_URL
```

**Never use the production target URL as the collection
`DATABASE_URL`.**

## 10. Adding Future Forms

For a new form:

1.  Add the source document to `source-forms/`.
2.  Create a new form definition with a unique `slug`.
3.  Give every question a stable semantic `key`.
4.  Set the correct field type, options, required state and validation.
5.  Add the form to the catalog.
6.  Seed/synchronize the database.
7.  Test the form and submission API.
8.  Export and validate before migration.

The current project contains **18 forms**. New forms should be added
without changing the identifiers of existing forms or questions.


## 11. Admin Submissions Dashboard

The project includes a protected admin area for reviewing collected submissions without accessing PostgreSQL directly.

```text
/admin                    Dashboard and form totals
/admin/submissions        Filtered submission list
/admin/submissions/[id]   Full answer-by-section view
/admin/login              Admin sign-in
```

The dashboard reads the existing relational data model through Prisma; it does **not** create a second submissions database. It uses the same `Form → FormVersion → FormQuestion → Submission → Answer → FileUpload` relationships as the migration system.

Features include:
- Form-level submission counts
- Submission list with pagination and status filters
- Submission detail grouped by the original form sections
- Checkbox/radio/select/text answers displayed from stored JSON values
- Protected file downloads through the server
- CSV export for a selected form or all forms
- No-cache/dynamic rendering for current database data

### Admin security

Admin access uses an HTTP-only, signed session cookie. Configure:

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

`ADMIN_SESSION_SECRET` must be at least 32 characters. Keep both values server-side and never expose them to client code. For production, place the application behind normal HTTPS and add infrastructure-level rate limiting/WAF protection to the admin login endpoint.

The dashboard is intentionally separate from the public registration UI. Public users can submit forms, but only an authenticated admin session can read submissions or files.

## Seed and form-version safety

The checked-in catalog in `src/data/form-definitions.json` is the source of truth for the registration forms.

`npm run prisma:seed` is designed to be safely repeatable:

- A matching existing form version is reused.
- An unused, outdated version can be rebuilt from the catalog.
- A version that already has submissions is never rewritten. If its structure is outdated, the seed creates a new version and makes it current.
- Version 2+ section and question IDs are version-scoped, while the semantic question `key` remains stable for migration and submission mapping.
- The submission API resolves incoming answers by semantic question key, so the browser catalog continues to work when a new form version receives new database IDs.

For the five school forms updated with admission and media fields, the seed therefore does not require deleting historical submissions.

## Current Catalog

The catalog currently contains 19 registration forms, including the Online School Registration Form.
