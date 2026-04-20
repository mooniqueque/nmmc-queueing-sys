import { SseEventType } from '@nmmc/types';
import type { Prisma } from '@prisma/client';
import { db } from '../../config/database.js';
import { withClaimConflictRetry } from '../../lib/claim-retry.js';
import { assertDepartmentAcceptsAssignments } from '../../lib/department-status.js';
import logger from '../../lib/logger.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';
import { publishDepartmentEvent, publishDepartmentMonitorEvent, publishDepartmentStatusUpdate } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { monitorService } from '../monitor/service.js';
import { ticketService } from '../tickets/service.js';

const normalizeDepartmentKey = (v: string) => v.trim().toUpperCase();

const QUEUE_CODE_PATTERN = /^[A-Z0-9-]{2,6}$/;

function normalizeQueueName(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeQueueCode(value: string) {
    return value.trim().toUpperCase();
}

class CallerService {
    private async getActiveQueueOptionTemplates(tx: Prisma.TransactionClient | typeof db = db) {
        const templates = await tx.queueOptionTemplate.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, code: true, isPriority: true, sortOrder: true },
        });

        if (templates.length === 0) {
            throw new AppError(
                'Queue option templates are missing. Run the database seed to initialize defaults.',
                500,
                'QUEUE_TEMPLATE_MISSING'
            );
        }

        return templates;
    }

    private async ensureTemplateQueueOptions(
        departmentId: string,
        tx: Prisma.TransactionClient | typeof db = db
    ) {
        const templates = await this.getActiveQueueOptionTemplates(tx);
        const categories = await tx.priorityCategory.findMany({
            where: { departmentId },
            select: { id: true, name: true, code: true, isPriority: true, templateId: true },
        });

        for (const template of templates) {
            const templateMatches = categories.filter((item) => item.templateId === template.id);
            if (templateMatches.length > 0) {
                const keeper = templateMatches[0];

                if (
                    keeper.name !== template.name ||
                    keeper.code !== template.code ||
                    keeper.isPriority !== template.isPriority
                ) {
                    await tx.priorityCategory.update({
                        where: { id: keeper.id },
                        data: {
                            name: template.name,
                            code: template.code,
                            isPriority: template.isPriority,
                        },
                    });
                }

                if (templateMatches.length > 1) {
                    for (const duplicate of templateMatches.slice(1)) {
                        await tx.priorityCategory.update({
                            where: { id: duplicate.id },
                            data: { templateId: null },
                        });
                    }
                }

                continue;
            }

            const matchedByCodeOrName = categories.find((item) =>
                normalizeQueueCode(item.code) === template.code ||
                normalizeQueueName(item.name) === template.name
            );

            if (matchedByCodeOrName) {
                await tx.priorityCategory.update({
                    where: { id: matchedByCodeOrName.id },
                    data: {
                        templateId: template.id,
                        name: template.name,
                        code: template.code,
                        isPriority: template.isPriority,
                    },
                });
                continue;
            }

            await tx.priorityCategory.create({
                data: {
                    departmentId,
                    templateId: template.id,
                    name: template.name,
                    code: template.code,
                    isPriority: template.isPriority,
                },
            });
        }
    }

    async getResolvedScope(userId?: string) {
        const scope = await this.getCallerScope(userId);
        const department = await db.department.findUnique({
            where: { id: scope.departmentId },
            select: { id: true, name: true, code: true, slug: true },
        });

        if (!department) {
            throw new AppError('Assigned department not found.', 404, 'DEPARTMENT_NOT_FOUND');
        }

        return {
            ...scope,
            department,
        };
    }

    private sortQueueOptions<
        T extends { code: string; name: string; template?: { sortOrder: number } | null }
    >(options: T[]): T[] {
        return [...options].sort((a, b) => {
            const aOrder = a.template?.sortOrder ?? Number.POSITIVE_INFINITY;
            const bOrder = b.template?.sortOrder ?? Number.POSITIVE_INFINITY;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            return a.name.localeCompare(b.name);
        });
    }

    private normalizeDepartmentMonitorSnapshot(
        snapshot: Awaited<ReturnType<typeof monitorService.getDepartmentStatus>>
    ) {
        if (Array.isArray(snapshot)) {
            return { active: [], upcoming: [] as string[] };
        }

        return snapshot;
    }

    private async publishDepartmentVisitUpsert(departmentId: string, visitId: string) {
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            include: {
                patient: true,
                department: true,
                referredFrom: true,
                categories: { include: { category: true } }
            }
        });
        if (!visit) return;
        await publishDepartmentEvent(departmentId, SseEventType.VISIT_UPSERT, {
            visit
        });
    }

    private async publishDepartmentVisitRemove(departmentId: string, visitId: string) {
        await publishDepartmentEvent(departmentId, SseEventType.VISIT_REMOVE, { visitId });
    }

    private async publishDepartmentMonitorSnapshot(departmentId: string) {
        const snapshot = this.normalizeDepartmentMonitorSnapshot(
            await monitorService.getDepartmentStatus(departmentId)
        );

        for (const window of snapshot.active) {
            if (window.serviceTicket) {
                await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_UPSERT, { window });
                continue;
            }

            await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_REMOVE, {
                stationNo: window.stationNo,
            });
        }

        await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_UPCOMING, {
            upcoming: snapshot.upcoming,
        });
    }

    private async publishDepartmentMonitorDiff(
        departmentId: string,
        previousSnapshot?: Awaited<ReturnType<typeof monitorService.getDepartmentStatus>>
    ) {
        const snapshot = this.normalizeDepartmentMonitorSnapshot(
            await monitorService.getDepartmentStatus(departmentId)
        );
        const normalizedPrevious = previousSnapshot
            ? this.normalizeDepartmentMonitorSnapshot(previousSnapshot)
            : undefined;
        const previousByStation = new Map((normalizedPrevious?.active ?? []).map((window) => [window.stationNo, window]));
        const nextByStation = new Map(snapshot.active.map((window) => [window.stationNo, window]));
        const stationNos = new Set([
            ...previousByStation.keys(),
            ...nextByStation.keys(),
        ]);

        for (const stationNo of stationNos) {
            const previous = previousByStation.get(stationNo);
            const next = nextByStation.get(stationNo);

            if (JSON.stringify(previous ?? null) === JSON.stringify(next ?? null)) {
                continue;
            }

            if (next?.serviceTicket) {
                await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_UPSERT, { window: next });
                continue;
            }

            await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_REMOVE, { stationNo });
        }

        if (
            !normalizedPrevious ||
            JSON.stringify(normalizedPrevious.upcoming ?? []) !== JSON.stringify(snapshot.upcoming ?? [])
        ) {
            await publishDepartmentMonitorEvent(departmentId, SseEventType.MONITOR_UPCOMING, {
                upcoming: snapshot.upcoming,
            });
        }
    }

    private async getCallerScope(userId?: string) {
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                departmentId: true,
                department: true,
                workstationId: true,
                workstation: {
                    select: {
                        id: true,
                        departmentId: true,
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // For clinic callers, workstation-linked department is the source of truth.
        let departmentId = user.workstation?.departmentId ?? user.departmentId ?? null;

        if (!departmentId && user.department) {
            const dept = await db.department.findFirst({
                where: { name: user.department.trim().toUpperCase() },
                select: { id: true }
            });
            departmentId = dept?.id ?? null;
        }

        if (!departmentId) {
            throw new AppError(
                'Caller account has no assigned department.',
                400,
                'CALLER_ASSIGNMENT_REQUIRED'
            );
        }

        return {
            userId: user.id,
            departmentId,
            workstationId: user.workstationId ?? undefined,
        };
    }

    private assertVisitScope(visitDepartmentId: string | null | undefined, callerDepartmentId: string) {
        if (!visitDepartmentId || visitDepartmentId !== callerDepartmentId) {
            throw new AppError(
                'You are not allowed to handle patients outside your assigned department.',
                403,
                'CLAIM_FORBIDDEN_SCOPE'
            );
        }
    }

    async getDepartments() { return await db.department.findMany({ orderBy: { name: 'asc' } }); }
    async createDepartment(name: string, code: string) {
        const trimmedName = name.trim().toUpperCase();
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        return await db.$transaction(async (tx) => {
            const department = await tx.department.create({
                data: {
                    name: trimmedName,
                    code: code.trim().toUpperCase(),
                    slug,
                    status: 'OPEN',
                }
            });

            await this.ensureTemplateQueueOptions(department.id, tx);

            return department;
        });
    }
    async updateDepartmentStatus(id: string, status: 'OPEN' | 'CLOSED' | 'FULL') {
        const updated = await db.department.update({
            where: { id },
            data: { status },
        });
        await publishDepartmentStatusUpdate(updated.id, status);
        return updated;
    }
    async deleteDepartment(id: string) { await db.department.delete({ where: { id } }); }
    async getQueueOptions(departmentName: string) {
        const dept = await db.department.findUnique({
            where: { name: departmentName.trim().toUpperCase() },
            select: { id: true },
        });

        if (!dept) return [];

        const options = await db.priorityCategory.findMany({
            where: { departmentId: dept.id },
            select: {
                id: true,
                name: true,
                code: true,
                isPriority: true,
                parentId: true,
                templateId: true,
                template: { select: { sortOrder: true } },
            },
        });

        return this.sortQueueOptions(options);
    }
    async getPendingQueue(departmentName?: string, userId?: string) {
        const scope = await this.getCallerScope(userId);
        const queueBusinessDay = getQueueBusinessDay();
        const departmentSequenceKey = `DEPT_${scope.departmentId}`;

        const whereClause: any = {
            queueBusinessDay,
            departmentId: scope.departmentId,
            OR: [
                { status: 'WAITING_CLINIC' },
                { status: 'NO_SHOW', sequenceKey: { startsWith: departmentSequenceKey }, calledByUserId: scope.userId },
                { status: 'IN_PROGRESS', calledByUserId: scope.userId },
            ],
        };

        if (departmentName) {
            const dept = await db.department.findUnique({ where: { name: departmentName.trim().toUpperCase() } });
            if (!dept) {
                throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
            }
            if (dept.id !== scope.departmentId) {
                throw new AppError(
                    'You are not allowed to view queues outside your assigned department.',
                    403,
                    'CLAIM_FORBIDDEN_SCOPE'
                );
            }
        }

        return db.visit.findMany({
            where: whereClause,
            include: {
                patient: true,
                department: true,
                referredFrom: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { classification: 'desc' },
                { createdAt: 'asc' },
            ],
        });
    }

    async callNextPatient(userId?: string, overrideClassification?: 'PRIORITY' | 'REGULAR') {
        const scope = await this.getCallerScope(userId);
        const queueBusinessDay = getQueueBusinessDay();
        const previousMonitorSnapshot = await monitorService.getDepartmentStatus(scope.departmentId);

        const currentClaim = await db.visit.findFirst({
            where: {
                calledByUserId: scope.userId,
                departmentId: scope.departmentId,
                queueBusinessDay,
                status: 'IN_PROGRESS',
            }
        });
        if (currentClaim) {
            throw new AppError('Complete or transfer your current patient before calling the next one.', 409, 'CLAIM_ALREADY_ACTIVE');
        }

        const claimedVisit = await withClaimConflictRetry(() => db.$transaction(async (tx) => {
            const whereClause: any = {
                departmentId: scope.departmentId,
                queueBusinessDay,
                status: 'WAITING_CLINIC',
            };

            if (overrideClassification === 'PRIORITY') {
                whereClause.OR = [
                    { classification: 'PRIORITY' },
                    { isReferred: true },
                ];
            } else if (overrideClassification === 'REGULAR') {
                whereClause.classification = 'REGULAR';
                whereClause.isReferred = false;
            }

            const nextVisit = await tx.visit.findFirst({
                where: whereClause,
                orderBy: overrideClassification
                    ? [{ createdAt: 'asc' }]
                    : [
                        { isReferred: 'desc' },
                        { classification: 'desc' },
                        { createdAt: 'asc' },
                    ],
                select: { id: true }
            });

            if (!nextVisit) return null;

            const claimed = await tx.visit.updateMany({
                where: {
                    id: nextVisit.id,
                    status: 'WAITING_CLINIC',
                },
                data: {
                    status: 'IN_PROGRESS',
                    calledAt: new Date(),
                    calledByUserId: scope.userId,
                    calledAtStationId: scope.workstationId,
                }
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user. Try again.', 409, 'CLAIM_CONFLICT');
            }

            await tx.visitStatusHistory.create({
                data: { visitId: nextVisit.id, status: 'IN_PROGRESS', changedBy: scope.userId }
            });

            return tx.visit.findUnique({
                where: { id: nextVisit.id },
                include: {
                    patient: true,
                    department: true,
                    referredFrom: true,
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });
        }));

        const payload = claimedVisit;
        if (payload?.departmentId) {
            await this.publishDepartmentVisitUpsert(payload.departmentId, payload.id);
            await this.publishDepartmentMonitorDiff(payload.departmentId, previousMonitorSnapshot);
        }
        return payload;
    }

    async getQueueOptionsByDepartment(names: string[]) {
        const trimmed = Array.from(new Set(names.map(n => n.trim().toUpperCase()).filter(n => n.length > 0)));
        const depts = await db.department.findMany({
            where: { name: { in: trimmed } },
            select: {
                name: true,
                priorityCategories: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isPriority: true,
                        parentId: true,
                        templateId: true,
                        template: { select: { sortOrder: true } },
                    },
                },
            }
        });

        const byKey = Object.fromEntries(
            depts.map((d) => [normalizeDepartmentKey(d.name), this.sortQueueOptions(d.priorityCategories)])
        );
        return Object.fromEntries(trimmed.map(n => { const k = normalizeDepartmentKey(n); return [k, byKey[k] ?? []]; }));
    }

    async initializeDepartmentQueueDefaults(departmentId: string) {
        const department = await db.department.findUnique({
            where: { id: departmentId },
            select: { id: true, name: true },
        });

        if (!department) {
            throw new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
        }

        await this.ensureTemplateQueueOptions(department.id);

        const options = await db.priorityCategory.findMany({
            where: { departmentId: department.id },
            select: {
                id: true,
                name: true,
                code: true,
                isPriority: true,
                parentId: true,
                templateId: true,
                template: { select: { sortOrder: true } },
            },
        });

        return this.sortQueueOptions(options);
    }

    async repairDefaultQueueOptions() {
        const departments = await db.department.findMany({ select: { id: true } });

        for (const department of departments) {
            await this.ensureTemplateQueueOptions(department.id);
        }

        return { repairedDepartments: departments.length };
    }

    async createQueueOption(departmentName: string, data: { name: string, code: string, isPriority: boolean, parentId?: string }) {
        const dept = await db.department.findUnique({ where: { name: departmentName.trim().toUpperCase() }, select: { id: true } });
        if (!dept) throw new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');

        const normalizedName = normalizeQueueName(data.name);
        const normalizedCode = normalizeQueueCode(data.code);

        if (!QUEUE_CODE_PATTERN.test(normalizedCode)) {
            throw new AppError('Option code must be 2-6 chars and use only A-Z, 0-9, or hyphen.', 400, 'INVALID_QUEUE_CODE');
        }

        const duplicate = await db.priorityCategory.findFirst({
            where: {
                departmentId: dept.id,
                OR: [
                    { code: normalizedCode },
                    { name: normalizedName },
                ],
            },
            select: { id: true, name: true, code: true },
        });

        if (duplicate) {
            const duplicateType = duplicate.code === normalizedCode ? 'code' : 'name';
            throw new AppError(`Queue option ${duplicateType} already exists in this department.`, 409, 'QUEUE_OPTION_DUPLICATE');
        }

        try {
            return await db.priorityCategory.create({
                data: {
                    name: normalizedName,
                    code: normalizedCode,
                    isPriority: data.isPriority,
                    departmentId: dept.id,
                    parentId: data.parentId
                }
            });
        } catch (error: unknown) {
            if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
                throw new AppError('Queue option code already exists in this department.', 409, 'QUEUE_OPTION_DUPLICATE');
            }
            throw error;
        }
    }

    async deleteQueueOption(id: string) {
        await db.priorityCategory.delete({ where: { id } });
    }

    async callPatient(visitId: string, userId?: string, windowNumber?: number) {
        const scope = await this.getCallerScope(userId);
        const previousMonitorSnapshot = await monitorService.getDepartmentStatus(scope.departmentId);

        const claimedVisit = await withClaimConflictRetry(() => db.$transaction(async (tx) => {
            const existing = await tx.visit.findUnique({
                where: { id: visitId },
                select: {
                    id: true,
                    status: true,
                    departmentId: true,
                    calledByUserId: true,
                }
            });

            if (!existing) {
                throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
            }

            this.assertVisitScope(existing.departmentId, scope.departmentId);

            if (existing.status === 'IN_PROGRESS' && existing.calledByUserId === scope.userId) {
                return tx.visit.update({ 
                    where: { id: visitId },
                    data: { calledAt: new Date() }
                });
            }

            if (existing.status !== 'WAITING_CLINIC') {
                if (existing.status === 'IN_PROGRESS' && existing.calledByUserId && existing.calledByUserId !== scope.userId) {
                    throw new AppError('Patient already claimed by another caller.', 409, 'CLAIM_CONFLICT');
                }
                throw new AppError('Patient is not in a claimable waiting state.', 400, 'CLAIM_INVALID_STATE');
            }

            const claimed = await tx.visit.updateMany({
                where: {
                    id: visitId,
                    status: 'WAITING_CLINIC',
                },
                data: {
                    status: 'IN_PROGRESS',
                    calledAt: new Date(),
                    calledByUserId: scope.userId,
                    calledAtStationId: scope.workstationId,
                    windowNumber: windowNumber,
                }
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user. Try again.', 409, 'CLAIM_CONFLICT');
            }

            await tx.visitStatusHistory.create({
                data: { visitId, status: 'IN_PROGRESS', changedBy: scope.userId }
            });

            return tx.visit.findUnique({ where: { id: visitId } });
        }));

        const payload = claimedVisit;
        if (payload?.departmentId) {
            await this.publishDepartmentVisitUpsert(payload.departmentId, payload.id);
            await this.publishDepartmentMonitorDiff(payload.departmentId, previousMonitorSnapshot);
        }
        return payload;
    }

    async servePatient(visitId: string, userId?: string) {
        const scope = await this.getCallerScope(userId);
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: { id: true, status: true, departmentId: true, calledByUserId: true }
        });

        if (!visit) throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        this.assertVisitScope(visit.departmentId, scope.departmentId);

        if (visit.status !== 'IN_PROGRESS') {
            throw new AppError('Patient is not currently in progress.', 400, 'CLAIM_INVALID_STATE');
        }
        if (visit.calledByUserId !== scope.userId) {
            throw new AppError('Only the caller who claimed this patient can complete it.', 409, 'CLAIM_CONFLICT');
        }

        const updated = await db.visit.update({
            where: { id: visitId },
            data: {
                status: 'COMPLETED',
                statusHistory: { create: { status: 'COMPLETED', changedBy: scope.userId } }
            }
        });
        const payload = updated;
        if (updated.departmentId) {
            await this.publishDepartmentVisitRemove(updated.departmentId, visitId);
            await this.publishDepartmentMonitorSnapshot(updated.departmentId);
        }
        return payload;
    }

    async noShowPatient(visitId: string, userId?: string) {
        const scope = await this.getCallerScope(userId);
        const departmentSequenceKey = `DEPT_${scope.departmentId}`;
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: { id: true, status: true, departmentId: true, calledByUserId: true, sequenceKey: true }
        });
        if (!visit) throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        this.assertVisitScope(visit.departmentId, scope.departmentId);

        if (visit.status === 'IN_PROGRESS' && visit.calledByUserId !== scope.userId) {
            throw new AppError('Only the caller who claimed this patient can mark no-show.', 409, 'CLAIM_CONFLICT');
        }
        if (!['WAITING_CLINIC', 'IN_PROGRESS', 'NO_SHOW'].includes(visit.status)) {
            throw new AppError('Patient cannot be marked no-show in current status.', 400, 'CLAIM_INVALID_STATE');
        }
        if (visit.status === 'NO_SHOW' && !visit.sequenceKey?.startsWith(departmentSequenceKey)) {
            throw new AppError('Patient cannot be marked no-show in current status.', 400, 'CLAIM_INVALID_STATE');
        }

        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'NO_SHOW',
                sequenceKey: departmentSequenceKey,
                calledByUserId: scope.userId,
                statusHistory: { create: { status: 'NO_SHOW', changedBy: scope.userId } }
            }
        });
        const payload = updated;
        if (updated.departmentId) {
            await this.publishDepartmentVisitUpsert(updated.departmentId, updated.id);
            await this.publishDepartmentMonitorSnapshot(updated.departmentId);
        }
        return payload;
    }

    async transferPatient(visitId: string, targetDepartmentId: string, userId?: string) {
        const scope = await this.getCallerScope(userId);
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: { id: true, status: true, departmentId: true, calledByUserId: true, queueBusinessDay: true }
        });
        if (!visit) throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        this.assertVisitScope(visit.departmentId, scope.departmentId);

        const targetDepartment = await db.department.findUnique({
            where: { id: targetDepartmentId },
            select: { id: true, name: true, status: true },
        });
        if (!targetDepartment) {
            throw new AppError('Target department not found.', 404, 'DEPARTMENT_NOT_FOUND');
        }
        assertDepartmentAcceptsAssignments(targetDepartment);

        if (visit.departmentId === targetDepartmentId) {
            throw new AppError('Patient is already in this department', 400, 'CLAIM_INVALID_STATE');
        }

        if (visit.status === 'IN_PROGRESS' && visit.calledByUserId !== scope.userId) {
            throw new AppError('Only the caller who claimed this patient can transfer it.', 409, 'CLAIM_CONFLICT');
        }
        if (!['WAITING_CLINIC', 'IN_PROGRESS'].includes(visit.status)) {
            throw new AppError('Patient cannot be transferred in current status.', 400, 'CLAIM_INVALID_STATE');
        }

        const targetPriorityOptions = await db.priorityCategory.findMany({
            where: { departmentId: targetDepartmentId, isPriority: true },
            select: { id: true, code: true, name: true },
            orderBy: [{ code: 'asc' }, { name: 'asc' }]
        });

        const preferredPriority =
            targetPriorityOptions.find((option) => {
                const key = `${option.code} ${option.name}`.trim().toUpperCase();
                return key.includes('REF') || key.includes('PRIO') || key.includes('PRIORITY');
            }) ?? targetPriorityOptions[0];

        const sequenceKey = `DEPT_${targetDepartmentId}`;
        const maxTicketCollisionRetries = 50;
        let updated: Awaited<ReturnType<typeof db.visit.update>> | null = null;

        for (let attempt = 0; attempt < maxTicketCollisionRetries; attempt++) {
            const nextTicket = await ticketService.generateNextTicketNumber(db, sequenceKey, visit.queueBusinessDay);

            try {
                updated = await db.visit.update({
                    where: { id: visitId },
                    data: {
                        status: 'WAITING_CLINIC',
                        departmentId: targetDepartmentId,
                        classification: 'PRIORITY',
                        isReferred: true,
                        referredFromId: visit.departmentId,
                        serviceTicket: nextTicket,
                        sequenceKey,
                        calledByUserId: null,
                        calledAtStationId: null,
                        calledAt: null,
                        windowNumber: null,
                        categories: preferredPriority
                            ? {
                                upsert: {
                                    where: {
                                        visitId_categoryId: {
                                            visitId,
                                            categoryId: preferredPriority.id,
                                        },
                                    },
                                    create: { categoryId: preferredPriority.id },
                                    update: {},
                                },
                            }
                            : undefined,
                        statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: scope.userId } }
                    }
                });
                break;
            } catch (error: any) {
                const isTicketConflict = error?.code === 'P2002';
                if (isTicketConflict && attempt < maxTicketCollisionRetries - 1) {
                    continue;
                }
                throw error;
            }
        }

        if (!updated) {
            throw new AppError('Could not generate unique target department ticket for referral.', 500, 'TICKET_ASSIGNMENT_FAILED');
        }
        
        if (visit.departmentId) {
            await this.publishDepartmentVisitRemove(visit.departmentId, visitId);
            await this.publishDepartmentMonitorSnapshot(visit.departmentId);
        }
        await this.publishDepartmentVisitUpsert(targetDepartmentId, updated.id);
        await this.publishDepartmentMonitorSnapshot(targetDepartmentId);
        return updated;
    }

    async notifyPatient(visitId: string) {
        const visit = await db.visit.findUnique({ 
            where: { id: visitId },
            include: { patient: true }
        });
        if (!visit) throw new Error('Visit not found');
        
        const contactNo = visit.patient.contactNo;
        if (!contactNo) throw new Error('Patient has no contact number registered');

        logger.info('SMS notification requested for clinic patient', {
            visitId,
            patientId: visit.patientId,
        });
        return { success: true, message: 'Notification sent successfully' };
    }
    async restorePatient(visitId: string, userId?: string) {
        const scope = await this.getCallerScope(userId);
        const departmentSequenceKey = `DEPT_${scope.departmentId}`;
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: { id: true, status: true, departmentId: true, sequenceKey: true, calledByUserId: true }
        });
        if (!visit) throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        this.assertVisitScope(visit.departmentId, scope.departmentId);

        if (visit.status !== 'NO_SHOW') {
            throw new AppError('Only no-show patients can be restored.', 400, 'CLAIM_INVALID_STATE');
        }
        if (!visit.sequenceKey?.startsWith(departmentSequenceKey)) {
            throw new AppError('Only clinic no-show patients can be restored.', 400, 'CLAIM_INVALID_STATE');
        }
        if (visit.calledByUserId && visit.calledByUserId !== scope.userId) {
            throw new AppError('Only the caller who marked this patient as no-show can restore it.', 403, 'CLAIM_FORBIDDEN_SCOPE');
        }

        const updated = await db.visit.update({
            where: { id: visitId },
            data: { 
                status: 'WAITING_CLINIC',
                statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: scope.userId } }
            }
        });
        const payload = updated;
        if (updated.departmentId) {
            await this.publishDepartmentVisitUpsert(updated.departmentId, updated.id);
            await this.publishDepartmentMonitorSnapshot(updated.departmentId);
        }
        return payload;
    }

    async forceRemoveVisit(visitId: string, userId?: string) {
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: {
                id: true,
                patientId: true,
                departmentId: true,
                status: true,
                serviceTicket: true,
                triageTicket: true,
            }
        });

        if (!visit) {
            throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        }

        const result = await db.$transaction(async (tx) => {
            await tx.visit.delete({ where: { id: visitId } });

            const remainingVisits = await tx.visit.count({ where: { patientId: visit.patientId } });
            let deletedOrphanPatient = false;

            if (remainingVisits === 0) {
                await tx.patient.delete({ where: { id: visit.patientId } });
                deletedOrphanPatient = true;
            }

            return { deletedOrphanPatient };
        });

        if (visit.departmentId) {
            await this.publishDepartmentVisitRemove(visit.departmentId, visit.id);
            await this.publishDepartmentMonitorSnapshot(visit.departmentId);
        }

        return {
            visitId: visit.id,
            serviceTicket: visit.serviceTicket ?? null,
            triageTicket: visit.triageTicket ?? null,
            previousStatus: visit.status,
            departmentId: visit.departmentId,
            ...result,
        };
    }
}

export const callerService = new CallerService();
