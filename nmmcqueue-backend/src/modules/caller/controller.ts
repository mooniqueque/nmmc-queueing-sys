import { Request, Response } from 'express';
import { AppError, asyncHandler } from '../../middleware/error-handler.js';
import { AuthenticatedRequest } from '../../middleware/types.js';
import { callerService } from './service.js';

class CallerController {
    getScope = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        const data = await callerService.getResolvedScope(userId);
        res.status(200).json({ success: true, data });
    });

    getDepartments = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.getDepartments();
        res.status(200).json({ success: true, data });
    });

    getPendingQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const departmentName = req.query.departmentName as string;
        const data = await callerService.getPendingQueue(departmentName, userId);
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

    updateDepartmentStatus = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.updateDepartmentStatus(req.params.id, req.body.status);
        res.status(200).json({ success: true, data });
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

    initializeDepartmentQueueDefaults = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.initializeDepartmentQueueDefaults(req.params.id);
        res.status(200).json({ success: true, data });
    });

    repairDefaultQueueOptions = asyncHandler(async (req: Request, res: Response) => {
        const data = await callerService.repairDefaultQueueOptions();
        res.status(200).json({ success: true, data });
    });

    callPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const data = await callerService.callPatient(visitId, userId);
        res.status(200).json({ success: true, data });
    });

    callNextPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const overrideClassification = req.body?.overrideClassification as 'PRIORITY' | 'REGULAR' | undefined;
        const data = await callerService.callNextPatient(userId, overrideClassification);
        res.status(200).json({ success: true, data });
    });

    servePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const data = await callerService.servePatient(visitId, userId);
        res.status(200).json({ success: true, data });
    });

    noShowPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const data = await callerService.noShowPatient(visitId, userId);
        res.status(200).json({ success: true, data });
    });

    transferPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const { targetDepartmentId } = req.body;
        if (!targetDepartmentId) throw new AppError('targetDepartmentId is required', 400);
        const data = await callerService.transferPatient(visitId, targetDepartmentId, userId);
        res.status(200).json({ success: true, data });
    });

    notifyPatient = asyncHandler(async (req: Request, res: Response) => {
        const visitId = req.params.visitId;
        const data = await callerService.notifyPatient(visitId);
        res.status(200).json({ success: true, data });
    });

    restorePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const data = await callerService.restorePatient(visitId, userId);
        res.status(200).json({ success: true, data });
    });

    forceRemoveVisit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;
        const visitId = req.params.visitId;
        const data = await callerService.forceRemoveVisit(visitId, userId);
        res.status(200).json({ success: true, data });
    });
}

export const callerController = new CallerController();
