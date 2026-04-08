import { Router } from 'express';
import { requireAuth, requireCapability, requireRole } from '../../middleware/rbac.js';
import { callerController } from './controller.js';

export const callerRouter = Router();

// Caller needs to see its own pending queue (requires auth)
callerRouter.get('/pending', requireAuth, callerController.getPendingQueue);
callerRouter.get('/departments', requireAuth, callerController.getDepartments);

// Admin-only management routes (mutations)
callerRouter.post('/departments', requireRole(['ADMIN']), callerController.createDepartment);
callerRouter.delete('/departments/:id', requireRole(['ADMIN']), callerController.deleteDepartment);
callerRouter.post('/queue-options', requireRole(['ADMIN']), callerController.createQueueOption);
callerRouter.delete('/queue-options/:id', requireRole(['ADMIN']), callerController.deleteQueueOption);

// Caller operational routes (Available to all operational staff)
callerRouter.post('/call-next', requireCapability('CLINIC_MUTATE'), callerController.callNextPatient);
callerRouter.post('/visit/:visitId/call', requireCapability('CLINIC_MUTATE'), callerController.callPatient);
callerRouter.post('/visit/:visitId/serve', requireCapability('CLINIC_MUTATE'), callerController.servePatient);
callerRouter.post('/visit/:visitId/no-show', requireCapability('CLINIC_MUTATE'), callerController.noShowPatient);
callerRouter.post('/visit/:visitId/transfer', requireCapability('CLINIC_MUTATE'), callerController.transferPatient);
callerRouter.post('/visit/:visitId/restore', requireCapability('CLINIC_MUTATE'), callerController.restorePatient);
callerRouter.post('/visit/:visitId/notify', requireCapability('CLINIC_MUTATE'), callerController.notifyPatient);

// Admin override route (for clearing ghost/stuck currently-serving patients)
callerRouter.delete('/visit/:visitId/force-remove', requireRole(['ADMIN']), callerController.forceRemoveVisit);
