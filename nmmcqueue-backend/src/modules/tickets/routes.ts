import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { ticketService } from './service.js';

export const ticketRouter = Router();

/**
 * @route POST /api/tickets/reset
 * @desc Reset daily queue sequence. This should be restricted to administrative tasks (e.g. cron job).
 */
ticketRouter.post('/reset', asyncHandler(async (req, res) => {
    // Basic verification if needed, but usually handled by RBAC or IP restriction
    await ticketService.resetDailySequence();
    res.json({ success: true, message: 'Daily sequence reset successfully' });
}));
