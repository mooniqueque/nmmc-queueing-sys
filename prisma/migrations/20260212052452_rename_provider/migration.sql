/*
  Warnings:

  - You are about to drop the column `providerID` on the `account` table. All the data in the column will be lost.
  - Added the required column `providerId` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `account` DROP COLUMN `providerID`,
    ADD COLUMN `providerId` VARCHAR(191) NOT NULL;
