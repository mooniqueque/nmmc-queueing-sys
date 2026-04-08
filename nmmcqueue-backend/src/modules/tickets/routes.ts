import { Request, Response, Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { requireRole } from '../../middleware/rbac.js';
import { ticketService } from './service.js';

export const ticketRouter = Router();

/**
 * @route POST /api/tickets/reset
 * @desc Reset daily queue sequence. This should be restricted to administrative tasks (e.g. cron job).
 */
ticketRouter.post('/reset', requireRole(['ADMIN']), asyncHandler(async (_req: Request, res: Response) => {
    // Basic verification if needed, but usually handled by RBAC or IP restriction
    await ticketService.resetAllSequences();
    res.json({ success: true, message: 'Daily sequence reset successfully' });
}));
