/*
  Warnings:

  - Added the required column `age` to the `patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `patient` ADD COLUMN `age` INTEGER NOT NULL;
