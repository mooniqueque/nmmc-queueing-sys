import { Request, Response } from 'express';
import { clerkService } from './service.js';

class ClerkController {
    async getPendingQueue(req: Request, res: Response) {
        try {
            const queue = await clerkService.getPendingQueue();
            res.status(200).json({ success: true, data: queue });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async assignTicket(req: Request, res: Response) {
        try {
            await clerkService.assignTicket(req.params.id, req.body);
            res.status(200).json({ success: true, message: 'Ticket assigned and sent to clinic.' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

export const clerkController = new ClerkController();
