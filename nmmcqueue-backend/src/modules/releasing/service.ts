import { db } from '../../config/database.js';
import { withClaimConflictRetry } from '../../lib/claim-retry.js';
import logger from '../../lib/logger.js';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';
import { publishDepartmentEvent, publishDepartmentMonitorEvent, publishSseEvent, SSE_TOPICS } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { assertDepartmentAcceptsAssignments } from '../../lib/department-status.js';
import { monitorService } from '../monitor/service.js';
import { ticketService } from '../tickets/service.js';
import { assignTicketSchema } from './schema.js';

async function publishWindowMonitorDiff(previousSnapshot?: Awaited<ReturnType<typeof monitorService.getWindowStatus>>) {
    const snapshot = await monitorService.getWindowStatus();
    const previousByStation = new Map((previousSnapshot?.active ?? []).map((window) => [window.stationNo, window]));
    const nextByStation = new Map(snapshot.active.map((window) => [window.stationNo, window]));
    const stationNos = new Set([
        ...previousByStation.keys(),
        ...nextByStation.keys(),
    ]);

    for (const stationNo of stationNos) {
        const previous = previousByStation.get(stationNo);
        const next = nextByStation.get(stationNo);
        const previousKey = JSON.stringify(previous ?? null);
        const nextKey = JSON.stringify(next ?? null);

        if (previousKey === nextKey) {
            continue;
        }

        if (next?.triageTicket) {
            publishSseEvent([SSE_TOPICS.MONITOR_WINDOWS], 'monitor-upsert', { window: next });
            continue;
        }

        publishSseEvent([SSE_TOPICS.MONITOR_WINDOWS], 'monitor-remove', { stationNo });
    }

    if (
        !previousSnapshot ||
        JSON.stringify(previousSnapshot.upcoming ?? []) !== JSON.stringify(snapshot.upcoming ?? [])
    ) {
        publishSseEvent([SSE_TOPICS.MONITOR_WINDOWS], 'monitor-upcoming', {
            upcoming: snapshot.upcoming,
        });
    }
}

class ReleasingService {
    /**
     * Get the window queue: WAITING_WINDOW patients sorted by priority.
     */
    async getPendingQueue() {
        const queueBusinessDay = getQueueBusinessDay();

        return db.visit.findMany({
            where: {
                queueBusinessDay,
                OR: [
                    { status: 'WAITING_WINDOW' },
                    { status: 'IN_WINDOW' },
                    {
                        status: 'NO_SHOW',
                        sequenceKey: { startsWith: 'WINDOW_' },
                    },
                ],
            },
            include: {
                patient: true,
                department: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { classification: 'desc' },  // PRIORITY first
                { createdAt: 'asc' },
            ],
        });
    }

