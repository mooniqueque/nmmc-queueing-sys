-- AlterTable
ALTER TABLE `visit` ADD COLUMN `originStationId` VARCHAR(191) NULL,
    ADD COLUMN `triageStationId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `workstation` ADD COLUMN `pairedStationId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('WINDOW', 'TRIAGE', 'CALLER', 'KIOSK') NOT NULL;

-- AddForeignKey
ALTER TABLE `workstation` ADD CONSTRAINT `workstation_pairedStationId_fkey` FOREIGN KEY (`pairedStationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_originStationId_fkey` FOREIGN KEY (`originStationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_triageStationId_fkey` FOREIGN KEY (`triageStationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
