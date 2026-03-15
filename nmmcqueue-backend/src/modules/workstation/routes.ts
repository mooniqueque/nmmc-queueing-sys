import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/rbac.js';
import { workstationController } from './controller.js';

export const workstationRouter = Router();

// Require auth for all workstation routes
workstationRouter.use(requireAuth);

// Publicly available to authenticated users (e.g. to see their own station info or lists)
workstationRouter.get('/', workstationController.getAll);

// Admin only management
workstationRouter.post('/', requireRole(['ADMIN']), workstationController.create);
workstationRouter.put('/:id', requireRole(['ADMIN']), workstationController.update);
workstationRouter.delete('/:id', requireRole(['ADMIN']), workstationController.delete);
