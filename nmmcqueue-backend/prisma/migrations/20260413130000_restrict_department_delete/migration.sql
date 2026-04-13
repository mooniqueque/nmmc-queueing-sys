-- AlterTable
ALTER TABLE `visit` DROP FOREIGN KEY `visit_departmentId_fkey`;
ALTER TABLE `visit` ADD CONSTRAINT `visit_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
