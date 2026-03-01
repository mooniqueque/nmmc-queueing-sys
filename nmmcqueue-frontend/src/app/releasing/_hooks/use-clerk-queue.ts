"use client";

import { VisitWithPatient } from "@/app/triage/_types";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useClerkQueue(initialQueue: VisitWithPatient[]) {
    const router = useRouter();
    const activeQueue = initialQueue.filter(v => v.status === "WAITING_WINDOW");
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useEffect(() => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const eventSource = new EventSource(`${backendUrl}/monitor/stream`, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
                    refreshTimeoutRef.current = setTimeout(() => router.refresh(), 1000);
                }
            } catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [router]);

    return { activeQueue };
}
