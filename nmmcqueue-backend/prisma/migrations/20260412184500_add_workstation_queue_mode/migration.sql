-- Add queue lane mode for workstation-level strict queue routing.
ALTER TABLE `workstation`
  ADD COLUMN `queueMode` ENUM('MIXED', 'PRIORITY_ONLY', 'REGULAR_ONLY') NOT NULL DEFAULT 'MIXED';
