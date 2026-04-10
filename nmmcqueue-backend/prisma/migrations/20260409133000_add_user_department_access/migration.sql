CREATE TABLE `user_department_access` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_department_access_userId_departmentId_key`(`userId`, `departmentId`),
    INDEX `userDepartmentAccess_departmentId_fkey`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_department_access`
    ADD CONSTRAINT `user_department_access_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_department_access`
    ADD CONSTRAINT `user_department_access_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
