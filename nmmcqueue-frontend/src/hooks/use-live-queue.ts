"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { API_URL } from "@/lib/api";

/**
 * A generic hook to subscribe to the backend SSE stream 
 * and trigger a router refresh when updates occur.
 * 
 * @param topic Optional filter parameter (e.g. a department ID)
 */
export function useLiveQueue(topic?: string) {
    const router = useRouter();
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const backendUrl = API_URL;
        
        // Append topic if we are listening to a specific department
        const url = topic 
            ? `${backendUrl}/monitor/stream?topic=${encodeURIComponent(topic)}`
            : `${backendUrl}/monitor/stream`;
            
        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
                    // Debounce router.refresh to prevent spamming the Next.js server during high traffic
                    refreshTimeoutRef.current = setTimeout(() => router.refresh(), 1000);
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
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [router, topic]); 
}
