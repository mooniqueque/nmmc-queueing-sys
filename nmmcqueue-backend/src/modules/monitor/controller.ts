import { Request, Response } from 'express';
import { monitorService } from './service.js';

class MonitorController {
    async getWindowStatus(req: Request, res: Response) {
        try {
            const status = await monitorService.getWindowStatus();
            res.status(200).json({ success: true, data: status });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const monitorController = new MonitorController();
