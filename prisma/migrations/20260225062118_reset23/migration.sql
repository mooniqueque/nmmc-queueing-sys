-- AlterTable
ALTER TABLE `patient` ADD COLUMN `birthPlace` VARCHAR(191) NULL,
    ADD COLUMN `civilStatus` VARCHAR(191) NULL,
    ADD COLUMN `isRegistered` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `religion` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `visit` ADD COLUMN `hasAppointment` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `session_expiresAt_idx` ON `session`(`expiresAt`);
