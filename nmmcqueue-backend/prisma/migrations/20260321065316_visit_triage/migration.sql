/*
  Warnings:

  - You are about to alter the column `status` on the `visit` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(4))`.
  - The values [PENDING_TRIAGE,KIOSK_SUBMITTED] on the enum `visit_status_history_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `visit` ADD COLUMN `triageClaimedById` VARCHAR(191) NULL,
    ADD COLUMN `triageStartedAt` DATETIME(3) NULL,
    ADD COLUMN `windowClaimedById` VARCHAR(191) NULL,
    ADD COLUMN `windowStartedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'WAITING_TRIAGE';

-- AlterTable
ALTER TABLE `visit_status_history` MODIFY `status` ENUM('WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW') NOT NULL;

-- CreateIndex
CREATE INDEX `visit_departmentId_fkey` ON `visit`(`departmentId`);

-- CreateIndex
CREATE INDEX `visit_patientId_fkey` ON `visit`(`patientId`);

-- CreateIndex
CREATE INDEX `visit_status_classification_createdAt_idx` ON `visit`(`status`, `classification`, `createdAt`);

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_triageClaimedById_fkey` FOREIGN KEY (`triageClaimedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_windowClaimedById_fkey` FOREIGN KEY (`windowClaimedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
