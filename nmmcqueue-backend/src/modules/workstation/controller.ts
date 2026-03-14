import { Request, Response } from 'express';
import { workstationService } from './service.js';
import { WorkstationType } from '@prisma/client';

class WorkstationController {
    async getAll(req: Request, res: Response) {
        try {
            const stations = await workstationService.getAll();
            res.status(200).json({ success: true, data: stations });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const station = await workstationService.create(req.body);
            res.status(201).json({ success: true, data: station });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const station = await workstationService.update(req.params.id, req.body);
            res.status(200).json({ success: true, data: station });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await workstationService.delete(req.params.id);
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const workstationController = new WorkstationController();
