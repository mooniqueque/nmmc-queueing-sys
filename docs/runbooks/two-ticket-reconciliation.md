# Two-Ticket Migration Reconciliation Runbook

## Scope
Use this runbook when an environment has drift between legacy ticket columns and the canonical dual-ticket model.

Canonical schema target:

- keep `visit.triageTicket`
- keep `visit.serviceTicket`
- keep `visit.queueBusinessDay`
- remove `visit.ticketNumber`
- remove `visit.windowTicketNumber`

## Preconditions

1. Database backup completed.
2. App writes paused (maintenance window recommended).
3. `.env` points to the intended target database.

## Recovery Steps

1. Resolve failed migration entries if present:

```bash
pnpm --filter nmmcqueue-backend exec prisma migrate resolve --rolled-back <migration_name>
```

2. Apply all pending migrations:

```bash
pnpm --filter nmmcqueue-backend run db:migrate:deploy
```

3. Confirm migration status is clean:

```bash
pnpm --filter nmmcqueue-backend run db:migrate:status
```

4. Verify canonical schema contract:

```bash
pnpm --filter nmmcqueue-backend run db:verify
```

## Capture Schema Snapshot Checksum

Run this SQL on the target database and store the checksum in your deployment record:

```sql
SELECT MD5(
  GROUP_CONCAT(
    CONCAT(
      TABLE_NAME, ':', COLUMN_NAME, ':', COLUMN_TYPE, ':', IS_NULLABLE, ':', COALESCE(COLUMN_DEFAULT, 'NULL')
    )
    ORDER BY TABLE_NAME, ORDINAL_POSITION
    SEPARATOR '|'
  )
) AS schema_checksum
FROM information_schema.columns
WHERE table_schema = DATABASE();
```

## Expected Post-State

- `prisma migrate status` returns success and no pending migrations.
- `_prisma_migrations` has no rows with `finished_at IS NULL AND rolled_back_at IS NULL`.
- verifier reports no missing canonical columns/indexes and no unexpected legacy objects.
