-- Add global queue status to departments
ALTER TABLE `department`
    ADD COLUMN `status` ENUM('OPEN', 'CLOSED', 'FULL') NOT NULL DEFAULT 'OPEN';
