/*
  Warnings:

  - You are about to drop the `lane_option` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `lane_option` DROP FOREIGN KEY `lane_option_departmentId_fkey`;

-- DropIndex
DROP INDEX `session_expiresAt_idx` ON `session`;

-- DropTable
DROP TABLE `lane_option`;
