import { toNodeHandler } from 'better-auth/node';
import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { auth } from './auth.js';
import { authController } from './controller.js';
import {
    adminCreateUserRequestSchema,
    toggleUserStatusRequestSchema,
    updateUserDepartmentAssignmentsRequestSchema,
    updateUserDepartmentRequestSchema,
    updateUserRoleRequestSchema,
    updateUserWorkstationRequestSchema,
    userIdParamSchema,
} from './schema.js';

export const authRouter = Router();
// Better-auth core routes (login, session, etc.) - maps to /api/auth/*
authRouter.all('/*', toNodeHandler(auth));

// User Management Routes (Admin Only)
export const userRouter = Router();
userRouter.use(requireRole(['ADMIN']));
userRouter.get('/', authController.getAllUsers);
userRouter.post('/create', validate(adminCreateUserRequestSchema), authController.adminCreateUser);
userRouter.put('/:id/role', validate(updateUserRoleRequestSchema), authController.updateUserRole);
userRouter.put('/:id/status', validate(toggleUserStatusRequestSchema), authController.toggleUserStatus);
userRouter.put('/:id/department', validate(updateUserDepartmentRequestSchema), authController.updateUserDepartment);
userRouter.get('/:id/departments', validate(userIdParamSchema), authController.getUserDepartmentAssignments);
userRouter.put('/:id/departments', validate(updateUserDepartmentAssignmentsRequestSchema), authController.updateUserDepartmentAssignments);
userRouter.put('/:id/workstation', validate(updateUserWorkstationRequestSchema), authController.updateUserWorkstation);
