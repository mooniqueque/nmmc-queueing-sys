-- AlterTable
ALTER TABLE `workstation`
    ADD COLUMN `parentWorkstationId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `workstation_parentWorkstationId_fkey` ON `workstation`(`parentWorkstationId`);

-- AddForeignKey
ALTER TABLE `workstation`
    ADD CONSTRAINT `workstation_parentWorkstationId_fkey`
    FOREIGN KEY (`parentWorkstationId`) REFERENCES `workstation`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
