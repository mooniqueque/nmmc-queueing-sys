import { Router } from 'express';
import { requireRole } from '../../middleware/rbac.js';
import { releasingController } from './controller.js';

export const releasingRouter = Router();

releasingRouter.use(requireRole(['WINDOW_CLERK', 'TRIAGE_NURSE', 'CLINIC_CALLER']));

releasingRouter.get('/pending', releasingController.getPendingQueue);
releasingRouter.post('/call-next', releasingController.callNextWindow);
releasingRouter.get('/my-current', releasingController.getMyCurrentVisit);
releasingRouter.post('/:id/call', releasingController.callTicket);
releasingRouter.post('/:id/noshow', releasingController.noShowTicket);
releasingRouter.post('/:id/assign', releasingController.assignTicket);
