-- Reconcile two-ticket schema across diverged environments.
-- Idempotent: safe whether legacy ticket columns/index exist or not.

SET @has_queue_business_day := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND column_name = 'queueBusinessDay'
);

SET @add_queue_business_day_sql := IF(
  @has_queue_business_day = 0,
  'ALTER TABLE `visit` ADD COLUMN `queueBusinessDay` VARCHAR(10) NULL AFTER `sequenceKey`',
  'SELECT 1'
);

PREPARE stmt FROM @add_queue_business_day_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_triage_ticket := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND column_name = 'triageTicket'
);

SET @add_triage_ticket_sql := IF(
  @has_triage_ticket = 0,
  'ALTER TABLE `visit` ADD COLUMN `triageTicket` INTEGER NULL AFTER `departmentId`',
  'SELECT 1'
);

PREPARE stmt FROM @add_triage_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_service_ticket := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND column_name = 'serviceTicket'
);

SET @add_service_ticket_sql := IF(
  @has_service_ticket = 0,
  'ALTER TABLE `visit` ADD COLUMN `serviceTicket` INTEGER NULL AFTER `triageTicket`',
  'SELECT 1'
);

PREPARE stmt FROM @add_service_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Normalize queue business day for existing rows.
UPDATE `visit`
SET `queueBusinessDay` = DATE_FORMAT(COALESCE(`queueDate`, `createdAt`), '%Y-%m-%d')
WHERE `queueBusinessDay` IS NULL;

SET @legacy_ticket_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND column_name = 'ticketNumber'
);

SET @legacy_window_ticket_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND column_name = 'windowTicketNumber'
);

-- Backfill both new ticket columns when both legacy columns are present.
SET @backfill_both_sql := IF(
  @legacy_ticket_exists > 0 AND @legacy_window_ticket_exists > 0,
  'UPDATE `visit`\nSET\n  `triageTicket` = COALESCE(`triageTicket`, `windowTicketNumber`, CASE WHEN `status` IN (''WAITING_WINDOW'', ''IN_WINDOW'') THEN `ticketNumber` ELSE NULL END),\n  `serviceTicket` = COALESCE(`serviceTicket`, CASE WHEN `windowTicketNumber` IS NOT NULL THEN `ticketNumber` WHEN `status` IN (''WAITING_CLINIC'', ''IN_PROGRESS'', ''COMPLETED'') THEN `ticketNumber` ELSE NULL END)',
  'SELECT 1'
);

PREPARE stmt FROM @backfill_both_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill from single legacy ticketNumber column if that is the only legacy column left.
SET @backfill_ticket_only_sql := IF(
  @legacy_ticket_exists > 0 AND @legacy_window_ticket_exists = 0,
  'UPDATE `visit`\nSET\n  `triageTicket` = COALESCE(`triageTicket`, CASE WHEN `status` IN (''WAITING_WINDOW'', ''IN_WINDOW'') THEN `ticketNumber` ELSE NULL END),\n  `serviceTicket` = COALESCE(`serviceTicket`, CASE WHEN `status` IN (''WAITING_CLINIC'', ''IN_PROGRESS'', ''COMPLETED'') THEN `ticketNumber` ELSE NULL END)',
  'SELECT 1'
);

PREPARE stmt FROM @backfill_ticket_only_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill from legacy windowTicketNumber only if ticketNumber was already removed.
SET @backfill_window_only_sql := IF(
  @legacy_ticket_exists = 0 AND @legacy_window_ticket_exists > 0,
  'UPDATE `visit`\nSET `triageTicket` = COALESCE(`triageTicket`, `windowTicketNumber`)',
  'SELECT 1'
);

PREPARE stmt FROM @backfill_window_only_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove legacy index/columns if present.
SET @legacy_index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND index_name = 'visit_queueDate_sequenceKey_ticketNumber_key'
);

SET @drop_legacy_index_sql := IF(
  @legacy_index_exists > 0,
  'ALTER TABLE `visit` DROP INDEX `visit_queueDate_sequenceKey_ticketNumber_key`',
  'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_legacy_window_ticket_sql := IF(
  @legacy_window_ticket_exists > 0,
  'ALTER TABLE `visit` DROP COLUMN `windowTicketNumber`',
  'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_window_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_legacy_ticket_sql := IF(
  @legacy_ticket_exists > 0,
  'ALTER TABLE `visit` DROP COLUMN `ticketNumber`',
  'SELECT 1'
);

PREPARE stmt FROM @drop_legacy_ticket_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enforce canonical NOT NULL + default after backfill.
ALTER TABLE `visit`
  MODIFY `queueBusinessDay` VARCHAR(10) NOT NULL;

-- Ensure canonical unique indexes exist.
SET @new_triage_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND index_name = 'visit_queueBusinessDay_classification_triageTicket_key'
);

SET @create_triage_idx_sql := IF(
  @new_triage_idx_exists = 0,
  'CREATE UNIQUE INDEX `visit_queueBusinessDay_classification_triageTicket_key` ON `visit`(`queueBusinessDay`, `classification`, `triageTicket`)',
  'SELECT 1'
);

PREPARE stmt FROM @create_triage_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @new_service_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'visit'
    AND index_name = 'visit_queueBusinessDay_sequenceKey_serviceTicket_key'
);

SET @create_service_idx_sql := IF(
  @new_service_idx_exists = 0,
  'CREATE UNIQUE INDEX `visit_queueBusinessDay_sequenceKey_serviceTicket_key` ON `visit`(`queueBusinessDay`, `sequenceKey`, `serviceTicket`)',
  'SELECT 1'
);

PREPARE stmt FROM @create_service_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
