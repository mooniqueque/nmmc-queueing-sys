import { EventEmitter } from 'events';

// In Next.js (especially development), hot reloading clears singletons.
// We use a global symbol to preserve the emitter instance across module reloads.
const globalForEmitter = globalThis as unknown as {
    emitter: EventEmitter;
};

export const eventBus = globalForEmitter.emitter || new EventEmitter();
eventBus.setMaxListeners(50); // Optional: Allow more concurrent connections if needed

if (process.env.NODE_ENV !== 'production') {
    globalForEmitter.emitter = eventBus;
}
