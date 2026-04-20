import { toNodeHandler } from 'better-auth/node';
import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { auth } from './auth.js';
import { authController } from './controller.js';
import { getVerifiedSessionUser, rejectInvalidSession } from './session-guard.js';
import {
    adminCreateUserRequestSchema,
    toggleUserStatusRequestSchema,
    updateUserDepartmentAssignmentsRequestSchema,
    updateUserDepartmentRequestSchema,
    updateUserRoleRequestSchema,
    updateUserWorkstationRequestSchema,
    userIdParamSchema,
    updateUserInfoRequestSchema,
    adminResetPasswordRequestSchema,
} from './schema.js';

export const authRouter = Router();
authRouter.get('/get-session-verified', async (req, res) => {
    try {
        const user = await getVerifiedSessionUser(req);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Authentication Required' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        if (error instanceof Error && /inactive|authorized/i.test(error.message)) {
            return rejectInvalidSession(req, res);
        }

        return res.status(401).json({ success: false, error: 'Authentication Required' });
    }
});
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
userRouter.put('/:id/info', validate(updateUserInfoRequestSchema), authController.updateUserInfo);
userRouter.post('/:id/reset-password', validate(adminResetPasswordRequestSchema), authController.adminResetPassword);
