import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { triageController } from './controller';
import { kioskLimiter } from '../../middleware/rate-limit.js';
import { kioskFormRequestSchema, triageFormRequestSchema } from './schema';

export const triageRouter = Router();
// Public routes (Kiosk)
triageRouter.post('/kiosk/register', kioskLimiter, validate(kioskFormRequestSchema), triageController.registerKiosk);
triageRouter.get('/kiosk/patient/:id', triageController.getPatientByHospitalId);
// Protected Routes (Triage Nurse / Admin / Staff assistance)
triageRouter.use(requireRole(['TRIAGE_NURSE', 'WINDOW_CLERK', 'CLINIC_CALLER']));
triageRouter.get('/pending', triageController.getPendingQueue);
triageRouter.post('/submit', validate(triageFormRequestSchema), triageController.submitTriage);
triageRouter.post('/:id/no-show', triageController.markNoShow);
triageRouter.post('/:id/restore', triageController.restoreNoShow);
triageRouter.delete('/:id', triageController.removeQueue);
