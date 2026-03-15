import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { monitorService } from './service.js';

class MonitorController {
    getWindowStatus = asyncHandler(async (req: Request, res: Response) => {
        const status = await monitorService.getWindowStatus();
        res.status(200).json({ success: true, data: status });
    });

    getDepartmentStatus = asyncHandler(async (req: Request, res: Response) => {
        const { departmentId } = req.params;
        const status = await monitorService.getDepartmentStatus(departmentId);
        res.status(200).json({ success: true, data: status });
    });
}

export const monitorController = new MonitorController();
