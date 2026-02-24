"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VisitWithPatient } from "../_types";

export type TabType = "ACTIVE" | "NO_SHOW";

export function useTriageQueue(initialQueue: VisitWithPatient[]) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");

    const activeQueue = initialQueue.filter(v => v.status === "KIOSK_SUBMITTED");
    const noShowQueue = initialQueue.filter(v => v.status === "NO_SHOW");

    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useEffect(() => {
        const eventSource = new EventSource('/api/stream/queue');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    // Refresh the Server Component payload without losing local state
                    router.refresh();
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
        };
    }, [router]);

    return {
        activeQueue,
        noShowQueue,
        activeTab,
        setActiveTab
    };
}
