"use client";

import { useCallback, useEffect, useState } from "react";
import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";
import { removeVisitById, SSE_TOPICS, upsertVisitById } from "@/shared/lib/sse";

export function useClinicQueue(departmentId: string, initialQueue: VisitWithPatient[]) {
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

    const activeQueue = queue;

    useLiveQueue(SSE_TOPICS.department(departmentId), handleLiveEvent);

    return { activeQueue };
}
