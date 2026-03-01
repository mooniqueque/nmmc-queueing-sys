import { Router } from 'express';
import { setupSSEConnection } from '../../lib/sse.js';

export const monitorRouter = Router();
monitorRouter.get('/stream', setupSSEConnection);
