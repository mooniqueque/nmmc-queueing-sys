import { Request, Response } from 'express';
import { db } from '../../config/database.js';
import { auth } from './auth.js';
import { asyncHandler, AppError } from '../../middleware/error-handler.js';

type DepartmentAssignmentInput = {
    departmentId: string;
    isEnabled?: boolean;
};

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

    getUserDepartmentAssignments = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

        const user = await db.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                departmentId: true,
            },
        });

        if (!user) throw new AppError('User not found', 404);

        const assignments = await db.userDepartmentAccess.findMany({
            where: { userId: req.params.id },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        videoUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        assignments.sort((left, right) => left.department.name.localeCompare(right.department.name));

        const departments = await db.department.findMany({
            orderBy: { name: 'asc' },
        });

        res.status(200).json({
            success: true,
            data: {
                user,
                departments,
                assignments,
            },
        });
    });

    updateUserDepartmentAssignments = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

        const user = await db.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, role: true },
        });

        if (!user) throw new AppError('User not found', 404);
        if (user.role !== 'TRIAGE_NURSE') {
            throw new AppError('Department access can only be managed for triage nurses.', 400);
        }

        const rawAssignments = Array.isArray(req.body?.assignments) ? req.body.assignments : [];
        const normalizedAssignments = new Map<string, boolean>();

        for (const item of rawAssignments as DepartmentAssignmentInput[]) {
            if (!item?.departmentId) continue;
            normalizedAssignments.set(String(item.departmentId), item.isEnabled !== false);
        }

        const departmentIds = [...normalizedAssignments.keys()];
        let validDepartmentIds = new Set<string>();

        if (departmentIds.length > 0) {
            const departments = await db.department.findMany({
                where: { id: { in: departmentIds } },
                select: { id: true },
            });
            validDepartmentIds = new Set(departments.map((department) => department.id));
        }

        const validAssignments = departmentIds
            .filter((departmentId) => validDepartmentIds.has(departmentId))
            .map((departmentId) => ({
                departmentId,
                isEnabled: normalizedAssignments.get(departmentId) ?? true,
            }));

        const operations: any[] = [
            db.userDepartmentAccess.deleteMany({
                where: { userId: req.params.id },
            }),
        ];

        if (validAssignments.length > 0) {
            operations.push(
                db.userDepartmentAccess.createMany({
                    data: validAssignments.map((assignment) => ({
                        userId: req.params.id,
                        departmentId: assignment.departmentId,
                        isEnabled: assignment.isEnabled,
                    })),
                })
            );
        }

        await db.$transaction(operations);

        res.status(200).json({ success: true });
    });

    getMyAccessibleDepartments = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.id;
        if (!userId) throw new AppError('Unauthorized', 401);

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                departmentId: true,
            },
        });

        if (!user) throw new AppError('User not found', 404);

        const assignments = await db.userDepartmentAccess.findMany({
            where: { userId, isEnabled: true },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        videoUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        assignments.sort((left, right) => left.department.name.localeCompare(right.department.name));

        const accessibleDepartments = assignments.map((assignment) => assignment.department);

        if (accessibleDepartments.length === 0 && user.departmentId) {
            const legacyDepartment = await db.department.findUnique({
                where: { id: user.departmentId },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    videoUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (legacyDepartment) accessibleDepartments.push(legacyDepartment);
        }

        res.status(200).json({
            success: true,
            data: accessibleDepartments,
        });
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
