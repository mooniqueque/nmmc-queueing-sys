/*
  Warnings:

  - You are about to alter the column `status` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(6))`.
  - The values [KIOSK_SUBMITTED] on the enum `visit_status_history_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [KIOSK] on the enum `workstation_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `lane_option` table. If the table is not empty, all the data it contains will be lost.
*/
-- DropForeignKey
<<<<<<< HEAD
SET @lane_option_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lane_option'
    AND CONSTRAINT_NAME = 'lane_option_departmentId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @drop_lane_option_fk_sql := IF(
  @lane_option_fk_exists > 0,
  'ALTER TABLE `lane_option` DROP FOREIGN KEY `lane_option_departmentId_fkey`',
  'SELECT 1'
);
PREPARE drop_lane_option_fk_stmt FROM @drop_lane_option_fk_sql;
EXECUTE drop_lane_option_fk_stmt;
DEALLOCATE PREPARE drop_lane_option_fk_stmt;
=======
SET @fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'lane_option'
      AND CONSTRAINT_NAME = 'lane_option_departmentId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk_exists > 0,
    'ALTER TABLE `lane_option` DROP FOREIGN KEY `lane_option_departmentId_fkey`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
>>>>>>> frontandback_styling

-- AlterTable
ALTER TABLE `visit` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'WAITING_TRIAGE';

-- AlterTable
ALTER TABLE `visit_status_history` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL;

-- AlterTable
ALTER TABLE `workstation` MODIFY `type` ENUM('WINDOW', 'TRIAGE', 'CALLER') NOT NULL;

-- DropTable
DROP TABLE IF EXISTS `lane_option`;

<<<<<<< HEAD
-- CreateIndex
SET @priority_category_has_template_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'priority_category'
    AND COLUMN_NAME = 'templateId'
);
SET @create_priority_category_template_unique_idx_sql := IF(
  @priority_category_has_template_id > 0,
  'CREATE UNIQUE INDEX `priority_category_departmentId_templateId_key` ON `priority_category`(`departmentId`, `templateId`)',
  'SELECT 1'
);
PREPARE create_priority_category_template_unique_idx_stmt FROM @create_priority_category_template_unique_idx_sql;
EXECUTE create_priority_category_template_unique_idx_stmt;
DEALLOCATE PREPARE create_priority_category_template_unique_idx_stmt;

-- RenameIndex
SET @priority_category_template_id_fkey_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'priority_category'
    AND INDEX_NAME = 'priority_category_templateId_fkey'
);
SET @rename_priority_category_template_id_index_sql := IF(
  @priority_category_template_id_fkey_exists > 0,
  'ALTER TABLE `priority_category` RENAME INDEX `priority_category_templateId_fkey` TO `priority_category_templateId_idx`',
  'SELECT 1'
);
PREPARE rename_priority_category_template_id_index_stmt FROM @rename_priority_category_template_id_index_sql;
EXECUTE rename_priority_category_template_id_index_stmt;
DEALLOCATE PREPARE rename_priority_category_template_id_index_stmt;
=======
>>>>>>> frontandback_styling
