import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { releasingController } from './controller.js';

export const releasingRouter = Router();

releasingRouter.use(requireRole(['WINDOW_CLERK']));

releasingRouter.get('/pending', releasingController.getPendingQueue);
releasingRouter.post('/:id/assign', releasingController.assignTicket);
