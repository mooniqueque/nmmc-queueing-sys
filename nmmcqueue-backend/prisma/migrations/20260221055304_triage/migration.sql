-- CreateTable
CREATE TABLE `department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `department_name_key`(`name`),
    UNIQUE INDEX `department_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `contactNo` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `ticketNumber` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_TRIAGE',
    `bloodPressure` VARCHAR(191) NULL,
    `heartRate` INTEGER NULL,
    `respiratoryRate` INTEGER NULL,
    `temperature` DOUBLE NULL,
    `oxygenSat` DOUBLE NULL,
    `hasFever` BOOLEAN NOT NULL DEFAULT false,
    `hasCough` BOOLEAN NOT NULL DEFAULT false,
    `hasColds` BOOLEAN NOT NULL DEFAULT false,
    `hasRashes` BOOLEAN NOT NULL DEFAULT false,
    `isInfectious` BOOLEAN NOT NULL DEFAULT false,
    `chiefComplaint` TEXT NULL,
    `medicalHistory` TEXT NULL,
    `triageRemarks` TEXT NULL,
    `disposition` VARCHAR(191) NULL,
    `triagedByUserId` VARCHAR(191) NULL,
    `queueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit` ADD CONSTRAINT `visit_triagedByUserId_fkey` FOREIGN KEY (`triagedByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
