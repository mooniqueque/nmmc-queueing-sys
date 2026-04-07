ALTER TABLE `visit`
    ADD COLUMN `queueBusinessDay` VARCHAR(10) NULL AFTER `sequenceKey`;

UPDATE `visit`
SET `queueBusinessDay` = DATE_FORMAT(COALESCE(`queueDate`, `createdAt`, NOW()), '%Y-%m-%d')
WHERE `queueBusinessDay` IS NULL;

ALTER TABLE `visit`
    MODIFY `queueBusinessDay` VARCHAR(10) NOT NULL;

CREATE INDEX `visit_queueBusinessDay_status_createdAt_idx`
    ON `visit`(`queueBusinessDay`, `status`, `createdAt`);

CREATE UNIQUE INDEX `visit_queueBusinessDay_classification_triageTicket_key`
    ON `visit`(`queueBusinessDay`, `classification`, `triageTicket`);

CREATE UNIQUE INDEX `visit_queueBusinessDay_sequenceKey_serviceTicket_key`
    ON `visit`(`queueBusinessDay`, `sequenceKey`, `serviceTicket`);
