import { Router } from 'express';
import { setupSSEConnection } from '../../lib/sse.js';
import { requireAuth } from '../../middleware/rbac.js';

export const monitorRouter = Router();
monitorRouter.get('/stream', requireAuth, setupSSEConnection);
