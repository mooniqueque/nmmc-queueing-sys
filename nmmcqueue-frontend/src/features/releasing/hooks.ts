"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/hooks/use-live-queue";

export function useReleasingQueue(initialQueue: VisitWithPatient[]) {
    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useLiveQueue();

    const activeQueue = initialQueue.filter(v => v.status === "WAITING_WINDOW");

    return { activeQueue };
}
