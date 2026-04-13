import { Router } from 'express';
import { kioskLimiter } from '../../middleware/rate-limit.js';
import { requireCapability } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { triageController } from './controller';
import { kioskFormRequestSchema, triageFormRequestSchema, updateTriageAppointmentRequestSchema } from './schema';

export const triageRouter = Router();
// Public routes (Kiosk)
triageRouter.post('/kiosk/register', kioskLimiter, validate(kioskFormRequestSchema), triageController.registerKiosk);
triageRouter.use(requireCapability('TRIAGE_VIEW'));
triageRouter.get('/pending', triageController.getPendingQueue);
triageRouter.post('/call-next', requireCapability('TRIAGE_MUTATE'), triageController.callNextTriage);
triageRouter.post('/:id/call-specific', requireCapability('TRIAGE_MUTATE'), triageController.callSpecificTriage);
triageRouter.get('/my-current', triageController.getMyCurrentVisit);
triageRouter.get('/accessible-departments', triageController.getMyAccessibleDepartments);
triageRouter.post('/submit', requireCapability('TRIAGE_MUTATE'), validate(triageFormRequestSchema), triageController.submitTriage);
triageRouter.patch('/:id/appointment', requireCapability('TRIAGE_MUTATE'), validate(updateTriageAppointmentRequestSchema), triageController.updateAppointment);
triageRouter.post('/:id/no-show', requireCapability('TRIAGE_MUTATE'), triageController.markNoShow);
triageRouter.post('/:id/restore', requireCapability('TRIAGE_MUTATE'), triageController.restoreNoShow);
triageRouter.delete('/:id', requireCapability('TRIAGE_MUTATE'), triageController.removeQueue);
