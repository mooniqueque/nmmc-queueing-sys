import { AppError } from '../middleware/error-handler.js';

const DEFAULT_MAX_ATTEMPTS = 5;
const RETRY_MIN_DELAY_MS = 50;
const RETRY_JITTER_MS = 50;

function isClaimConflict(error: unknown) {
    return error instanceof AppError && error.code === 'CLAIM_CONFLICT';
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withClaimConflictRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = DEFAULT_MAX_ATTEMPTS
) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            if (!isClaimConflict(error)) {
                throw error;
            }

            lastError = error;

            if (attempt === maxAttempts) {
                break;
            }

            await wait(RETRY_MIN_DELAY_MS + Math.floor(Math.random() * RETRY_JITTER_MS));
        }
    }

    throw lastError;
}
