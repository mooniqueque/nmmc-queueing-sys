import { toNodeHandler } from 'better-auth/node';
import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { auth } from './auth.js';
import { authController } from './controller.js';

export const authRouter = Router();
// Better-auth core routes (login, session, etc.) - maps to /api/auth/*
authRouter.all('/*', toNodeHandler(auth));

// User Management Routes (Admin Only)
export const userRouter = Router();
userRouter.use(requireRole(['ADMIN']));
userRouter.get('/', authController.getAllUsers);
userRouter.post('/create', authController.adminCreateUser);
userRouter.put('/:id/role', authController.updateUserRole);
userRouter.put('/:id/status', authController.toggleUserStatus);
userRouter.put('/:id/department', authController.updateUserDepartment);
userRouter.put('/:id/workstation', authController.updateUserWorkstation);
