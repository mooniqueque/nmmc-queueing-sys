-- CreateIndex
CREATE INDEX `visit_windowNumber_status_createdAt_calledAt_idx` ON `visit`(`windowNumber`, `status`, `createdAt`, `calledAt`);

-- CreateIndex
CREATE INDEX `visit_windowClaimedById_status_createdAt_idx` ON `visit`(`windowClaimedById`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `visit_triageClaimedById_status_createdAt_idx` ON `visit`(`triageClaimedById`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `visit_departmentId_status_queueDate_idx` ON `visit`(`departmentId`, `status`, `queueDate`);
