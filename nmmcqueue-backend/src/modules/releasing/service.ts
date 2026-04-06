import { db } from '../../config/database.js';
import logger from '../../lib/logger.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { buildClaimPatch, buildReleasePatch, claimErrorCodes } from '../shared/claim-engine.js';
import { ticketService } from '../tickets/service.js';
import { parseReleasingAccess } from '../auth/releasing-access.js';
import { assignTicketSchema } from './schema.js';

class ReleasingService {
    private async getWindowScope(userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });

        if (!user?.workstationId || !user.workstation) {
            throw new AppError('You must be assigned to a workstation to call patients.', 400, claimErrorCodes.assignmentRequired);
        }

        return {
            userId,
            workstationId: user.workstationId,
            stationNo: user.workstation.stationNo,
            isPriorityWindow: user.workstation.stationNo >= 1 && user.workstation.stationNo <= 2,
        };
    }

    /**
     * Get the window queue: WAITING_WINDOW patients sorted by priority.
     */
    async getPendingQueue(userId: string) {
        const scope = await this.getWindowScope(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                OR: [
                    { status: 'WAITING_WINDOW' },
                    { status: 'NO_SHOW' },
                    { status: 'IN_WINDOW', windowClaimedById: scope.userId },
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
     * Window Rules:
     *   Window 1-2 (Priority Windows): Select PRIORITY first, fallback to REGULAR
     *   Window 3-5 (Regular Windows): Select REGULAR first, fallback to PRIORITY
     * 
     * Optional overrideClassification allows manual override.
     */
    async callNextWindow(userId: string, overrideClassification?: 'PRIORITY' | 'REGULAR') {
        const scope = await this.getWindowScope(userId);
        const stationNo = scope.stationNo;
        const isPriorityWindow = scope.isPriorityWindow;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const baseWhere = {
            createdAt: { gte: today, lt: tomorrow },
            status: 'WAITING_WINDOW' as const,
        };

        const result = await db.$transaction(async (tx) => {
            const myExistingClaim = await tx.visit.findFirst({
                where: {
                    windowClaimedById: scope.userId,
                    status: 'IN_WINDOW',
                    createdAt: { gte: today, lt: tomorrow },
                },
                include: {
                    patient: true,
                    department: true,
                    categories: { include: { category: true } },
                },
            });

            if (myExistingClaim) {
                return myExistingClaim;
            }

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
                if (isPriorityWindow) {
                    // Window 1-2: Try PRIORITY first, then fall back to REGULAR
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
                } else {
                    // Window 3-5: Try REGULAR first, then fall back to PRIORITY
                    nextVisit = await tx.visit.findFirst({
                        where: { ...baseWhere, classification: 'REGULAR' },
                        orderBy: { createdAt: 'asc' },
                        include: { patient: true }
                    });
                    if (!nextVisit) {
                        nextVisit = await tx.visit.findFirst({
                            where: { ...baseWhere, classification: 'PRIORITY' },
                            orderBy: { createdAt: 'asc' },
                            include: { patient: true }
                        });
                    }
                }
            }

            if (!nextVisit) return null; // Queue empty

            // Atomic claim: update ONLY if status is still WAITING_WINDOW
            const claimed = await tx.visit.updateMany({
                where: {
                    id: nextVisit.id,
                    status: 'WAITING_WINDOW', // concurrency guard
                },
                data: buildClaimPatch({
                    workflow: 'WINDOW',
                    userId: scope.userId,
                    workstationId: scope.workstationId,
                    stationNo,
                })
            });

            if (claimed.count === 0) {
                throw new AppError('Patient was already claimed by another user. Try again.', 409, claimErrorCodes.conflict);
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

            logger.info(`Window claimed patient: ${nextVisit.patient.firstName} ${nextVisit.patient.lastName}`, {
                visitId: nextVisit.id,
                userId,
                windowNumber: stationNo,
                isPriorityWindow,
                classification: nextVisit.classification
            });

            return updatedVisit;
        });

        if (result) {
            await emitQueueUpdate('WINDOW');
        }
        
        return result;
    }

    /**
     * Get the visit currently claimed by this window user (IN_WINDOW).
     */
    async getMyCurrentVisit(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findFirst({
            where: {
                windowClaimedById: userId,
                status: 'IN_WINDOW',
                createdAt: { gte: today, lt: tomorrow },
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
        const scope = await this.getWindowScope(userId);

        const updated = await db.$transaction(async (tx) => {
            const existing = await tx.visit.findUnique({
                where: { id: visitId },
                include: { patient: true, department: true }
            });

            if (!existing) {
                throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
            }

            if (existing.status === 'IN_WINDOW' && existing.windowClaimedById === scope.userId) {
                return existing;
            }

            if (existing.status !== 'WAITING_WINDOW' && existing.status !== 'NO_SHOW') {
                throw new AppError('Patient is no longer available or was already claimed.', 409, claimErrorCodes.conflict);
            }

            const claimed = await tx.visit.updateMany({
                where: {
                    id: visitId,
                    status: existing.status,
                },
                data: buildClaimPatch({
                    workflow: 'WINDOW',
                    userId: scope.userId,
                    workstationId: scope.workstationId,
                    stationNo: scope.stationNo,
                })
            });

            if (claimed.count === 0) {
                throw new AppError('Patient is no longer available or was already claimed.', 409, claimErrorCodes.conflict);
            }

            await tx.visitStatusHistory.create({
                data: { visitId, status: 'IN_WINDOW', changedBy: scope.userId }
            });

            return tx.visit.findUnique({
                where: { id: visitId },
                include: { patient: true, department: true }
            });
        });

        await emitQueueUpdate('WINDOW');
        return updated;
    }

    async noShowTicket(visitId: string, userId: string) {
        const scope = await this.getWindowScope(userId);
        const visit = await db.visit.findUnique({
            where: { id: visitId },
            select: { id: true, status: true, windowClaimedById: true }
        });

        if (!visit) {
            throw new AppError('Visit not found', 404, 'CLAIM_NOT_FOUND_OR_STALE');
        }

        if (visit.status === 'IN_WINDOW' && visit.windowClaimedById !== scope.userId) {
            throw new AppError('Only the user who claimed this patient can mark no-show.', 409, claimErrorCodes.conflict);
        }

        const updated = await db.visit.update({
            where: { id: visitId },
            data: {
                ...buildReleasePatch('NO_SHOW'),
                statusHistory: { create: { status: 'NO_SHOW', changedBy: scope.userId } }
            }
        });
        await emitQueueUpdate('WINDOW');
        return updated;
    }

    async assignTicket(visitId: string, payload: unknown, userId?: string) {
        if (!userId) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const scope = await this.getWindowScope(userId);
        const data = await assignTicketSchema.parseAsync(payload);

        const actingUser = await db.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                department: true,
            },
        });

        if (!actingUser) {
            throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        if (actingUser.role === 'TRIAGE_NURSE') {
            const releasingAccess = parseReleasingAccess(actingUser.department);
            const allowedDepartment = releasingAccess.find(
                (entry) => entry.departmentId === data.departmentId && entry.enabled
            );

            if (!allowedDepartment) {
                throw new AppError(
                    'You are not allowed to release to this department. Contact admin to update your Manage Releasing access.',
                    403,
                    'RELEASING_DEPARTMENT_FORBIDDEN'
                );
            }
        }

        const department = await db.department.findUnique({
            where: { id: data.departmentId }
        });

        if (!department) {
            throw new AppError('Selected department no longer exists. Please reselect department.', 400, 'DEPARTMENT_NOT_FOUND');
        }

        const visit = await db.visit.findUnique({ where: { id: visitId }, include: { patient: true } });
        if (!visit) throw new Error('Visit not found');

        if (visit.status !== 'IN_WINDOW') {
            throw new AppError('Patient is not currently in the window step.', 400, 'CLAIM_INVALID_STATE');
        }

        if (visit.windowClaimedById !== scope.userId) {
            throw new AppError('Only the assigned window owner can transfer this patient.', 409, claimErrorCodes.conflict);
        }

        let effectiveCategory = null as null | {
            id: string;
            name: string;
            code: string;
            isPriority: boolean;
            departmentId: string | null;
        };

        if (data.priorityClass) {
            const requestedCategory = await db.priorityCategory.findUnique({
                where: { id: data.priorityClass },
                select: { id: true, name: true, code: true, isPriority: true, departmentId: true }
            });

            if (requestedCategory?.departmentId === data.departmentId) {
                effectiveCategory = requestedCategory;
            }
        }

        if (!effectiveCategory) {
            const preferredPriority = visit.classification === 'PRIORITY';
            effectiveCategory = await db.priorityCategory.findFirst({
                where: {
                    departmentId: data.departmentId,
                    isPriority: preferredPriority,
                },
                orderBy: { code: 'asc' },
                select: { id: true, name: true, code: true, isPriority: true, departmentId: true }
            });
        }

        if (!effectiveCategory) {
            effectiveCategory = await db.priorityCategory.findFirst({
                where: { departmentId: data.departmentId },
                orderBy: { code: 'asc' },
                select: { id: true, name: true, code: true, isPriority: true, departmentId: true }
            });
        }

        const classification = effectiveCategory?.isPriority ? 'PRIORITY' : (visit.classification || 'REGULAR');

        const result = await db.$transaction(async (tx) => {
            const sequenceKey = `DEPT_${data.departmentId}`;
            const nextTicket = await ticketService.generateNextTicketNumber(tx, sequenceKey);

            await tx.visit.update({
                where: { id: visitId },
                data: {
                    departmentId: data.departmentId,
                    classification: classification,
                    ...buildReleasePatch('WAITING_CLINIC'),
                    windowTicketNumber: visit.ticketNumber, // Preserve the window ticket
                    ticketNumber: nextTicket,
                    sequenceKey: sequenceKey,
                    calledByUserId: null,
                    calledAtStationId: null,
                    // Link the category explicitly
                    categories: effectiveCategory
                        ? {
                            deleteMany: {},
                            create: { categoryId: effectiveCategory.id }
                        }
                        : {
                            deleteMany: {}
                        },
                    statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
                }
            });

            return { 
                ticketNumber: nextTicket, 
                patientFullName: `${visit.patient.firstName} ${visit.patient.lastName}`.trim(),
                priorityCode: effectiveCategory?.code || 'REG',
                priorityName: effectiveCategory?.name || 'REGULAR',
                classification: classification,
                departmentCode: department?.code || 'DEPT'
            };
        });

        // Emit targeted update to this specific department
        await emitQueueUpdate(data.departmentId);
        await emitQueueUpdate('WINDOW'); // Clear from window monitor
        return result;
    }
}

export const releasingService = new ReleasingService();
