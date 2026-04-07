import { PrismaClient } from '@prisma/client';
import { getQueueBusinessDay } from '../../lib/queue-business-day.js';

class TicketService {
    async generateNextTicketNumber(
        tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
        sequenceKey: string = 'DAILY_QUEUE',
        queueBusinessDay: string = getQueueBusinessDay()
    ) {
        const scopedSequenceKey = `${queueBusinessDay}:${sequenceKey}`;
        const sequence = await tx.sequence.upsert({
            where: { name: scopedSequenceKey },
            update: { 
                value: { increment: 1 }
            },
            create: { name: scopedSequenceKey, value: 1 },
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
            // Day-scoped sequences naturally roll over at midnight, so a manual reset
            // simply clears the sequence rows to start the day fresh.
            await tx.sequence.deleteMany({});
        });
    }
}

export const ticketService = new TicketService();
