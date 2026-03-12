import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { triageController } from './controller.js';

export const triageRouter = Router();
// Public routes (Kiosk)
triageRouter.post('/kiosk/register', triageController.registerKiosk);
triageRouter.get('/kiosk/patient/:id', triageController.getPatientByHospitalId);
// Protected Routes (Triage Nurse / Admin)
triageRouter.use(requireRole(['TRIAGE_NURSE']));
triageRouter.get('/pending', triageController.getPendingQueue);
triageRouter.post('/submit', triageController.submitTriage);
triageRouter.post('/:id/no-show', triageController.markNoShow);
triageRouter.post('/:id/restore', triageController.restoreNoShow);
triageRouter.delete('/:id', triageController.removeQueue);
