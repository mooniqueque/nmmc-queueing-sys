import { Request, Response } from 'express';
import { SseEventType, type DepartmentStatus, type DepartmentStatusUpdatedPayload, type SseEnvelope as SharedSseEnvelope, type SessionUser } from '@nmmc/types';
import { db } from '../config/database.js';
import { sanitizePublicMonitorPayload } from './monitor-sanitizer.js';
import { getVerifiedSessionUser, rejectInvalidSession } from '../modules/auth/session-guard.js';
import logger from './logger.js';

const HEARTBEAT_INTERVAL_MS = 25000;

export const SSE_TOPICS = {
    TRIAGE: 'triage',
    WINDOW: 'window',
    MONITOR_WINDOWS: 'monitor:windows',
    department: (alias: string) => `department:${alias.trim().toUpperCase()}`,
    monitorDepartment: (alias: string) => `monitor:department:${alias.trim().toUpperCase()}`,
} as const;

export type SseEnvelope<T = unknown> = SharedSseEnvelope<T>;

type SseListener = (event: SseEnvelope) => void;

interface SseBroker {
    subscribe(topic: string, listener: SseListener): void;
    unsubscribe(topic: string, listener: SseListener): void;
    publish<T>(topics: string[], event: Omit<SseEnvelope<T>, 'topic' | 'timestamp'>): void;
}

// Redis-ready abstraction: this in-memory broker can be swapped with a Redis Pub/Sub
// implementation later without changing the service call-sites.
class InMemorySseBroker implements SseBroker {
    private listeners = new Map<string, Set<SseListener>>();

    subscribe(topic: string, listener: SseListener) {
        const existing = this.listeners.get(topic) ?? new Set<SseListener>();
        existing.add(listener);
        this.listeners.set(topic, existing);
    }

    unsubscribe(topic: string, listener: SseListener) {
        const existing = this.listeners.get(topic);
        if (!existing) return;
        existing.delete(listener);
        if (existing.size === 0) {
            this.listeners.delete(topic);
        }
    }

    publish<T>(topics: string[], event: Omit<SseEnvelope<T>, 'topic' | 'timestamp'>) {
        const timestamp = new Date().toISOString();
        for (const topic of new Set(topics.map((value) => value.trim()).filter(Boolean))) {
            const existing = this.listeners.get(topic);
            if (!existing || existing.size === 0) continue;
            const envelope: SseEnvelope<T> = { ...event, topic, timestamp };
            for (const listener of existing) {
                listener(envelope);
            }
        }
    }
}

const broker: SseBroker = new InMemorySseBroker();

const ROLE_CAPABILITIES: Record<string, string[]> = {
    ADMIN: [
        'TRIAGE_VIEW',
        'TRIAGE_MUTATE',
        'WINDOW_VIEW',
        'WINDOW_MUTATE',
        'CLINIC_VIEW',
        'CLINIC_MUTATE',
        'MONITOR_ADMIN',
        'QUEUE_ADMIN',
        'USER_ADMIN',
    ],
    TRIAGE_NURSE: ['TRIAGE_VIEW', 'TRIAGE_MUTATE'],
    WINDOW_CLERK: ['WINDOW_VIEW', 'WINDOW_MUTATE'],
    CLINIC_CALLER: ['CLINIC_VIEW', 'CLINIC_MUTATE'],
};

