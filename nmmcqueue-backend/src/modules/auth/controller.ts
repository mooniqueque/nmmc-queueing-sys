import { hashPassword } from 'better-auth/crypto';
import { Response } from 'express';
import { db } from '../../config/database.js';
import { AppError, asyncHandler } from '../../middleware/error-handler.js';
import { AuthenticatedRequest } from '../../middleware/types.js';
import { auth } from './auth.js';

type DepartmentAssignmentInput = {
    departmentId: string;
    isEnabled?: boolean;
};

const STATION_LOCKED_ROLES = new Set(['WINDOW_CLERK', 'TRIAGE_NURSE', 'CLINIC_CALLER']);

const isStationLockedRole = (role?: string | null) => Boolean(role && STATION_LOCKED_ROLES.has(role));

const getRequiredStationType = (role: string) => {
    if (role === 'WINDOW_CLERK') return 'WINDOW';
    if (role === 'TRIAGE_NURSE') return 'TRIAGE';
    if (role === 'CLINIC_CALLER') return 'CALLER';
    return null;
};

class AuthController {
    private async ensureWorkstationRules(params: {
        workstationId?: string | null;
        role?: string | null;
        userId?: string;
    }) {
        const { workstationId, role, userId } = params;

        if (isStationLockedRole(role) && !workstationId) {
            throw new AppError('A workstation is required for this role.', 400, 'WORKSTATION_REQUIRED');
        }

        if (!workstationId) return;

        const station = await db.workStation.findUnique({
            where: { id: workstationId },
            select: { id: true, name: true, stationNo: true, type: true },
        });

        if (!station) {
            throw new AppError('Selected workstation does not exist.', 404, 'WORKSTATION_NOT_FOUND');
        }

        const requiredType = role ? getRequiredStationType(role) : null;
        if (requiredType && station.type !== requiredType) {
            throw new AppError(
                `Selected workstation is ${station.type}, but role ${role} requires ${requiredType}.`,
                400,
                'WORKSTATION_ROLE_MISMATCH'
            );
        }

        if (!isStationLockedRole(role)) return;

        const occupiedBy = await db.user.findFirst({
            where: {
                workstationId,
                isActive: true,
                role: { in: [...STATION_LOCKED_ROLES] as any[] },
                ...(userId ? { id: { not: userId } } : {}),
            },
            select: { id: true, name: true, email: true },
        });

        if (occupiedBy) {
            throw new AppError(
                `${station.name} (#${station.stationNo}) is already assigned to ${occupiedBy.name} (${occupiedBy.email}). Please choose another station.`,
                409,
                'WORKSTATION_ALREADY_ASSIGNED'
            );
        }
    }

    adminCreateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const { email, name, employeeID, role, department, workstationId } = req.body;
        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');
        const normalizedWorkstationId = typeof workstationId === 'string' && workstationId.trim().length > 0
            ? workstationId.trim()
            : undefined;
        
        let departmentId = null;
        if (department) {
            const dept = await db.department.findUnique({ where: { name: department.trim().toUpperCase() } });
            departmentId = dept?.id;
        }

        await this.ensureWorkstationRules({
            workstationId: normalizedWorkstationId,
            role,
        });

        await auth.api.signUpEmail({
            body: {
                email, 
                username: email.split('@')[0],
                password: 'password123', name, firstName, lastName,
                middleName: '', suffix: '', employeeID, 
                role: role as any, 
                department,
                departmentId: (departmentId as string) || undefined,
                workstationId: normalizedWorkstationId,
                birthDate: new Date().toISOString(), contactNumber: '09000000000',
            } as any,
        });
        res.status(200).json({ success: true });
    });

    updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const targetUser = await db.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, workstationId: true },
        });

        if (!targetUser) throw new AppError('User not found', 404);

        await this.ensureWorkstationRules({
            workstationId: targetUser.workstationId,
            role: req.body.role,
            userId: req.params.id,
        });

        await db.user.update({ where: { id: req.params.id }, data: { role: req.body.role as any } });
        res.status(200).json({ success: true });
    });

    toggleUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        if (req.body.status === true) {
            const targetUser = await db.user.findUnique({
                where: { id: req.params.id },
                select: { id: true, role: true, workstationId: true },
            });

            if (!targetUser) throw new AppError('User not found', 404);

            await this.ensureWorkstationRules({
                workstationId: targetUser.workstationId,
                role: targetUser.role,
                userId: targetUser.id,
            });
        }

        await db.user.update({ where: { id: req.params.id }, data: { isActive: req.body.status } });
        res.status(200).json({ success: true });
    });

    updateUserDepartment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
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

    getUserDepartmentAssignments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

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

    updateUserDepartmentAssignments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);

        const user = await db.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, role: true },
        });

        if (!user) throw new AppError('User not found', 404);
        if (user.role !== 'TRIAGE_NURSE' && user.role !== 'CLINIC_CALLER') {
            throw new AppError('Department access can only be managed for triage nurses or clinic callers.', 400);
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

    getMyAccessibleDepartments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user.id;

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

        res.status(200).json({
            success: true,
            data: accessibleDepartments,
        });
    });

    updateUserWorkstation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const targetUser = await db.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, role: true },
        });

        if (!targetUser) throw new AppError('User not found', 404);

        const workstationId = req.body.workstationId || null;

        await this.ensureWorkstationRules({
            workstationId,
            role: targetUser.role,
            userId: targetUser.id,
        });

        await db.user.update({ 
            where: { id: req.params.id }, 
            data: { workstationId } 
        });
        res.status(200).json({ success: true });
    });

    updateUserInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const { id } = req.params;
        const { name, email } = req.body;

        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');

        await db.user.update({
            where: { id },
            data: {
                name,
                email,
                firstName,
                lastName,
                username: email.split('@')[0],
            },
        });

        res.status(200).json({ success: true });
    });

    adminResetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const { id } = req.params;
        const { password } = req.body;

        const hashedPassword = await hashPassword(password);
        const updatedAccounts = await db.account.updateMany({
            where: {
                userId: id,
                providerId: { in: ['credential', 'email'] },
            },
            data: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        });

        if (updatedAccounts.count === 0) {
            await db.account.create({
                data: {
                    accountId: id,
                    userId: id,
                    providerId: 'credential',
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }

        await db.session.deleteMany({
            where: { userId: id },
        });

        res.status(200).json({ success: true });
    });

    getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (req.user.role !== 'ADMIN') throw new AppError('Unauthorized', 401);
        const users = await db.user.findMany({ 
            orderBy: { createdAt: 'desc' },
            include: {
                workstation: true,
                dept: true,
                departmentAccess: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                    orderBy: {
                        department: {
                            name: 'asc',
                        },
                    },
                },
            }
        });
        res.status(200).json({ success: true, data: users });
    });
}

export const authController = new AuthController();