import { Request, Response } from 'express';
import { releasingService } from './service.js';

class ReleasingController {
    async getPendingQueue(req: Request, res: Response) {
        try {
            const queue = await releasingService.getPendingQueue();
            res.status(200).json({ success: true, data: queue });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async assignTicket(req: Request, res: Response) {
        try {
            await releasingService.assignTicket(req.params.id, req.body, (req as any).user?.id);
            res.status(200).json({ success: true, message: 'Ticket assigned and sent to clinic.' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async callTicket(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const updated = await releasingService.callTicket(req.params.id, userId);
            res.status(200).json({ success: true, data: updated });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    async noShowTicket(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const updated = await releasingService.noShowTicket(req.params.id, userId);
            res.status(200).json({ success: true, data: updated });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

export const releasingController = new ReleasingController();
