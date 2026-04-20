/*
  Warnings:

  - You are about to alter the column `status` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(6))`.
  - The values [KIOSK_SUBMITTED] on the enum `visit_status_history_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [KIOSK] on the enum `workstation_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `lane_option` table. If the table is not empty, all the data it contains will be lost.
*/
-- DropForeignKey
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

-- AlterTable
ALTER TABLE `visit` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'WAITING_TRIAGE';

-- AlterTable
ALTER TABLE `visit_status_history` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL;

-- AlterTable
ALTER TABLE `workstation` MODIFY `type` ENUM('WINDOW', 'TRIAGE', 'CALLER') NOT NULL;

-- DropTable
DROP TABLE IF EXISTS `lane_option`;

