ALTER TABLE `visit`
    MODIFY `status` ENUM(
        'KIOSK_SUBMITTED',
        'WAITING_TRIAGE',
        'IN_TRIAGE',
        'WAITING_WINDOW',
        'IN_WINDOW',
        'WAITING_CLINIC',
        'IN_PROGRESS',
        'COMPLETED',
        'NO_SHOW'
    ) NOT NULL DEFAULT 'KIOSK_SUBMITTED',
    ADD COLUMN `triageTicket` INTEGER NULL AFTER `departmentId`,
    ADD COLUMN `serviceTicket` INTEGER NULL AFTER `triageTicket`;

UPDATE `visit`
SET
    `triageTicket` = CASE
        WHEN `windowTicketNumber` IS NOT NULL THEN `windowTicketNumber`
        WHEN `status` IN ('WAITING_WINDOW', 'IN_WINDOW') THEN `ticketNumber`
        ELSE NULL
    END,
    `serviceTicket` = CASE
        WHEN `windowTicketNumber` IS NOT NULL THEN `ticketNumber`
        WHEN `status` IN ('WAITING_CLINIC', 'IN_PROGRESS', 'COMPLETED') THEN `ticketNumber`
        ELSE NULL
    END;

ALTER TABLE `visit`
    DROP INDEX `visit_queueDate_sequenceKey_ticketNumber_key`,
    DROP COLUMN `windowTicketNumber`,
    DROP COLUMN `ticketNumber`;

CREATE INDEX `visit_status_triageTicket_createdAt_idx` ON `visit`(`status`, `triageTicket`, `createdAt`);
CREATE INDEX `visit_status_serviceTicket_createdAt_idx` ON `visit`(`status`, `serviceTicket`, `createdAt`);
