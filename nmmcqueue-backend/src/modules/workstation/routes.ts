import { Router } from 'express';
import { workstationController } from './controller.js';
import { requireRole } from '../../middleware/rbac.js';

export const workstationRouter = Router();

// Publicly available to authenticated users (e.g. to see their own station info or lists)
workstationRouter.get('/', workstationController.getAll);

// Admin only management
workstationRouter.post('/', requireRole(['ADMIN']), workstationController.create);
workstationRouter.put('/:id', requireRole(['ADMIN']), workstationController.update);
workstationRouter.delete('/:id', requireRole(['ADMIN']), workstationController.delete);
