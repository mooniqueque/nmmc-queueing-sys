"use client";

import { useCallback, useEffect, useState } from "react";
import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";
import { removeVisitById, SSE_TOPICS, upsertVisitById } from "@/shared/lib/sse";

export function useReleasingQueue(initialQueue: VisitWithPatient[]) {
    const [queue, setQueue] = useState(initialQueue);

    useEffect(() => {
        setQueue(initialQueue);
    }, [initialQueue]);

    const handleLiveEvent = useCallback((event: { type: string; payload?: { visit?: VisitWithPatient; visitId?: string } }) => {
        if (event.type === "visit-upsert" && event.payload?.visit) {
            setQueue((current) => upsertVisitById(current, event.payload!.visit!));
            return;
        }

        if (event.type === "visit-remove" && event.payload?.visitId) {
            setQueue((current) => removeVisitById(current, event.payload!.visitId!));
        }
    }, []);

    useLiveQueue(SSE_TOPICS.WINDOW, handleLiveEvent);

    const activeQueue = queue.filter(v => 
        v.status === "WAITING_WINDOW" || 
        v.status === "IN_WINDOW" || 
        v.status === "NO_SHOW"
    );

    return { activeQueue };
}
