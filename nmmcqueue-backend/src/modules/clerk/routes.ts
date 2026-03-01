import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { clerkController } from './controller.js';

export const clerkRouter = Router();

clerkRouter.use(requireRole(['WINDOW_CLERK', 'ADMIN']));

clerkRouter.get('/pending', clerkController.getPendingQueue);
clerkRouter.post('/:id/assign', clerkController.assignTicket);
