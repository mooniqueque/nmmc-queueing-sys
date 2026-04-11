import type { TicketPrintPayload } from '@nmmc/types';
import { ticketPrintingService } from '../services/ticket-printing-service.js';

export async function printTicket(data: TicketPrintPayload): Promise<void> {
    await ticketPrintingService.printPayload(data);
}
