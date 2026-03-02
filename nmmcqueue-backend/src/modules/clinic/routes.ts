import { Router } from 'express';
import { requireAuth } from '../../middleware/rbac.js';
import { clinicController } from './controller.js';

export const clinicRouter = Router();

clinicRouter.use(requireAuth);
clinicRouter.get('/departments', clinicController.getDepartments);
clinicRouter.get('/pending', clinicController.getPendingQueue);
clinicRouter.post('/departments', clinicController.createDepartment);
clinicRouter.delete('/departments/:id', clinicController.deleteDepartment);
clinicRouter.get('/queue-options', clinicController.getQueueOptions);
clinicRouter.post('/queue-options/batch', clinicController.getQueueOptionsByDepartment);
clinicRouter.post('/queue-options', clinicController.createQueueOption);
clinicRouter.delete('/queue-options', clinicController.deleteQueueOption);