    /**
     * CLAIM-BASED: Atomically claim the next WAITING_WINDOW patient.
     * 
     * Unified Window Rules:
     *   All Windows: Select PRIORITY first, fallback to REGULAR
     * 
     * Optional overrideClassification allows manual override.
     */
    async callNextWindow(userId: string, overrideClassification?: 'PRIORITY' | 'REGULAR') {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        if (!user?.workstationId || !user.workstation) {
            throw new AppError('You must be assigned to a workstation to call patients.', 400, 'CALLER_ASSIGNMENT_REQUIRED');
        }

        const stationNo = user.workstation.stationNo;
        const queueBusinessDay = getQueueBusinessDay();

        const baseWhere = {
            queueBusinessDay,
            status: 'WAITING_WINDOW' as const,
        };

        const previousMonitorSnapshot = await monitorService.getWindowStatus();

        const result = await withClaimConflictRetry(() => db.$transaction(async (tx) => {
            let nextVisit = null;

            if (overrideClassification) {
                // Manual override: try the requested classification first
                nextVisit = await tx.visit.findFirst({
                    where: { ...baseWhere, classification: overrideClassification },
                    orderBy: { createdAt: 'asc' },
                    include: { patient: true }
                });
            }

            if (!nextVisit) {
                // Unified Fallback Strategy: Try PRIORITY first, then fall back to REGULAR for all windows
                nextVisit = await tx.visit.findFirst({
                    where: { ...baseWhere, classification: 'PRIORITY' },
                    orderBy: { createdAt: 'asc' },
                    include: { patient: true }
                });
                
                if (!nextVisit) {
                    nextVisit = await tx.visit.findFirst({
                        where: { ...baseWhere, classification: 'REGULAR' },
                        orderBy: { createdAt: 'asc' },
                        include: { patient: true }
                    });
                }
            }

            if (!nextVisit) return null; // Queue empty

            // Atomic claim: update ONLY if status is still WAITING_WINDOW
            const claimed = await tx.visit.updateMany({
                where: {
                    id: nextVisit.id,
                    status: 'WAITING_WINDOW', // concurrency guard
                },
                data: {
                    status: 'IN_WINDOW',
                    windowClaimedById: userId,
                    windowStartedAt: new Date(),
                    calledAt: new Date(),
                    calledByUserId: userId,
                    calledAtStationId: user.workstationId,
                    windowNumber: stationNo,
                }
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user. Try again.', 409, 'CLAIM_CONFLICT');
            }

            await tx.visitStatusHistory.create({
                data: { visitId: nextVisit.id, status: 'IN_WINDOW', changedBy: userId }
            });

            // Fetch the updated visit with full relations
            const updatedVisit = await tx.visit.findUnique({
                where: { id: nextVisit.id },
                include: {
                    patient: true,
                    department: true,
                    categories: { include: { category: true } }
                }
            });

            logger.info('Window claimed patient', {
                visitId: nextVisit.id,
                userId,
                windowNumber: stationNo,
                classification: nextVisit.classification
            });

            return updatedVisit;
        }));

        if (result) {
            publishSseEvent([SSE_TOPICS.WINDOW], 'visit-upsert', { visit: result });
            await publishWindowMonitorDiff(previousMonitorSnapshot);
        }
        
        return result;
    }

    /**
     * Get the visit currently claimed by this window user (IN_WINDOW).
     */
    async getMyCurrentVisit(userId: string) {
        const queueBusinessDay = getQueueBusinessDay();

        return db.visit.findFirst({
            where: {
                windowClaimedById: userId,
                status: 'IN_WINDOW',
                queueBusinessDay,
            },
            include: {
                patient: true,
                department: true,
                categories: { include: { category: true } }
            }
        });
    }

    /**
     * Legacy callTicket (kept for backward compat, now uses claim guard).
     */
    async callTicket(visitId: string, userId: string) {
        const previousMonitorSnapshot = await monitorService.getWindowStatus();
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        const windowNumber = user?.workstation?.stationNo ?? 1;

        // Use updateMany with status guard for concurrency safety
        const claimed = await db.visit.updateMany({
            where: {
                id: visitId,
                OR: [
                    { status: 'WAITING_WINDOW' },
                    { status: 'NO_SHOW', sequenceKey: { startsWith: 'WINDOW_' } },
                    { status: 'IN_WINDOW', windowClaimedById: userId }
                ]
            },
            data: {
                status: 'IN_WINDOW',
                calledAt: new Date(),
                calledByUserId: userId,
                windowClaimedById: userId,
                windowStartedAt: new Date(),
                calledAtStationId: user?.workstationId,
                windowNumber: windowNumber,
            }
        });

        if (claimed.count === 0) {
            throw new AppError('Patient is no longer available or was already claimed.', 409, 'CLAIM_CONFLICT');
        }

        await db.visitStatusHistory.create({
            data: { visitId, status: 'IN_WINDOW', changedBy: userId }
        });

        const updated = await db.visit.findUnique({
            where: { id: visitId },
            include: { patient: true, department: true }
        });

        const payload = updated;
        publishSseEvent([SSE_TOPICS.WINDOW], 'visit-upsert', { visit: payload });
        await publishWindowMonitorDiff(previousMonitorSnapshot);
        return payload;
    }

    async noShowTicket(visitId: string, userId: string) {
        const previousMonitorSnapshot = await monitorService.getWindowStatus();
        const updated = await db.visit.updateMany({
            where: {
                id: visitId,
                status: 'IN_WINDOW',
                windowClaimedById: userId,
            },
            data: {
                status: 'NO_SHOW',
                windowClaimedById: null,
                windowStartedAt: null,
            }
        });
        if (updated.count === 0) {
            throw new AppError('Only your currently claimed window visit can be marked no-show.', 409, 'WINDOW_CLAIM_REQUIRED');
        }
        await db.visitStatusHistory.create({
            data: { visitId, status: 'NO_SHOW', changedBy: userId }
        });
        const payload = await db.visit.findUnique({
            where: { id: visitId },
            include: { patient: true, department: true }
        });
        publishSseEvent([SSE_TOPICS.WINDOW], 'visit-upsert', { visit: payload });
        await publishWindowMonitorDiff(previousMonitorSnapshot);
        return payload;
    }

    async assignTicket(visitId: string, payload: unknown, userId?: string) {
        const previousMonitorSnapshot = await monitorService.getWindowStatus();
        const data = await assignTicketSchema.parseAsync(payload);
        if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

        // Fetch category to check if it's priority
        const category = await db.priorityCategory.findUnique({
            where: { id: data.priorityClass }
        });

        const department = await db.department.findUnique({
            where: { id: data.departmentId },
            select: { id: true, name: true, status: true, code: true },
        });
        assertDepartmentAcceptsAssignments(department);

        const classification = category?.isPriority ? 'PRIORITY' : 'REGULAR';

        const visit = await db.visit.findUnique({
            where: { id: visitId },
            include: { patient: true },
        });
        if (!visit) throw new Error('Visit not found');
        if (visit.status !== 'IN_WINDOW') {
            throw new AppError('Visit must be actively claimed at the window before assignment.', 409, 'INVALID_WINDOW_STATE');
        }
        if (visit.windowClaimedById !== userId) {
            throw new AppError('Only the window clerk who claimed this visit can assign the service ticket.', 409, 'WINDOW_CLAIM_REQUIRED');
        }

        const result = await db.$transaction(async (tx) => {
            const sequenceKey = `DEPT_${data.departmentId}`;
            const nextTicket = await ticketService.generateNextTicketNumber(tx, sequenceKey, visit.queueBusinessDay);

            await tx.visit.update({
                where: { id: visitId },
                data: {
                    departmentId: data.departmentId,
                    classification: classification,
                    status: 'WAITING_CLINIC',
                    serviceTicket: nextTicket,
                    sequenceKey: sequenceKey,
                    // Clear window claim since patient is moving on
                    windowClaimedById: null,
                    windowStartedAt: null,
                    // Append the queue lane while preserving Triage priority tags
                    categories: {
                        upsert: {
                            where: { visitId_categoryId: { visitId: visitId, categoryId: data.priorityClass } },
                            create: { categoryId: data.priorityClass },
                            update: {}
                        }
                    },
                    statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
                }
            });

            return { 
                serviceTicket: nextTicket,
                triageTicket: visit.triageTicket,
                patientFullName: `${visit.patient.firstName} ${visit.patient.lastName}`.trim(),
                priorityCode: category?.code || 'REG',
                priorityName: category?.name || 'REGULAR',
                classification: classification,
                departmentCode: department?.code || 'DEPT'
            };
        });

        publishSseEvent([SSE_TOPICS.WINDOW], 'visit-remove', { visitId });
        const clinicVisit = await db.visit.findUnique({
            where: { id: visitId },
            include: {
                patient: true,
                department: true,
                referredFrom: true,
                categories: { include: { category: true } }
            }
        });
        if (clinicVisit?.departmentId) {
            await publishDepartmentEvent(clinicVisit.departmentId, 'visit-upsert', {
                visit: clinicVisit
            });
            const departmentSnapshot = await monitorService.getDepartmentStatus(clinicVisit.departmentId);
            await publishDepartmentMonitorEvent(clinicVisit.departmentId, 'monitor-upcoming', {
                upcoming: Array.isArray(departmentSnapshot) ? [] : departmentSnapshot.upcoming,
            });
        }
        await publishWindowMonitorDiff(previousMonitorSnapshot);
        return result;
    }

    async linkPatientByHospitalId(visitId: string, hospitalId: string, userId?: string) {
        if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        const trimmedHospitalId = hospitalId.trim();
        if (!trimmedHospitalId) throw new AppError('hospitalId is required', 400, 'HOSPITAL_ID_REQUIRED');

        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: {
                id: true,
                patientId: true,
                status: true,
                windowClaimedById: true,
            }
        });
        if (!visit) throw new AppError('Visit not found', 404);
        if (visit.status !== 'IN_WINDOW') {
            throw new AppError('Visit must be actively claimed at the window before linking an official patient record.', 409, 'INVALID_WINDOW_STATE');
        }
        if (visit.windowClaimedById !== userId) {
            throw new AppError('Only the window clerk who claimed this visit can link the official patient record.', 409, 'WINDOW_CLAIM_REQUIRED');
        }

        const targetPatient = await db.patient.findUnique({ where: { hospitalId: trimmedHospitalId } });
        if (!targetPatient) {
            throw new AppError('Hospital ID not found.', 404, 'HOSPITAL_ID_NOT_FOUND');
        }

        const updatedVisit = await db.$transaction(async (tx) => {
            const updated = await tx.visit.update({
                where: { id: visitId },
                data: {
                    patientId: targetPatient.id,
                    kioskRegistrationType: 'REGISTERED',
                },
                include: {
                    patient: true,
                    department: true,
                    categories: { include: { category: true } }
                }
            });

            const remainingVisits = await tx.visit.count({ where: { patientId: visit.patientId } });
            if (remainingVisits === 0) {
                await tx.patient.delete({ where: { id: visit.patientId } });
            }

            return updated;
        });

        const payload = updatedVisit;
        publishSseEvent([SSE_TOPICS.WINDOW], 'visit-upsert', { visit: payload });
        return payload;
    }
}

export const releasingService = new ReleasingService();
