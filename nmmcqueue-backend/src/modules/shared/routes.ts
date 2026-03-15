import { Router } from 'express';
import { requireAuth } from '../../middleware/rbac.js';
import { callerController } from '../caller/controller.js';

export const sharedRouter = Router();

// ─── Public Reference Data ─────────────────────────────────────
// These endpoints serve read-only lookup data needed by public Kiosks
// and authenticated staff.

sharedRouter.get('/departments', callerController.getDepartments);
sharedRouter.get('/queue-options', callerController.getQueueOptions);
sharedRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);
