import { PrismaClient } from '@prisma/client';

class TicketService {
    async generateNextTicketNumber(
        tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
        sequenceKey: string = 'DAILY_QUEUE'
    ) {
        const sequence = await tx.sequence.upsert({
            where: { name: sequenceKey },
            update: { 
                value: { increment: 1 }
            },
            create: { name: sequenceKey, value: 1 },
        });

        return sequence.value;
    }

    /**
     * Resets all daily queue sequences. 
     * To be called via manual admin trigger at 12:00 AM.
     */
    async resetAllSequences() {
        const { db } = await import('../../config/database.js');
        
        await db.$transaction(async (tx) => {
            // Reset all sequences to 0
            await tx.sequence.updateMany({
                data: { value: 0 }
            });
        });
    }
}

export const ticketService = new TicketService();
