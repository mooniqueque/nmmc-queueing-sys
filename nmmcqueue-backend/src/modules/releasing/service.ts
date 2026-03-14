import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';
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
            },
            orderBy: { ticketNumber: 'asc' },
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
                windowNumber: windowNumber,
                statusHistory: { create: { status: 'IN_PROGRESS', changedBy: userId } }
            }
        });

        emitQueueUpdate('WINDOW'); // Special channel for window monitor
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
        emitQueueUpdate('WINDOW');
        return updated;
    }

    async assignTicket(visitId: string, payload: unknown, userId?: string) {
        const data = await assignTicketSchema.parseAsync(payload);

        await db.visit.update({
            where: { id: visitId },
            data: {
                departmentId: data.departmentId,
                priorityClass: data.priorityClass as any,
                status: 'WAITING_CLINIC',
                statusHistory: { create: { status: 'WAITING_CLINIC', changedBy: userId } }
            }
        });

        // Emit targeted update to this specific department
        emitQueueUpdate(data.departmentId);
        emitQueueUpdate('WINDOW'); // Clear from window monitor
    }
}

export const releasingService = new ReleasingService();
