/*
  Warnings:

  - You are about to alter the column `status` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(6))`.
  - The values [KIOSK_SUBMITTED] on the enum `visit_status_history_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [KIOSK] on the enum `workstation_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `lane_option` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[departmentId,templateId]` on the table `priority_category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `lane_option` DROP FOREIGN KEY `lane_option_departmentId_fkey`;

-- AlterTable
ALTER TABLE `visit` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'WAITING_TRIAGE';

-- AlterTable
ALTER TABLE `visit_status_history` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL;

-- AlterTable
ALTER TABLE `workstation` MODIFY `type` ENUM('WINDOW', 'TRIAGE', 'CALLER') NOT NULL;

-- DropTable
DROP TABLE `lane_option`;

-- CreateIndex
CREATE UNIQUE INDEX `priority_category_departmentId_templateId_key` ON `priority_category`(`departmentId`, `templateId`);

-- RenameIndex
ALTER TABLE `priority_category` RENAME INDEX `priority_category_templateId_fkey` TO `priority_category_templateId_idx`;
