-- CreateTable
CREATE TABLE `queue_option_template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isPriority` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `queue_option_template_code_key`(`code`),
    UNIQUE INDEX `queue_option_template_name_key`(`name`),
    UNIQUE INDEX `queue_option_template_sortOrder_key`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add templateId to priority_category
ALTER TABLE `priority_category`
    ADD COLUMN `templateId` VARCHAR(191) NULL;

CREATE INDEX `priority_category_templateId_fkey` ON `priority_category`(`templateId`);

ALTER TABLE `priority_category`
    ADD CONSTRAINT `priority_category_templateId_fkey`
    FOREIGN KEY (`templateId`) REFERENCES `queue_option_template`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed canonical templates in the requested order
INSERT INTO `queue_option_template`
    (`id`, `name`, `code`, `isPriority`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
    (UUID(), 'REGULAR', 'REG', false, 1, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'SENIOR CITIZEN', 'SNR', true, 2, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'PERSON WITH DISABILITY', 'PWD', true, 3, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'PREGNANT', 'PREG', true, 4, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'CHILD', 'CHD', true, 5, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'ER-REFERRAL', 'ER-REF', true, 6, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Backfill template links for existing categories by code or name
UPDATE `priority_category` pc
JOIN `queue_option_template` qt
  ON UPPER(pc.code) = qt.code
  OR UPPER(pc.name) = qt.name
SET pc.templateId = qt.id
WHERE pc.templateId IS NULL;
