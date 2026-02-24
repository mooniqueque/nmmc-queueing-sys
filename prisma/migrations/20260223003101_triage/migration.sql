/*
  Warnings:

  - A unique constraint covering the columns `[hospitalId]` on the table `patient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `patient` ADD COLUMN `hospitalId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `patient_hospitalId_key` ON `patient`(`hospitalId`);
