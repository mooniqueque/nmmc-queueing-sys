import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { AuthenticatedRequest } from '../../middleware/types.js';
import { ticketPrintingService } from '../../services/ticket-printing-service.js';
import { triageService } from './service';

class TriageController {
    registerKiosk = asyncHandler(async (req: Request, res: Response) => {
        await triageService.registerKioskPatient(req.body);
        res.status(200).json({ success: true, message: 'Successfully queued for Triage.' });
    });


    submitTriage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const result = await triageService.submitTriageForm(req.body.values, req.body.visitId, userId);
        
        let printError: string | null = null;
        if (result?.triageTicket) {
            try {
                await ticketPrintingService.print(result);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown printer error occurred';
                console.error('Printer util failed:', message);
                // Store error but don't block submission
                printError = message;
            }
        }

        res.status(200).json({ success: true, data: result, printError });
    });

    markNoShow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        await triageService.markNoShow(req.params.id, userId);
        res.status(200).json({ success: true });
    });

    restoreNoShow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        await triageService.restoreNoShow(req.params.id, userId);
        res.status(200).json({ success: true });
    });

    removeQueue = asyncHandler(async (req: Request, res: Response) => {
        await triageService.removeQueue(req.params.id);
        res.status(200).json({ success: true });
    });

    getPendingQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const queue = await triageService.getPendingQueue(userId);
        res.status(200).json({ success: true, data: queue });
    });

    callNextTriage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visit = await triageService.callNextTriage(userId);
        if (!visit) {
            return res.status(200).json({ success: true, data: null, message: 'No patients waiting in triage queue.' });
        }
        res.status(200).json({ success: true, data: visit });
    });

    callSpecificTriage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.id;
        const visit = await triageService.callSpecificTriage(visitId, userId);
        res.status(200).json({ success: true, data: visit });
    });

    getMyCurrentVisit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visit = await triageService.getMyCurrentVisit(userId);
        res.status(200).json({ success: true, data: visit });
    });

    getMyAccessibleDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const departments = await triageService.getMyAccessibleDepartments(userId);
        res.status(200).json({ success: true, data: departments });
    });

    updateAppointment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const updated = await triageService.updateAppointment(req.params.id, req.body.hasAppointment, userId);
        res.status(200).json({ success: true, data: updated });
    });
}

export const triageController = new TriageController();
