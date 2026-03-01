import { Request, Response } from 'express';
import { triageService } from './service.js';

class TriageController {
    async registerKiosk(req: Request, res: Response) {
        try {
            await triageService.registerKioskPatient(req.body);
            res.status(200).json({ success: true, message: 'Successfully queued for Triage.' });
        } catch (error: any) {
            if (error.message === 'ALREADY_IN_QUEUE') {
                res.status(400).json({ success: false, error: 'Your name is already in the queue.' });
            } else {
                res.status(500).json({ success: false, error: error.message || 'Failed to submit registration.' });
            }
        }
    }

    async submitTriage(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
            await triageService.submitTriageForm(req.body.values, req.body.visitId, userId);
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'An unexpected error occurred.' });
        }
    }

    async markNoShow(req: Request, res: Response) {
        try { await triageService.markNoShow(req.params.id); res.status(200).json({ success: true }); }
        catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
    }

    async restoreNoShow(req: Request, res: Response) {
        try { await triageService.restoreNoShow(req.params.id); res.status(200).json({ success: true }); }
        catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
    }

    async removeQueue(req: Request, res: Response) {
        try { await triageService.removeQueue(req.params.id); res.status(200).json({ success: true }); }
        catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getPatientByHospitalId(req: Request, res: Response) {
        try {
            const patient = await triageService.getPatientByHospitalId(req.params.id);
            res.status(200).json({ success: true, data: patient });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    }
    async getPendingQueue(req: Request, res: Response) {
        try {
            const queue = await triageService.getPendingQueue();
            res.status(200).json({ success: true, data: queue });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch queue.' });
        }
    }
}

export const triageController = new TriageController();
