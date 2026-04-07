-- Finalize the two-ticket model after the temporary compatibility migration.
-- Safe for partially-migrated environments: drop legacy index/columns only if present.

SET @legacy_idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND index_name = 'visit_queueDate_sequenceKey_ticketNumber_key'
);

SET @drop_legacy_idx_sql := IF(
    @legacy_idx_exists > 0,
    'ALTER TABLE `visit` DROP INDEX `visit_queueDate_sequenceKey_ticketNumber_key`',
    'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @legacy_window_ticket_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND column_name = 'windowTicketNumber'
);

SET @drop_legacy_window_ticket_sql := IF(
    @legacy_window_ticket_exists > 0,
    'ALTER TABLE `visit` DROP COLUMN `windowTicketNumber`',
    'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_window_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @legacy_ticket_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'visit'
      AND column_name = 'ticketNumber'
);

SET @drop_legacy_ticket_sql := IF(
    @legacy_ticket_exists > 0,
    'ALTER TABLE `visit` DROP COLUMN `ticketNumber`',
    'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
