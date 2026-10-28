# PostgreSQL setup

1. Create an empty PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run `npm ci`.
4. Run `npx prisma generate`.
5. For a fresh database run `npm run prisma:migrate:deploy`.
6. Seed the immutable v1 form definitions with `npm run prisma:seed`.
7. Start the app with `npm run dev`.

## Migration safety

- Existing question IDs are preserved.
- Each question has a stable `key` stored in the checked-in form definition.
- Submissions reference both `Form` and `FormVersion`.
- Form version 1 is treated as immutable after collection begins.
- Do not edit an existing version in place after schools have submitted data. Create a new version instead.
- `Answer.value` is JSON so text, single-choice, and multi-choice answers remain lossless.
- Files remain in PostgreSQL for now; moving them to object storage can be done later without changing answer/question identity.
- For an existing legacy database, do not run a destructive reset. Take a backup and create an explicit mapping before importing legacy submissions.

## Supabase Storage for uploaded files

Uploaded school documents are stored in the private Supabase Storage bucket `school-submissions`; PostgreSQL stores only file metadata and the Storage object path. This avoids putting large binary files in the `FileUpload.bytes` column.

Required server-only environment variables:

```env
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
SUPABASE_STORAGE_BUCKET="school-submissions"
```

Create the bucket in Supabase Dashboard → Storage → New bucket and keep it **Private**. Never expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_*` variable.

After applying the Prisma migration, move existing legacy `FileUpload.bytes` records into Storage:

```powershell
npm run data:storage:backfill
```

The first run retains the legacy bytes as a safety copy. Verify the objects with:

```powershell
npm run data:storage:check
```

Only after the check passes should you reclaim the old PostgreSQL binary data:

```powershell
npm run data:storage:backfill -- --clear-bytes
```

New uploads go directly to Storage and do not populate `bytes`.
