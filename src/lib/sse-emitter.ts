import { EventEmitter } from 'events';

// In Next.js (especially development), hot reloading clears singletons.
// We use a global symbol to preserve the emitter instance across module reloads.
const globalForEmitter = globalThis as unknown as {
    emitter: EventEmitter;
};

export const eventBus = globalForEmitter.emitter || new EventEmitter();
eventBus.setMaxListeners(500); // Allow many concurrent connections for the intranet TV screens/dashboards

if (process.env.NODE_ENV !== 'production') {
    globalForEmitter.emitter = eventBus;
}
