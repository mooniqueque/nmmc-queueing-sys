"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";

export function useReleasingQueue(initialQueue: VisitWithPatient[]) {
    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useLiveQueue('WINDOW');

    const activeQueue = initialQueue.filter(v => 
        v.status === "WAITING_WINDOW" || 
        v.status === "IN_WINDOW" || 
        v.status === "NO_SHOW"
    );

    return { activeQueue };
}
