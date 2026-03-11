import { Router } from 'express';
import { requireAuth } from '../../middleware/rbac.js';
import { callerController } from './controller.js';

export const callerRouter = Router();

callerRouter.use(requireAuth);
callerRouter.get('/departments', callerController.getDepartments);
callerRouter.get('/pending', callerController.getPendingQueue);
callerRouter.post('/departments', callerController.createDepartment);
callerRouter.delete('/departments/:id', callerController.deleteDepartment);
callerRouter.get('/queue-options', callerController.getQueueOptions);
callerRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);
callerRouter.post('/queue-options', callerController.createQueueOption);
callerRouter.delete('/queue-options', callerController.deleteQueueOption);

// Caller operations
callerRouter.post('/visit/:visitId/call', callerController.callPatient);
callerRouter.post('/visit/:visitId/serve', callerController.servePatient);
callerRouter.post('/visit/:visitId/no-show', callerController.noShowPatient);
callerRouter.post('/visit/:visitId/transfer', callerController.transferPatient);
callerRouter.post('/visit/:visitId/notify', callerController.notifyPatient);
