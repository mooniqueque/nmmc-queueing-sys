import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { ticketService } from '../tickets/service.js';
import { assignTicketSchema } from './schema.js';

class ReleasingService {
    async getPendingQueue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: { in: ['WAITING_WINDOW', 'IN_PROGRESS', 'NO_SHOW'] },
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
            orderBy: { createdAt: 'asc' },
        });
    }

    async callTicket(visitId: string, userId: string) {
        // Find user's workstation station number
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { workstation: true }
        });

        const windowNumber = user?.workstation?.stationNo ?? 1;

        const updated = await db.visit.update({
            where: { id: visitId },
            data: {
                status: 'IN_PROGRESS',
                calledAt: new Date(),
                calledByUserId: userId,
                calledAtStationId: user?.workstationId,
                windowNumber: windowNumber,
                statusHistory: { create: { status: 'IN_PROGRESS', changedBy: userId } }
            }
        });

        await emitQueueUpdate('WINDOW');
        return updated;
    }

    async noShowTicket(visitId: string, userId: string) {
        const updated = await db.visit.update({
            where: { id: visitId },
            data: {
                status: 'NO_SHOW',
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
