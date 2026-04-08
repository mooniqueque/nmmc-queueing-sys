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

        if (result?.serviceTicket) {
            const formattedTicket = `${result.departmentCode} - ${result.serviceTicket.toString().padStart(2, '0')}`;

            let labelText = "REGULAR";
            if (result.classification === "PRIORITY") {
                const upperName = (result.priorityName || "").toUpperCase();
                if (upperName === "PRIORITY" || upperName === "PRIORITY CLASS" || !upperName) {
                    labelText = "PRIORITY";
                } else {
                    labelText = `PRIO: ${upperName}`;
                }
            }

            try {
                const { printTicket } = await import('../../lib/printer.js');
                await printTicket({
                    station: "Releasing Window",
                    label: labelText,
                    labelBold: true,
                    displayNumber: formattedTicket,
                    date: new Date().toLocaleString(),
                    footer: "This ticket is valid for today only."
                });
            } catch (err: any) {
                console.error("Printer util failed:", err);
                // Non-blocking but we can log the hardware print error
            }
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

    linkPatient = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        const updated = await releasingService.linkPatientByHospitalId(req.params.id, req.body.hospitalId, userId);
        res.status(200).json({ success: true, data: updated });
    });
}

export const releasingController = new ReleasingController();
