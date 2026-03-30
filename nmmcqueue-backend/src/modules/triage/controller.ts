import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { triageService } from './service';

class TriageController {
    registerKiosk = asyncHandler(async (req: Request, res: Response) => {
        await triageService.registerKioskPatient(req.body);
        res.status(200).json({ success: true, message: 'Successfully queued for Triage.' });
    });

    submitTriage = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const result = await triageService.submitTriageForm(req.body.values, req.body.visitId, userId);
        
        let printError: string | null = null;
        if (result?.ticketNumber) {
            const prefix1 = result.classification === 'PRIORITY' ? 'PRIO' : 'REG';
            const formattedTicket = `${prefix1}-${result.ticketNumber.toString().padStart(2, '0')}`;
            const windowAssignment = result.classification === 'PRIORITY' ? 'Proceed to Window 1' : 'Proceed to Window 4';

            try {
                const { printTicket } = await import('../../lib/printer.js');
                await printTicket({
                    station: "Triage Station",
                    label: "Window Queue Number",
                    ticketNumber: formattedTicket,
                    date: new Date().toLocaleString(),
                    windowAssignment: windowAssignment,
                    footer: "Please wait for your number to be called at the Window."
                });
            } catch (err: any) {
                console.error("Printer util failed:", err);
                // Store error but don't block submission
                printError = err.message || 'Unknown printer error occurred';
            }
        }

        res.status(200).json({ success: true, data: result, printError });
    });

    markNoShow = asyncHandler(async (req: Request, res: Response) => {
        await triageService.markNoShow(req.params.id);
        res.status(200).json({ success: true });
    });

    restoreNoShow = asyncHandler(async (req: Request, res: Response) => {
        await triageService.restoreNoShow(req.params.id);
        res.status(200).json({ success: true });
    });

    removeQueue = asyncHandler(async (req: Request, res: Response) => {
        await triageService.removeQueue(req.params.id);
        res.status(200).json({ success: true });
    });

    getPatientByHospitalId = asyncHandler(async (req: Request, res: Response) => {
        const patient = await triageService.getPatientByHospitalId(req.params.id);
        res.status(200).json({ success: true, data: patient });
    });

    getPendingQueue = asyncHandler(async (req: Request, res: Response) => {
        const queue = await triageService.getPendingQueue();
        res.status(200).json({ success: true, data: queue });
    });

    callNextTriage = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const visit = await triageService.callNextTriage(userId);
        if (!visit) {
            return res.status(200).json({ success: true, data: null, message: 'No patients waiting in triage queue.' });
        }
        res.status(200).json({ success: true, data: visit });
    });

    getMyCurrentVisit = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const visit = await triageService.getMyCurrentVisit(userId);
        res.status(200).json({ success: true, data: visit });
    });
}

export const triageController = new TriageController();
