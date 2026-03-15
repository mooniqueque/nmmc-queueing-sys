import { PrismaClient } from '@prisma/client';

class TicketService {
    async generateNextTicketNumber(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) {
        // Step 1: Lock the sequence row specifically for this transaction (SELECT FOR UPDATE equivalent in Prisma)
        // Note: Prisma upsert/update handles atomic increments well, but for safety with custom logic
        // we can ensure the sequence exists and is locked.
        const sequence = await tx.sequence.upsert({
            where: { name: 'DAILY_QUEUE' },
            update: { 
                value: { increment: 1 }
            },
            create: { name: 'DAILY_QUEUE', value: 1 },
        });

        return sequence.value;
    }

    /**
     * Resets the daily queue sequence. 
     * To be called via manual admin trigger at 12:00 AM (or whenever audits are done).
     */
    async resetDailySequence() {
        const { db } = await import('../../config/database.js');
        
        await db.$transaction(async (tx) => {
            // 1. Reset the sequence to 0
            await tx.sequence.upsert({
                where: { name: 'DAILY_QUEUE' },
                update: { value: 0 },
                create: { name: 'DAILY_QUEUE', value: 0 }
            });

            // 2. Clear all visits that are in a "queueable" state for today
            // Note: We might want to mark them as 'CANCELLED' or just keep them but they won't show 
            // because the reset usually happens between shifts.
            // For a hard reset, we'll keep the records but they won't interfere with the new sequence.
        });
    }
}

export const ticketService = new TicketService();
