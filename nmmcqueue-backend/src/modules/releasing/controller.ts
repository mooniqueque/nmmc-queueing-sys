import type { VisitClassification } from '@nmmc/types';
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { AuthenticatedRequest } from '../../middleware/types.js';
import { ticketPrintingService } from '../../services/ticket-printing-service.js';
import { releasingService } from './service.js';

class ReleasingController {
    getPendingQueue = asyncHandler(async (req: Request, res: Response) => {
        const queue = await releasingService.getPendingQueue();
        res.status(200).json({ success: true, data: queue });
    });

    callNextWindow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const overrideClassification = req.body?.overrideClassification as 'PRIORITY' | 'REGULAR' | undefined;
        const visit = await releasingService.callNextWindow(userId, overrideClassification);
        if (!visit) {
            return res.status(200).json({ success: true, data: null, message: 'No patients waiting in window queue.' });
        }
        res.status(200).json({ success: true, data: visit });
    });

    getMyCurrentVisit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visit = await releasingService.getMyCurrentVisit(userId);
        res.status(200).json({ success: true, data: visit });
    });

    assignTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const result = await releasingService.assignTicket(req.params.id, req.body, userId);

        if (result?.serviceTicket) {
            try {
                await ticketPrintingService.print({
                    type: 'releasing',
                    serviceTicket: result.serviceTicket,
                    departmentCode: result.departmentCode,
                    classification: result.classification as VisitClassification,
                    priorityName: result.priorityName,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown printer error occurred';
                console.error('Printer util failed:', message);
                // Non-blocking but we can log the hardware print error
            }
        }

        res.status(200).json({ success: true, message: 'Ticket assigned and sent to clinic.', data: result });
    });

    callTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const updated = await releasingService.callTicket(req.params.id, userId);
        res.status(200).json({ success: true, data: updated });
    });

    noShowTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const updated = await releasingService.noShowTicket(req.params.id, userId);
        res.status(200).json({ success: true, data: updated });
    });

    linkPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const updated = await releasingService.linkPatientByHospitalId(req.params.id, req.body.hospitalId, userId);
        res.status(200).json({ success: true, data: updated });
    });

    updatePatientDemographics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const updated = await releasingService.updatePatientDemographics(req.params.id, req.body, userId);
        res.status(200).json({ success: true, data: updated });
    });
}

export const releasingController = new ReleasingController();
