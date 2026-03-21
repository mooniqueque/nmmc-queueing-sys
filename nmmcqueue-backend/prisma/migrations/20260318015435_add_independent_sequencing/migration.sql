/*
    NOTE:
    This migration was made idempotent because some environments have partial
    schema drift from branch switches. Each operation is guarded so re-running
    this migration converges to the intended schema safely.
*/

SET @schema := DATABASE();

-- Drop legacy index only when present.
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_priorityClass_idx'
);
SET @sql := IF(@exists > 0, 'DROP INDEX `visit_priorityClass_idx` ON `visit`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- department.slug
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'department'
            AND column_name = 'slug'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `department` ADD COLUMN `slug` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- department.videoUrl
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'department'
            AND column_name = 'videoUrl'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `department` ADD COLUMN `videoUrl` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `department`
SET `slug` = LOWER(TRIM(`code`))
WHERE `slug` IS NULL OR `slug` = '';

ALTER TABLE `department`
        MODIFY `slug` VARCHAR(191) NOT NULL;

-- sequence.description
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'sequence'
            AND column_name = 'description'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `sequence` ADD COLUMN `description` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sequence.prefix
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'sequence'
            AND column_name = 'prefix'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `sequence` ADD COLUMN `prefix` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sequence.updatedAt
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'sequence'
            AND column_name = 'updatedAt'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `sequence` ADD COLUMN `updatedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `sequence`
SET `updatedAt` = NOW(3)
WHERE `updatedAt` IS NULL;

ALTER TABLE `sequence`
        MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- visit.priorityClass (legacy)
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'priorityClass'
);
SET @sql := IF(@exists > 0, 'ALTER TABLE `visit` DROP COLUMN `priorityClass`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- visit.calledAtStationId
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'calledAtStationId'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD COLUMN `calledAtStationId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- visit.classification
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'classification'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD COLUMN `classification` ENUM(''REGULAR'', ''PRIORITY'') NOT NULL DEFAULT ''REGULAR''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- visit.kioskRegistrationType
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'kioskRegistrationType'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD COLUMN `kioskRegistrationType` VARCHAR(191) NULL DEFAULT ''UNREGISTERED''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- visit.sequenceKey
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'sequenceKey'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD COLUMN `sequenceKey` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- visit.windowTicketNumber
SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND column_name = 'windowTicketNumber'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD COLUMN `windowTicketNumber` INTEGER NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `visit`
SET `classification` = 'REGULAR'
WHERE `classification` IS NULL;

UPDATE `visit`
SET `kioskRegistrationType` = 'UNREGISTERED'
WHERE `kioskRegistrationType` IS NULL;

ALTER TABLE `visit`
        MODIFY `ticketNumber` INTEGER NULL,
        MODIFY `classification` ENUM('REGULAR', 'PRIORITY') NOT NULL DEFAULT 'REGULAR',
        MODIFY `kioskRegistrationType` VARCHAR(191) NULL DEFAULT 'UNREGISTERED';

CREATE TABLE IF NOT EXISTS `priority_category` (
        `id` VARCHAR(191) NOT NULL,
        `name` VARCHAR(191) NOT NULL,
        `code` VARCHAR(191) NOT NULL,
        `isPriority` BOOLEAN NOT NULL DEFAULT false,
        `departmentId` VARCHAR(191) NULL,
        `parentId` VARCHAR(191) NULL,
        UNIQUE INDEX `priority_category_departmentId_code_key`(`departmentId`, `code`),
        PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visit_priority_category` (
        `visitId` VARCHAR(191) NOT NULL,
        `categoryId` VARCHAR(191) NOT NULL,
        PRIMARY KEY (`visitId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'department'
            AND index_name = 'department_slug_key'
);
SET @sql := IF(@exists = 0, 'CREATE UNIQUE INDEX `department_slug_key` ON `department`(`slug`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_status_createdAt_idx'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX `visit_status_createdAt_idx` ON `visit`(`status`, `createdAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_patientId_status_idx'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX `visit_patientId_status_idx` ON `visit`(`patientId`, `status`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_departmentId_status_createdAt_idx'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX `visit_departmentId_status_createdAt_idx` ON `visit`(`departmentId`, `status`, `createdAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_classification_idx'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX `visit_classification_idx` ON `visit`(`classification`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = @schema
            AND table_name = 'visit'
            AND index_name = 'visit_queueDate_sequenceKey_ticketNumber_key'
);
SET @sql := IF(@exists = 0, 'CREATE UNIQUE INDEX `visit_queueDate_sequenceKey_ticketNumber_key` ON `visit`(`queueDate`, `sequenceKey`, `ticketNumber`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_schema = @schema
            AND table_name = 'visit'
            AND constraint_name = 'visit_calledAtStationId_fkey'
            AND constraint_type = 'FOREIGN KEY'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit` ADD CONSTRAINT `visit_calledAtStationId_fkey` FOREIGN KEY (`calledAtStationId`) REFERENCES `workstation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_schema = @schema
            AND table_name = 'priority_category'
            AND constraint_name = 'priority_category_departmentId_fkey'
            AND constraint_type = 'FOREIGN KEY'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `priority_category` ADD CONSTRAINT `priority_category_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_schema = @schema
            AND table_name = 'priority_category'
            AND constraint_name = 'priority_category_parentId_fkey'
            AND constraint_type = 'FOREIGN KEY'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `priority_category` ADD CONSTRAINT `priority_category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `priority_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_schema = @schema
            AND table_name = 'visit_priority_category'
            AND constraint_name = 'visit_priority_category_visitId_fkey'
            AND constraint_type = 'FOREIGN KEY'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit_priority_category` ADD CONSTRAINT `visit_priority_category_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
        SELECT COUNT(*)
        FROM information_schema.table_constraints
        WHERE constraint_schema = @schema
            AND table_name = 'visit_priority_category'
            AND constraint_name = 'visit_priority_category_categoryId_fkey'
            AND constraint_type = 'FOREIGN KEY'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE `visit_priority_category` ADD CONSTRAINT `visit_priority_category_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `priority_category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
