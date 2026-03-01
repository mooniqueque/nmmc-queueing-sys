import { PrismaClient } from '@prisma/client';

class TicketService {
    async generateNextTicketNumber(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) {
        const sequence = await tx.sequence.upsert({
            where: { name: 'DAILY_QUEUE' },
            update: { value: { increment: 1 } },
            create: { name: 'DAILY_QUEUE', value: 1 },
        });
        return sequence.value;
    }
}

export const ticketService = new TicketService();
