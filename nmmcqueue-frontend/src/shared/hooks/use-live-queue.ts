"use client";

import { useEffect } from "react";

import { API_URL } from "@/lib/api";
import { SseMessage } from "@/shared/lib/sse";

/**
 * A generic hook to subscribe to the backend SSE stream 
 * and trigger a router refresh when updates occur.
 * 
 * @param topic Optional filter parameter (e.g. a department ID)
 */
export function useLiveQueue<T = unknown>(topic: string, onEvent: (event: SseMessage<T>) => void) {

    useEffect(() => {
        const url = `${API_URL}/monitor/stream?topic=${encodeURIComponent(topic)}`;

        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as SseMessage<T>;
                if (data.type !== "connected") {
                    onEvent(data);
                }
            } catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };

        eventSource.onerror = () => {
            // Don't close — EventSource auto-reconnects on transient errors.
            // Only close if we want to permanently disconnect (handled in cleanup).
        };

        return () => {
            eventSource.close();
        };
    }, [onEvent, topic]);
}
