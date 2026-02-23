import { eventBus } from '@/lib/sse-emitter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Basic authorization check could go here if needed

    // Set up SSE headers
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
    });

    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection payload (optional, but good for tracking)
            controller.enqueue(`data: {"type": "connected"}\n\n`);

            // The listener function
            const onQueueUpdate = () => {
                // We format the message precisely as Server-Sent Events require
                // `data: { JSON Object }\n\n`
                controller.enqueue(`data: {"type": "queue-updated", "timestamp": "${new Date().toISOString()}"}\n\n`);
            };

            // Subscribe to the global emitter
            eventBus.on('queue-updated', onQueueUpdate);

            // If the client disconnects, clean up the listener to prevent memory leaks
            request.signal.addEventListener('abort', () => {
                eventBus.off('queue-updated', onQueueUpdate);
            });
        }
    });

    return new Response(stream, { headers });
}
