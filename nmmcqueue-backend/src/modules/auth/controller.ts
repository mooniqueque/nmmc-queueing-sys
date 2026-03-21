import { Request, Response } from 'express';
import { db } from '../../config/database.js';
import { auth } from './auth.js';
import { asyncHandler, AppError } from '../../middleware/error-handler.js';

class AuthController {
    adminCreateUser = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const { email, name, employeeID, role, department, workstationId } = req.body;
        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');
        
        let departmentId = null;
        if (department) {
            const dept = await db.department.findUnique({ where: { name: department.trim().toUpperCase() } });
            departmentId = dept?.id;
        }

        await auth.api.signUpEmail({
            body: {
                email, 
                username: email.split('@')[0],
                password: 'password123', name, firstName, lastName,
                middleName: '', suffix: '', employeeID, 
                role: role as any, 
                department,
                departmentId: (departmentId as string) || undefined,
                workstationId: workstationId || undefined,
                birthDate: new Date().toISOString(), contactNumber: '09000000000',
            } as any,
        });
        res.status(200).json({ success: true });
    });

    updateUserRole = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        await db.user.update({ where: { id: req.params.id }, data: { role: req.body.role as any } });
        res.status(200).json({ success: true });
    });

    toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        await db.user.update({ where: { id: req.params.id }, data: { isActive: req.body.status } });
        res.status(200).json({ success: true });
    });

    updateUserDepartment = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const { department, departmentId } = req.body;
        
        let finalDeptId = departmentId;
        if (!finalDeptId && department) {
            const dept = await db.department.findUnique({ where: { name: department.trim().toUpperCase() } });
            finalDeptId = dept?.id;
        }

        await db.user.update({ 
            where: { id: req.params.id }, 
            data: { 
                department: department,
                departmentId: finalDeptId 
            } 
        });
        res.status(200).json({ success: true });
    });

    async updateUserWorkstation(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'Unauthorized' });
            await db.user.update({ 
                where: { id: req.params.id }, 
                data: { workstationId: req.body.workstationId } 
            });
            res.status(200).json({ success: true });
        } catch {
            res.status(500).json({ success: false, error: 'Unable to update workstation' });
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            if ((req as any).user?.role !== 'ADMIN') return res.status(401).json({ success: false, error: 'Unauthorized' });
            const users = await db.user.findMany({ 
                orderBy: { createdAt: 'desc' },
                include: {
                    workstation: true,
                    dept: true
                }
            });
            res.status(200).json({ success: true, data: users });
        } catch {
            res.status(500).json({ success: false, error: 'Unable to retrieve user list' });
        }
    }
}

export const authController = new AuthController();
