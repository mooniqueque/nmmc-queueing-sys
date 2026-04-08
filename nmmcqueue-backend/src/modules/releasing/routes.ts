import { Router } from 'express';
import { requireCapability } from '../../middleware/rbac.js';
import { releasingController } from './controller.js';

export const releasingRouter = Router();

releasingRouter.use(requireCapability('WINDOW_VIEW'));

releasingRouter.get('/pending', releasingController.getPendingQueue);
releasingRouter.post('/call-next', requireCapability('WINDOW_MUTATE'), releasingController.callNextWindow);
releasingRouter.get('/my-current', releasingController.getMyCurrentVisit);
releasingRouter.post('/:id/call', requireCapability('WINDOW_MUTATE'), releasingController.callTicket);
releasingRouter.post('/:id/noshow', requireCapability('WINDOW_MUTATE'), releasingController.noShowTicket);
releasingRouter.post('/:id/link-patient', requireCapability('WINDOW_MUTATE'), releasingController.linkPatient);
releasingRouter.post('/:id/assign', requireCapability('WINDOW_MUTATE'), releasingController.assignTicket);
