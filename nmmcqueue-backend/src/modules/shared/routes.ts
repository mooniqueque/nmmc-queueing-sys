import { Router } from 'express';
import { requireAuth } from '../../middleware/rbac.js';
import { callerController } from '../caller/controller.js';

export const sharedRouter = Router();

// ─── Public Reference Data ─────────────────────────────────────
// These endpoints serve read-only lookup data:
// Require at least a valid session for all shared reference data
// Unapproved users are blocked by requireAuth
sharedRouter.use(requireAuth);

sharedRouter.get('/departments', callerController.getDepartments);
sharedRouter.get('/queue-options', callerController.getQueueOptions);
sharedRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);
