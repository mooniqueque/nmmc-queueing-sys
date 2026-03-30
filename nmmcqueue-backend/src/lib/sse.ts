import { EventEmitter } from 'events';
import { Request, Response } from 'express';

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(500);

// Global topic for everyone (e.g., Triage, general TV monitors)
const GLOBAL_TOPIC = 'queue-updated:global';

export const setupSSEConnection = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.write('data: {"type": "connected"}\n\n');

    const topicParam = req.query.topic;
    // Determine the specific topic based on the query parameter
    const topic = topicParam && typeof topicParam === 'string'
        ? `queue-updated:${topicParam}`
        : GLOBAL_TOPIC;

    // We still want this specific connection to listen to the global broadcast
    // in case of system-wide announcements or resets, but primarily it listens to its topic
    const onQueueUpdate = () => {
        res.write(`data: {"type": "queue-updated", "timestamp": "${new Date().toISOString()}"}\n\n`);
    };

    // Listen to the specific topic
    eventBus.on(topic, onQueueUpdate);

    // Listen to the global topic as a fallback if they asked for a specific topic
    // Only add a second listener if the requested topic is NOT global
    if (topic !== GLOBAL_TOPIC) {
        eventBus.on(GLOBAL_TOPIC, onQueueUpdate);
    }

    req.on('close', () => {
        eventBus.off(topic, onQueueUpdate);
        if (topic !== GLOBAL_TOPIC) {
            eventBus.off(GLOBAL_TOPIC, onQueueUpdate);
        }
    });
};

import { db } from '../config/database.js';

const departmentSlugCache = new Map<string, string>();

export const emitQueueUpdate = async (departmentId?: string) => {
    // Always emit a global update so everyone knows *something* happened
    eventBus.emit(GLOBAL_TOPIC);

    if (departmentId && departmentId !== 'global') {
        // Emit to the ID-based topic for backward compatibility
        eventBus.emit(`queue-updated:${departmentId}`);

        // Try to find the slug and emit to it as well
        try {
            let slug = departmentSlugCache.get(departmentId);
            
            if (!slug) {
                const department = await db.department.findUnique({
                    where: { id: departmentId },
                    select: { slug: true }
                });
                
                if (department?.slug) {
                    slug = department.slug;
                    departmentSlugCache.set(departmentId, slug);
                }
            }

            if (slug) {
                eventBus.emit(`queue-updated:${slug}`);
            }
        } catch (error) {
            console.error("Failed to fetch department slug for SSE broadcast:", error);
        }
    }
};
