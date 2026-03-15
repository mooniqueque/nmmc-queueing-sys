import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../../middleware/error-handler.js';
import { callerService } from './service.js';

class CallerController {
    getDepartments = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.getDepartments();
        res.status(200).json({ success: true, data });
    });

    getPendingQueue = asyncHandler(async (req: Request, res: Response) => {
        const departmentName = req.query.departmentName as string;
        const data = await callerService.getPendingQueue(departmentName);
        res.status(200).json({ success: true, data });
    });

    createDepartment = asyncHandler(async (req: Request, res: Response) => {
        try {
            const data = await callerService.createDepartment(req.body.name, req.body.code);
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            if (error.code === 'P2002') throw new AppError('A department with this name or code already exists.', 400);
            throw error;
        }
    });

    deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
        try {
            await callerService.deleteDepartment(req.params.id);
            res.status(200).json({ success: true });
        } catch (error) {
            throw new AppError("Could not delete. It might be linked to active visits.", 400);
        }
    });

    getQueueOptions = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.getQueueOptions(req.query.departmentName as string);
        res.status(200).json({ success: true, data });
    });

    getQueueOptionsByDepartment = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.getQueueOptionsByDepartment(req.body.departments || []);
        res.status(200).json({ success: true, data });
    });

    createQueueOption = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.createQueueOption(req.body.departmentName, req.body.data);
        res.status(200).json({ success: true, data });
    });

    deleteQueueOption = asyncHandler(async (req: Request, res: Response) => {
        await callerService.deleteQueueOption(req.params.id);
        res.status(200).json({ success: true });
    });

    callPatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.callPatient(visitId);
        res.status(200).json({ success: true, data });
    });

    servePatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.servePatient(visitId);
        res.status(200).json({ success: true, data });
    });

    noShowPatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.noShowPatient(visitId);
        res.status(200).json({ success: true, data });
    });

    transferPatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const { targetDepartmentId } = req.body;
        if (!targetDepartmentId) throw new AppError('targetDepartmentId is required', 400);
        const data = await callerService.transferPatient(visitId, targetDepartmentId);
        res.status(200).json({ success: true, data });
    });

    notifyPatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.notifyPatient(visitId);
        res.status(200).json({ success: true, data });
    });

    restorePatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.restorePatient(visitId);
        res.status(200).json({ success: true, data });
    });
}

export const callerController = new CallerController();
