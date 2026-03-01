-- AlterTable
ALTER TABLE `user` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ALTER COLUMN `department` DROP DEFAULT;
