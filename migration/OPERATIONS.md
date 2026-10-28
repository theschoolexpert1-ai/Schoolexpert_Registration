# Migration operations checklist

## Collection side

```powershell
npm run prisma:migrate:deploy
npm run prisma:seed
npm run data:export
npm run data:validate
```

## Prepare production mapping

```powershell
npm run data:migration:init -- --bundle .\data-export-...
```

Edit `migration/mapping.json` and fill every target ID.

## Dry run

```powershell
npm run data:migration:plan -- --bundle .\data-export-... --mapping .\migration\mapping.json
npm run data:migration:dry-run -- --bundle .\data-export-... --mapping .\migration\mapping.json
```

Both are read-only.

## Production import

Set a separate target connection:

```powershell
$env:TARGET_DATABASE_URL="<production-postgresql-url>"
```

Then:

```powershell
npm run data:migration:import -- --bundle .\data-export-... --mapping .\migration\mapping.json --apply
npm run data:migration:verify -- --bundle .\data-export-...
```

Only after verification passes:

```powershell
npm run data:migration:mark -- --bundle .\data-export-...
```

## Rollback principle

The source is never deleted by these tools. If a target import has an issue, fix the target/import adapter and re-run the idempotent import. Do not reset the source database.
