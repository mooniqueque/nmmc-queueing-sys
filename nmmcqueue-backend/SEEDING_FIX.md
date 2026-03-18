# Prisma Seed Fix Guide (Windows + pnpm)

## Problem

Running:

```powershell
pnpm dlx prisma db seed
```

failed with:

```text
'tsx' is not recognized as an internal or external command
```

After fixing that, seeding failed again with:

```text
The column `slug` does not exist in the current database.
```

## Root Causes

1. `pnpm dlx prisma ...` runs Prisma in an isolated context where direct `tsx` binary resolution can fail.
2. Database schema drift: the live DB did not match `prisma/schema.prisma` (missing `department.slug`).

## Applied Fixes

### 1) Make seed runner robust under `pnpm dlx`

Updated Prisma config seed command:

File: `prisma.config.ts`

```ts
migrations: {
  seed: "pnpm exec tsx prisma/seed.ts",
  path: "prisma/migrations",
}
```

Why: `pnpm exec` resolves project-local binaries reliably, even when Prisma is executed via `pnpm dlx`.

### 2) Sync DB schema to current Prisma schema

Use:

```powershell
pnpm exec prisma db push --schema prisma/schema.prisma --accept-data-loss
```

Why: this adds missing columns/constraints (including `department.slug`) when migration history says "up to date" but DB is still out of sync.

## Verification

Command used for final verification:

```powershell
pnpm dlx prisma db seed
```

Observed result:

- `Seeding completed successfully!`
- Summary showed:
  - `Total Users: 17`
  - `Total Accounts (Logins): 17`
  - `Approved Users: 11`
  - `Pending Users: 6`

## Practical Runbook

From `nmmcqueue-backend`:

1. Install deps (if not installed yet):

```powershell
pnpm install
```

2. If seed fails with missing column / schema mismatch:

```powershell
pnpm exec prisma db push --schema prisma/schema.prisma --accept-data-loss
```

3. Run seed:

```powershell
pnpm dlx prisma db seed
```

## Notes

- `--accept-data-loss` is safe for local/dev reset workflows, but use caution on production databases.
- For production-like migration workflows, prefer migration-based deployment:

```powershell
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```
