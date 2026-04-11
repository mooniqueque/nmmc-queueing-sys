import { Router } from 'express';
import { requireAuth, requireCapability, requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { callerController } from './controller.js';
import {
    callNextPatientRequestSchema,
    callerVisitParamSchema,
    createDepartmentRequestSchema,
    createQueueOptionRequestSchema,
    departmentIdParamSchema,
    transferPatientRequestSchema,
} from './schema.js';

export const callerRouter = Router();

// Caller needs to see its own pending queue (requires auth)
callerRouter.get('/pending', requireAuth, callerController.getPendingQueue);
callerRouter.get('/scope', requireAuth, callerController.getScope);
callerRouter.get('/departments', requireAuth, callerController.getDepartments);

// Admin-only management routes (mutations)
callerRouter.post('/departments', requireRole(['ADMIN']), validate(createDepartmentRequestSchema), callerController.createDepartment);
callerRouter.delete('/departments/:id', requireRole(['ADMIN']), validate(departmentIdParamSchema), callerController.deleteDepartment);
callerRouter.post('/queue-options', requireRole(['ADMIN']), validate(createQueueOptionRequestSchema), callerController.createQueueOption);
callerRouter.delete('/queue-options/:id', requireRole(['ADMIN']), validate(departmentIdParamSchema), callerController.deleteQueueOption);

// Caller operational routes (Available to all operational staff)
callerRouter.post('/call-next', requireCapability('CLINIC_MUTATE'), validate(callNextPatientRequestSchema), callerController.callNextPatient);
callerRouter.post('/visit/:visitId/call', requireCapability('CLINIC_MUTATE'), validate(callerVisitParamSchema), callerController.callPatient);
callerRouter.post('/visit/:visitId/serve', requireCapability('CLINIC_MUTATE'), validate(callerVisitParamSchema), callerController.servePatient);
callerRouter.post('/visit/:visitId/no-show', requireCapability('CLINIC_MUTATE'), validate(callerVisitParamSchema), callerController.noShowPatient);
callerRouter.post('/visit/:visitId/transfer', requireCapability('CLINIC_MUTATE'), validate(transferPatientRequestSchema), callerController.transferPatient);
callerRouter.post('/visit/:visitId/restore', requireCapability('CLINIC_MUTATE'), validate(callerVisitParamSchema), callerController.restorePatient);
callerRouter.post('/visit/:visitId/notify', requireCapability('CLINIC_MUTATE'), validate(callerVisitParamSchema), callerController.notifyPatient);

// Admin override route (for clearing ghost/stuck currently-serving patients)
callerRouter.delete('/visit/:visitId/force-remove', requireRole(['ADMIN']), validate(callerVisitParamSchema), callerController.forceRemoveVisit);
