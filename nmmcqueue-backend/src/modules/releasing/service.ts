import { db } from '../../config/database.js';
import logger from '../../lib/logger.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { AppError } from '../../middleware/error-handler.js';
import { ticketService } from '../tickets/service.js';
import { assignTicketSchema } from './schema.js';

class ReleasingService {
    /**
     * Get the window queue: WAITING_WINDOW patients sorted by priority.
     */
    async getPendingQueue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: { in: ['WAITING_WINDOW', 'IN_WINDOW', 'NO_SHOW'] },
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
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        if (!user?.workstationId || !user.workstation) {
            throw new AppError('You must be assigned to a workstation to call patients.', 400);
        }

        const stationNo = user.workstation.stationNo;
        const isPriorityWindow = stationNo >= 1 && stationNo <= 2;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const baseWhere = {
            createdAt: { gte: today, lt: tomorrow },
            status: 'WAITING_WINDOW' as const,
        };

        return db.$transaction(async (tx) => {
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
                throw new AppError('Patient was already claimed by another user. Try again.', 409);
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
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });
        const windowNumber = user?.workstation?.stationNo ?? 1;

        // Use updateMany with status guard for concurrency safety
        const claimed = await db.visit.updateMany({
            where: {
                id: visitId,
                status: 'WAITING_WINDOW', // Only claim if still waiting
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
            throw new AppError('Patient is no longer available or was already claimed.', 409);
        }

        await db.visitStatusHistory.create({
            data: { visitId, status: 'IN_WINDOW', changedBy: userId }
        });

        const updated = await db.visit.findUnique({
            where: { id: visitId },
            include: { patient: true, department: true }
        });

        await emitQueueUpdate('WINDOW');
        return updated;
    }

    async noShowTicket(visitId: string, userId: string) {
        const updated = await db.visit.update({
            where: { id: visitId },
            data: {
                status: 'NO_SHOW',
                windowClaimedById: null,
                windowStartedAt: null,
                statusHistory: { create: { status: 'NO_SHOW', changedBy: userId } }
            }
        });
        await emitQueueUpdate('WINDOW');
        return updated;
    }

    async assignTicket(visitId: string, payload: unknown, userId?: string) {
        const data = await assignTicketSchema.parseAsync(payload);

        // Fetch category to check if it's priority
        const category = await db.priorityCategory.findUnique({
            where: { id: data.priorityClass }
        });

        const classification = category?.isPriority ? 'PRIORITY' : 'REGULAR';

        const visit = await db.visit.findUnique({ where: { id: visitId }, include: { patient: true } });
        if (!visit) throw new Error('Visit not found');

        const result = await db.$transaction(async (tx) => {
            const sequenceKey = `DEPT_${data.departmentId}`;
            const nextTicket = await ticketService.generateNextTicketNumber(tx, sequenceKey);

            await tx.visit.update({
                where: { id: visitId },
                data: {
                    departmentId: data.departmentId,
                    classification: classification,
                    status: 'WAITING_CLINIC',
                    windowTicketNumber: visit.ticketNumber, // Preserve the window ticket
                    ticketNumber: nextTicket,
                    sequenceKey: sequenceKey,
                    // Clear window claim since patient is moving on
                    windowClaimedById: null,
                    windowStartedAt: null,
                    // Link the category explicitly
                    categories: {
                        deleteMany: {},
                        create: { categoryId: data.priorityClass }
                    },
                    statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
                }
            });

            return { ticketNumber: nextTicket, patientFullName: `${visit.patient.firstName} ${visit.patient.lastName}`.trim() };
        });

        // Emit targeted update to this specific department
        await emitQueueUpdate(data.departmentId);
        await emitQueueUpdate('WINDOW'); // Clear from window monitor
        return result;
    }
}

export const releasingService = new ReleasingService();
