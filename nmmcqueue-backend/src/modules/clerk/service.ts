import { db } from '../../config/database.js';
import { emitQueueUpdate } from '../../lib/sse.js';
import { assignTicketSchema } from './schema.js';

class ClerkService {
    async getPendingQueue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return db.visit.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: 'WAITING_WINDOW',
            },
            include: {
                patient: true,
            },
            orderBy: { ticketNumber: 'asc' },
        });
    }

    async assignTicket(visitId: string, payload: unknown) {
        const data = await assignTicketSchema.parseAsync(payload);

        await db.visit.update({
            where: { id: visitId },
            data: {
                departmentId: data.departmentId,
                priorityClass: data.priorityClass,
                status: 'WAITING_CLINIC',
            }
        });

        emitQueueUpdate();
    }
}

export const clerkService = new ClerkService();
