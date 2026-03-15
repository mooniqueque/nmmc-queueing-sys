import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { releasingService } from './service.js';

class ReleasingController {
    getPendingQueue = asyncHandler(async (req: Request, res: Response) => {
        const queue = await releasingService.getPendingQueue();
        res.status(200).json({ success: true, data: queue });
    });

    assignTicket = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        await releasingService.assignTicket(req.params.id, req.body, userId);
        res.status(200).json({ success: true, message: 'Ticket assigned and sent to clinic.' });
    });

    callTicket = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        const updated = await releasingService.callTicket(req.params.id, userId);
        res.status(200).json({ success: true, data: updated });
    });

    noShowTicket = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        const updated = await releasingService.noShowTicket(req.params.id, userId);
        res.status(200).json({ success: true, data: updated });
    });
}

export const releasingController = new ReleasingController();
