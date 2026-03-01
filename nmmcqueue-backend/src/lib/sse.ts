import { EventEmitter } from 'events';
import { Request, Response } from 'express';

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(500);

export const setupSSEConnection = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.write('data: {"type": "connected"}\n\n');

    const onQueueUpdate = () => {
        res.write(`data: {"type": "queue-updated", "timestamp": "${new Date().toISOString()}"}\n\n`);
    };

    eventBus.on('queue-updated', onQueueUpdate);
    req.on('close', () => {
        eventBus.off('queue-updated', onQueueUpdate);
    });
};

export const emitQueueUpdate = () => {
    eventBus.emit('queue-updated');
};
