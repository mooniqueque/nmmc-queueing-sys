import { Router } from 'express';
import { callerController } from '../caller/controller.js';

export const sharedRouter = Router();

// ─── Public Reference Data ─────────────────────────────────────
// These endpoints serve read-only lookup data used across the entire app:
//   - Signup page (unauthenticated)
//   - Admin dashboard (ADMIN)
//   - Caller dashboard (CLINIC_CALLER)
//   - Releasing dashboard (WINDOW_CLERK)
//   - Reports (ADMIN)
sharedRouter.get('/departments', callerController.getDepartments);
sharedRouter.get('/queue-options', callerController.getQueueOptions);
sharedRouter.post('/queue-options/batch', callerController.getQueueOptionsByDepartment);
