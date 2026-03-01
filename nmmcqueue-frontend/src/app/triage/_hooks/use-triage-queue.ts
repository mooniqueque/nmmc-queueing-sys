"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VisitWithPatient } from "../_types";

export type TabType = "ACTIVE" | "NO_SHOW";

export function useTriageQueue(initialQueue: VisitWithPatient[]) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");

    const activeQueue = initialQueue.filter(v => v.status === "KIOSK_SUBMITTED");
    const noShowQueue = initialQueue.filter(v => v.status === "NO_SHOW");

    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useEffect(() => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const eventSource = new EventSource(`${backendUrl}/monitor/stream`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    // Debounce router.refresh to prevent spamming the Next.js server during high traffic
                    if (refreshTimeoutRef.current) {
                        clearTimeout(refreshTimeoutRef.current);
                    }
                    refreshTimeoutRef.current = setTimeout(() => {
                        router.refresh();
                    }, 1000);
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
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [router]);

    return {
        activeQueue,
        noShowQueue,
        activeTab,
        setActiveTab
    };
}
