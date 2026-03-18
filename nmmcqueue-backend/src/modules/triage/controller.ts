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
        res.status(200).json({ success: true, data: result });
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
}

export const triageController = new TriageController();
