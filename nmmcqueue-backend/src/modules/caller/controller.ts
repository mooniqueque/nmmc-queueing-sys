import { Request, Response } from 'express';
import { callerService } from './service.js';

class CallerController {
    async getDepartments(req: Request, res: Response) {
        try { res.status(200).json({ success: true, data: await callerService.getDepartments() }); }
        catch { res.status(500).json({ success: false, error: 'Failed to load departments' }); }
    }
    async getPendingQueue(req: Request, res: Response) {
        try {
            const departmentName = req.query.departmentName as string;
            res.status(200).json({ success: true, data: await callerService.getPendingQueue(departmentName) });
        }
        catch (error) { res.status(500).json({ success: false, error: 'Failed to load pending queue' }); }
    }
    async createDepartment(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Admin access required' });
            res.status(200).json({ success: true, data: await callerService.createDepartment(req.body.name, req.body.code) });
        } catch (error: any) {
            if (error.code === 'P2002') return res.status(400).json({ success: false, error: 'A department with this name or code already exists.' });
            res.status(500).json({ success: false, error: 'Database error occurred.' });
        }
    }
    async deleteDepartment(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Admin access required' });
            await callerService.deleteDepartment(req.params.id);
            res.status(200).json({ success: true });
        } catch { res.status(500).json({ success: false, error: "Could not delete. It might be linked to active visits." }); }
    }
    async getQueueOptions(req: Request, res: Response) {
        try { res.status(200).json({ success: true, data: await callerService.getQueueOptions(req.query.departmentName as string) }); }
        catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
    }
    async getQueueOptionsByDepartment(req: Request, res: Response) {
        try { res.status(200).json({ success: true, data: await callerService.getQueueOptionsByDepartment(req.body.departments || []) }); }
        catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
    }
    async createQueueOption(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Admin access required' });
            await callerService.createQueueOption(req.body.departmentName, req.body.option);
            res.status(200).json({ success: true });
        } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
    }
    async deleteQueueOption(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Admin access required' });
            await callerService.deleteQueueOption(req.body.departmentName, req.body.option);
            res.status(200).json({ success: true });
        } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
    }
}

export const callerController = new CallerController();
