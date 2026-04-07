import { Router } from 'express';
import { requireCapability } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { triageController } from './controller';
import { kioskLimiter } from '../../middleware/rate-limit.js';
import { kioskFormRequestSchema, triageFormRequestSchema } from './schema';

export const triageRouter = Router();
// Public routes (Kiosk)
triageRouter.post('/kiosk/register', kioskLimiter, validate(kioskFormRequestSchema), triageController.registerKiosk);
triageRouter.use(requireCapability('TRIAGE_VIEW'));
triageRouter.post('/:id/acknowledge', triageController.acknowledgeKiosk);
triageRouter.get('/pending', triageController.getPendingQueue);
triageRouter.post('/call-next', requireCapability('TRIAGE_MUTATE'), triageController.callNextTriage);
triageRouter.post('/:id/call-specific', requireCapability('TRIAGE_MUTATE'), triageController.callSpecificTriage);
triageRouter.get('/my-current', triageController.getMyCurrentVisit);
triageRouter.post('/submit', requireCapability('TRIAGE_MUTATE'), validate(triageFormRequestSchema), triageController.submitTriage);
triageRouter.post('/:id/no-show', requireCapability('TRIAGE_MUTATE'), triageController.markNoShow);
triageRouter.post('/:id/restore', requireCapability('TRIAGE_MUTATE'), triageController.restoreNoShow);
triageRouter.delete('/:id', requireCapability('TRIAGE_MUTATE'), triageController.removeQueue);