function hasCapability(role: string, capability: string) {
    return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

function isPublicTopic(topic: string) {
    return topic === SSE_TOPICS.MONITOR_WINDOWS || topic.startsWith('monitor:department:');
}

function getDepartmentAlias(topic: string) {
    if (topic.startsWith('department:')) {
        return topic.slice('department:'.length).trim();
    }
    return null;
}

async function resolveDepartmentIdByAlias(alias: string) {
    const normalized = alias.trim();
    if (!normalized) return null;
    const department = await db.department.findFirst({
        where: {
            OR: [
                { id: normalized },
                { slug: normalized.toLowerCase() },
            ],
        },
        select: { id: true },
    });
    return department?.id ?? null;
}

async function canAccessTopic(topic: string, user: SessionUser | null) {
    if (isPublicTopic(topic)) return true;
    if (!user) return false;

    if (topic === SSE_TOPICS.TRIAGE) {
        return hasCapability(user.role, 'TRIAGE_VIEW');
    }

    if (topic === SSE_TOPICS.WINDOW) {
        return hasCapability(user.role, 'WINDOW_VIEW');
    }

    const departmentAlias = getDepartmentAlias(topic);
    if (departmentAlias) {
        if (!hasCapability(user.role, 'CLINIC_VIEW')) return false;
        if (user.role === 'ADMIN') return true;
        if (!user.departmentId) return false;
        const departmentId = await resolveDepartmentIdByAlias(departmentAlias);
        return Boolean(departmentId && departmentId === user.departmentId);
    }

    return false;
}

export const setupSSEConnection = async (req: Request, res: Response) => {
    const topicParam = req.query.topic;
    const topic = topicParam && typeof topicParam === 'string'
        ? topicParam
        : SSE_TOPICS.TRIAGE;

    try {
        const user = await getVerifiedSessionUser(req);
        if (!isPublicTopic(topic) && !user) {
            res.status(401).json({ success: false, error: 'Authentication Required' });
            return;
        }

        const allowed = await canAccessTopic(topic, user);
        if (!allowed) {
            res.status(403).json({ success: false, error: 'Forbidden: insufficient access to SSE topic.' });
            return;
        }
    } catch (error) {
        if (error instanceof Error && /inactive|authorized/i.test(error.message)) {
            rejectInvalidSession(req, res);
            return;
        }
        logger.warn('SSE authentication failed', {
            topic,
            error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ success: false, error: 'SSE authentication failed' });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
    }

    const listener = (event: SseEnvelope) => {
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    broker.subscribe(topic, listener);
    res.write(`data: ${JSON.stringify({ type: SseEventType.CONNECTED, topic, timestamp: new Date().toISOString() })}\n\n`);

    const heartbeatId = setInterval(() => {
        if (!res.writableEnded) {
            res.write(': heartbeat\n\n');
        }
    }, HEARTBEAT_INTERVAL_MS);

    let cleanedUp = false;
    const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearInterval(heartbeatId);
        broker.unsubscribe(topic, listener);
    };

    req.on('close', cleanup);
    req.on('aborted', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
};

const ALIAS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const departmentAliasCache = new Map<string, { aliases: string[], expiresAt: number }>();

export async function getDepartmentTopicAliases(departmentId: string): Promise<string[]> {
    const cached = departmentAliasCache.get(departmentId);
    if (cached && Date.now() < cached.expiresAt) return cached.aliases;

    const department = await db.department.findUnique({
        where: { id: departmentId },
        select: { id: true, slug: true, name: true },
    });

    if (!department) return [departmentId];

    const aliases = Array.from(new Set([
        department.id,
        department.slug,
    ].filter(Boolean) as string[]));

    departmentAliasCache.set(departmentId, {
        aliases,
        expiresAt: Date.now() + ALIAS_CACHE_TTL_MS
    });

    return aliases;
}

export function publishSseEvent<T>(topics: string[], type: SseEventType, payload?: T) {
    const sanitizedTopics = Array.from(new Set(topics.map((topic) => topic.trim()).filter(Boolean)));
    for (const topic of sanitizedTopics) {
        const safePayload = isPublicTopic(topic)
            ? sanitizePublicMonitorPayload(type, payload)
            : payload;
        broker.publish([topic], { type, payload: safePayload });
    }
}

export async function emitQueueUpdate(departmentId?: string) {
    // Backward-compatible invalidation event without global fan-out.
    if (departmentId) {
        const aliases = await getDepartmentTopicAliases(departmentId);
        publishSseEvent(
            aliases.map((alias) => SSE_TOPICS.department(alias)),
            SseEventType.QUEUE_INVALIDATED,
            { departmentId }
        );
        return;
    }

    publishSseEvent([SSE_TOPICS.TRIAGE, SSE_TOPICS.WINDOW], SseEventType.QUEUE_INVALIDATED);
}

export async function publishDepartmentEvent<T>(
    departmentId: string,
    type: SseEventType,
    payload?: T
) {
    try {
        const aliases = await getDepartmentTopicAliases(departmentId);
        publishSseEvent(aliases.map((alias) => SSE_TOPICS.department(alias)), type, payload);
    } catch (error) {
        logger.warn('Failed to publish department-scoped SSE event', {
            departmentId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

export async function publishDepartmentStatusUpdate(departmentId: string, status: DepartmentStatus) {
    const payload: DepartmentStatusUpdatedPayload = { departmentId, status };
    publishSseEvent([SSE_TOPICS.TRIAGE], SseEventType.DEPARTMENT_STATUS_UPDATED, payload);
    await publishDepartmentEvent(departmentId, SseEventType.DEPARTMENT_STATUS_UPDATED, payload);
}

export async function publishDepartmentMonitorEvent<T>(
    departmentId: string,
    type: SseEventType,
    payload?: T
) {
    try {
        const aliases = await getDepartmentTopicAliases(departmentId);
        publishSseEvent(aliases.map((alias) => SSE_TOPICS.monitorDepartment(alias)), type, payload);
    } catch (error) {
        logger.warn('Failed to publish public department monitor SSE event', {
            departmentId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
