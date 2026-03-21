/**
 * Failsafe Timer: Auto-reset stuck IN_TRIAGE and IN_WINDOW visits.
 * 
 * If a visit has been IN_TRIAGE or IN_WINDOW for longer than the configured
 * timeout (default: 30 minutes), it is automatically returned to its
 * previous waiting state.
 * 
 * This prevents patients from being permanently "stuck" if a nurse/clerk
 * closes their browser or encounters an error mid-process.
 */
import { db } from '../config/database.js';
import logger from '../lib/logger.js';
import { emitQueueUpdate } from '../lib/sse.js';

const TRIAGE_TIMEOUT_MINUTES = 30;
const WINDOW_TIMEOUT_MINUTES = 30;
const CHECK_INTERVAL_MS = 60_000; // Check every 1 minute

async function resetStuckVisits() {
    const now = new Date();

    // Reset stuck IN_TRIAGE visits
    const triageCutoff = new Date(now.getTime() - TRIAGE_TIMEOUT_MINUTES * 60_000);
    const stuckTriage = await db.visit.updateMany({
        where: {
            status: 'IN_TRIAGE',
            triageStartedAt: { lt: triageCutoff },
        },
        data: {
            status: 'WAITING_TRIAGE',
            triageClaimedById: null,
            triageStartedAt: null,
            triageStationId: null,
        }
    });

    if (stuckTriage.count > 0) {
        logger.warn(`Failsafe: Reset ${stuckTriage.count} stuck IN_TRIAGE visit(s) back to WAITING_TRIAGE`);
        await emitQueueUpdate();
    }

    // Reset stuck IN_WINDOW visits
    const windowCutoff = new Date(now.getTime() - WINDOW_TIMEOUT_MINUTES * 60_000);
    const stuckWindow = await db.visit.updateMany({
        where: {
            status: 'IN_WINDOW',
            windowStartedAt: { lt: windowCutoff },
        },
        data: {
            status: 'WAITING_WINDOW',
            windowClaimedById: null,
            windowStartedAt: null,
            calledAtStationId: null,
            windowNumber: null,
        }
    });

    if (stuckWindow.count > 0) {
        logger.warn(`Failsafe: Reset ${stuckWindow.count} stuck IN_WINDOW visit(s) back to WAITING_WINDOW`);
        await emitQueueUpdate('WINDOW');
    }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startFailsafeTimer() {
    logger.info(`Failsafe timer started: checking every ${CHECK_INTERVAL_MS / 1000}s for stuck visits (timeout: triage=${TRIAGE_TIMEOUT_MINUTES}m, window=${WINDOW_TIMEOUT_MINUTES}m)`);
    intervalId = setInterval(async () => {
        try {
            await resetStuckVisits();
        } catch (err) {
            logger.error('Failsafe timer error:', err);
        }
    }, CHECK_INTERVAL_MS);
}

export function stopFailsafeTimer() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        logger.info('Failsafe timer stopped');
    }
}
