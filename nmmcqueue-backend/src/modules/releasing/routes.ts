import { Router } from 'express';
import { requireCapability } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { releasingController } from './controller.js';
import {
    assignTicketRequestSchema,
    callNextWindowRequestSchema,
    callPriorityClassRequestSchema,
    linkPatientRequestSchema,
    updatePatientDemographicsRequestSchema,
    visitParamSchema,
} from './schema.js';

export const releasingRouter = Router();

releasingRouter.use(requireCapability('WINDOW_VIEW'));

releasingRouter.get('/pending', releasingController.getPendingQueue);
releasingRouter.post('/call-next', requireCapability('WINDOW_MUTATE'), validate(callNextWindowRequestSchema), releasingController.callNextWindow);
releasingRouter.post('/call-priority-class', requireCapability('WINDOW_MUTATE'), validate(callPriorityClassRequestSchema), releasingController.callPriorityClass);
releasingRouter.get('/my-current', releasingController.getMyCurrentVisit);
releasingRouter.post('/:id/call', requireCapability('WINDOW_MUTATE'), validate(visitParamSchema), releasingController.callTicket);
releasingRouter.post('/:id/noshow', requireCapability('WINDOW_MUTATE'), validate(visitParamSchema), releasingController.noShowTicket);
releasingRouter.post('/:id/link-patient', requireCapability('WINDOW_MUTATE'), validate(linkPatientRequestSchema), releasingController.linkPatient);
releasingRouter.put('/:id/patient-demographics', requireCapability('WINDOW_MUTATE'), validate(updatePatientDemographicsRequestSchema), releasingController.updatePatientDemographics);
releasingRouter.post('/:id/assign', requireCapability('WINDOW_MUTATE'), validate(assignTicketRequestSchema), releasingController.assignTicket);
