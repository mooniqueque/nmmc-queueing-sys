import { Request, Response } from 'express';
import { db } from '../../config/database.js';
import { auth } from './auth.js';
import { asyncHandler, AppError } from '../../middleware/error-handler.js';
import { buildReleasingAccess, parseReleasingAccess, ReleasingAccessEntry } from './releasing-access.js';

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

    getTriageReleasingAccessUsers = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

        const query = typeof req.query.query === 'string' ? req.query.query.trim().toLowerCase() : '';

        const users = await db.user.findMany({
            where: {
                role: 'TRIAGE_NURSE',
                ...(query
                    ? {
                        OR: [
                            { name: { contains: query } },
                            { email: { contains: query } },
                            { employeeID: { contains: query } },
                        ],
                    }
                    : {}),
            },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                employeeID: true,
                role: true,
                department: true,
            },
        });

        const data = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            employeeID: user.employeeID,
            role: user.role,
            releasingAccess: parseReleasingAccess(user.department),
        }));

        res.status(200).json({ success: true, data });
    });

    updateUserReleasingAccess = asyncHandler(async (req: Request, res: Response) => {
        if ((req as any).user?.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

        const userId = req.params.id;
        const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];

        const normalizedEntries: ReleasingAccessEntry[] = [];
        const deduped = new Map<string, boolean>();

        for (const entry of entries) {
            if (!entry || typeof entry !== 'object') continue;
            const departmentId = typeof (entry as any).departmentId === 'string' ? (entry as any).departmentId.trim() : '';
            if (!departmentId) continue;

            const enabled = (entry as any).enabled !== false;
            deduped.set(departmentId, enabled);
        }

        for (const [departmentId, enabled] of deduped.entries()) {
            normalizedEntries.push({ departmentId, enabled });
        }

        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!targetUser) throw new AppError('User not found', 404);
        if (targetUser.role !== 'TRIAGE_NURSE') {
            throw new AppError('Only TRIAGE_NURSE users can be configured in manage releasing.', 400);
        }

        if (normalizedEntries.length > 0) {
            const validDepartments = await db.department.findMany({
                where: { id: { in: normalizedEntries.map((entry) => entry.departmentId) } },
                select: { id: true },
            });

            const validIds = new Set(validDepartments.map((department) => department.id));
            const invalidEntry = normalizedEntries.find((entry) => !validIds.has(entry.departmentId));
            if (invalidEntry) {
                throw new AppError('One or more selected departments are invalid.', 400);
            }
        }

        const encoded = buildReleasingAccess(normalizedEntries);

        await db.user.update({
            where: { id: userId },
            data: {
                department: encoded,
                departmentId: null,
            },
        });

        res.status(200).json({
            success: true,
            data: {
                userId,
                entries: normalizedEntries,
            },
        });
    });

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
