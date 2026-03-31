import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { workstationService } from './service.js';

class WorkstationController {
    getAll = asyncHandler(async (req: Request, res: Response) => {
        const stations = await workstationService.getAll();
        res.status(200).json({ success: true, data: stations });
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const { type, customName, departmentId, count } = req.body;
        
        if (!type) {
            res.status(400).json({ success: false, error: 'Type is required' });
            return;
        }

        const stations = await workstationService.createWithAutoIncrement({
            type,
            customName,
            departmentId,
            count: count ? Number(count) : 1
        });
        res.status(201).json({ success: true, data: stations.length === 1 ? stations[0] : stations });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const station = await workstationService.update(req.params.id, req.body);
        res.status(200).json({ success: true, data: station });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const result = await workstationService.delete(req.params.id);
        res.status(200).json({ success: true, data: result });
    });
}

export const workstationController = new WorkstationController();
