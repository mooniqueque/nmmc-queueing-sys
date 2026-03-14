/*
  Warnings:

  - You are about to drop the column `age` on the `patient` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `status` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - You are about to alter the column `priorityClass` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `patient` DROP COLUMN `age`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `departmentId` VARCHAR(191) NULL,
    ADD COLUMN `displayUsername` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NULL,
    MODIFY `role` ENUM('ADMIN', 'TRIAGE_NURSE', 'WINDOW_CLERK', 'CLINIC_CALLER') NOT NULL,
    MODIFY `department` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `visit` ADD COLUMN `calledAt` DATETIME(3) NULL,
    ADD COLUMN `calledByUserId` VARCHAR(191) NULL,
    ADD COLUMN `isReferred` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `referredFromId` VARCHAR(191) NULL,
    ADD COLUMN `windowNumber` INTEGER NULL,
    MODIFY `status` ENUM('PENDING_TRIAGE', 'KIOSK_SUBMITTED', 'WAITING_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING_TRIAGE',
    MODIFY `priorityClass` ENUM('REGNEW', 'REGULAR', 'PRIORITY', 'CHILD', 'ER_REF', 'FT', 'REFERRALS') NOT NULL DEFAULT 'REGNEW';

-- CreateTable
CREATE TABLE `visit_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `visitId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING_TRIAGE', 'KIOSK_SUBMITTED', 'WAITING_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `changedBy` VARCHAR(191) NULL,

    INDEX `visit_status_history_visitId_idx`(`visitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lane_option` (
    `id` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `option` VARCHAR(191) NOT NULL,

    INDEX `laneOption_departmentId_fkey`(`departmentId`),
    UNIQUE INDEX `lane_option_departmentId_option_key`(`departmentId`, `option`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_username_key` ON `user`(`username`);

-- CreateIndex
CREATE INDEX `visit_calledByUserId_fkey` ON `visit`(`calledByUserId`);

-- CreateIndex
CREATE INDEX `visit_status_idx` ON `visit`(`status`);

-- CreateIndex
CREATE INDEX `visit_createdAt_idx` ON `visit`(`createdAt`);

-- CreateIndex
CREATE INDEX `visit_priorityClass_idx` ON `visit`(`priorityClass`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_referredFromId_fkey` FOREIGN KEY (`referredFromId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_calledByUserId_fkey` FOREIGN KEY (`calledByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_status_history` ADD CONSTRAINT `visit_status_history_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lane_option` ADD CONSTRAINT `lane_option_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
