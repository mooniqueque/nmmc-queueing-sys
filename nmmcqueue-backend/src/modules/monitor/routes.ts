import { Router } from 'express';
import { setupSSEConnection } from '../../lib/sse.js';
import { monitorController } from './controller.js';

export const monitorRouter = Router();

// Publicly accessible for TV displays
monitorRouter.get('/stream', setupSSEConnection);
monitorRouter.get('/windows', monitorController.getWindowStatus);
monitorRouter.get('/department/:departmentId', monitorController.getDepartmentStatus);
