import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { releasingService } from './service.js';

class ReleasingController {
    getPendingQueue = asyncHandler(async (req: Request, res: Response) => {
        const queue = await releasingService.getPendingQueue();
        res.status(200).json({ success: true, data: queue });
    });

    callNextWindow = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const overrideClassification = req.body?.overrideClassification as 'PRIORITY' | 'REGULAR' | undefined;
        const visit = await releasingService.callNextWindow(userId, overrideClassification);
        if (!visit) {
            return res.status(200).json({ success: true, data: null, message: 'No patients waiting in window queue.' });
        }
        res.status(200).json({ success: true, data: visit });
    });

    getMyCurrentVisit = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const visit = await releasingService.getMyCurrentVisit(userId);
        res.status(200).json({ success: true, data: visit });
    });

    assignTicket = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        const result = await releasingService.assignTicket(req.params.id, req.body, userId);
        
        if (result?.ticketNumber) {
            import('../../lib/printer.js').then(({ printTicket }) => {
                printTicket({
                    station: "Registration Window",
                    label: "Clinic Queue Number",
                    ticketNumber: result.ticketNumber.toString(),
                    date: new Date().toLocaleString(),
                    footer: "Please proceed to the Clinic and wait for your number."
                }).catch(err => console.error(err));
            }).catch(err => console.error("Printer util failed to load", err));
        }

        res.status(200).json({ success: true, message: 'Ticket assigned and sent to clinic.', data: result });
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
