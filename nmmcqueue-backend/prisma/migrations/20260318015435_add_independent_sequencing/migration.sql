/*
  Warnings:

  - You are about to drop the column `priorityClass` on the `visit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[queueDate,sequenceKey,ticketNumber]` on the table `visit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sequence` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `visit_priorityClass_idx` ON `visit`;

-- AlterTable
ALTER TABLE `department` ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    ADD COLUMN `videoUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sequence` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `prefix` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `visit` DROP COLUMN `priorityClass`,
    ADD COLUMN `calledAtStationId` VARCHAR(191) NULL,
    ADD COLUMN `classification` ENUM('REGULAR', 'PRIORITY') NOT NULL DEFAULT 'REGULAR',
    ADD COLUMN `kioskRegistrationType` VARCHAR(191) NULL DEFAULT 'UNREGISTERED',
    ADD COLUMN `sequenceKey` VARCHAR(191) NULL,
    ADD COLUMN `windowTicketNumber` INTEGER NULL,
    MODIFY `ticketNumber` INTEGER NULL;

-- CreateTable
CREATE TABLE `priority_category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isPriority` BOOLEAN NOT NULL DEFAULT false,
    `departmentId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,

    UNIQUE INDEX `priority_category_departmentId_code_key`(`departmentId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_priority_category` (
    `visitId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`visitId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `department_slug_key` ON `department`(`slug`);

-- CreateIndex
CREATE INDEX `visit_status_createdAt_idx` ON `visit`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `visit_patientId_status_idx` ON `visit`(`patientId`, `status`);

-- CreateIndex
CREATE INDEX `visit_departmentId_status_createdAt_idx` ON `visit`(`departmentId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `visit_classification_idx` ON `visit`(`classification`);

-- CreateIndex
CREATE UNIQUE INDEX `visit_queueDate_sequenceKey_ticketNumber_key` ON `visit`(`queueDate`, `sequenceKey`, `ticketNumber`);

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_calledAtStationId_fkey` FOREIGN KEY (`calledAtStationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_category` ADD CONSTRAINT `priority_category_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `priority_category` ADD CONSTRAINT `priority_category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `priority_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_priority_category` ADD CONSTRAINT `visit_priority_category_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_priority_category` ADD CONSTRAINT `visit_priority_category_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `priority_category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
