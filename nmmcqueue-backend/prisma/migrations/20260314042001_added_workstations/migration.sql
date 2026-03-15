-- AlterTable
ALTER TABLE `user` ADD COLUMN `workstationId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `workstation` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('WINDOW', 'TRIAGE', 'CALLER') NOT NULL,
    `stationNo` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `departmentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workstation_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_workstationId_fkey` FOREIGN KEY (`workstationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workstation` ADD CONSTRAINT `workstation_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
