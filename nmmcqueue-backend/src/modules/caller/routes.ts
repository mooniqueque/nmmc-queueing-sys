import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/rbac.js';
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
callerRouter.post('/visit/:visitId/call', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.callPatient);
callerRouter.post('/visit/:visitId/serve', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.servePatient);
callerRouter.post('/visit/:visitId/no-show', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.noShowPatient);
callerRouter.post('/visit/:visitId/transfer', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.transferPatient);
callerRouter.post('/visit/:visitId/restore', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.restorePatient);
callerRouter.post('/visit/:visitId/notify', requireRole(['CLINIC_CALLER', 'TRIAGE_NURSE', 'WINDOW_CLERK']), callerController.notifyPatient);

// Admin override route (for clearing ghost/stuck currently-serving patients)
callerRouter.delete('/visit/:visitId/force-remove', requireRole(['ADMIN']), callerController.forceRemoveVisit);
