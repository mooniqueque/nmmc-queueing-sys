-- Restore compatibility objects required by predev verifier and runtime flow.
-- This migration is intentionally idempotent for partially-migrated environments.

SET @ticket_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND column_name = 'ticketNumber'
);

SET @add_ticket_col_sql := IF(
    @ticket_col_exists = 0,
    'ALTER TABLE `visit` ADD COLUMN `ticketNumber` INTEGER NULL AFTER `departmentId`',
    'SELECT 1'
);

PREPARE stmt FROM @add_ticket_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @window_ticket_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND column_name = 'windowTicketNumber'
);

SET @add_window_ticket_col_sql := IF(
    @window_ticket_col_exists = 0,
    'ALTER TABLE `visit` ADD COLUMN `windowTicketNumber` INTEGER NULL AFTER `sequenceKey`',
    'SELECT 1'
);

PREPARE stmt FROM @add_window_ticket_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill best-effort values when newer columns already exist.
UPDATE `visit`
SET
    `ticketNumber` = COALESCE(`ticketNumber`, `serviceTicket`),
    `windowTicketNumber` = COALESCE(`windowTicketNumber`, `triageTicket`);

-- Recreate the expected unique index if it is missing.
SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND index_name = 'visit_queueDate_sequenceKey_ticketNumber_key'
);

SET @create_idx_sql := IF(
    @idx_exists = 0,
    'CREATE UNIQUE INDEX `visit_queueDate_sequenceKey_ticketNumber_key` ON `visit`(`queueDate`, `sequenceKey`, `ticketNumber`)',
    'SELECT 1'
);

PREPARE stmt FROM @create_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
