import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { workstationService } from './service.js';

class WorkstationController {
    getAll = asyncHandler(async (req: Request, res: Response) => {
        const stations = await workstationService.getAll();
        res.status(200).json({ success: true, data: stations });
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const station = await workstationService.create(req.body);
        res.status(201).json({ success: true, data: station });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const station = await workstationService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: station });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        await workstationService.delete(req.params.id);
        res.status(200).json({ success: true });
    });
}

export const workstationController = new WorkstationController();
