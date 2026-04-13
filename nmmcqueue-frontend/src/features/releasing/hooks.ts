"use client";

import { useCallback, useEffect, useState } from "react";
import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";
import { removeVisitById, SSE_TOPICS, upsertVisitById } from "@/shared/lib/sse";

const isOwnedWindowNoShow = (visit: VisitWithPatient, userId?: string) =>
    visit.status === "NO_SHOW" &&
    Boolean(visit.sequenceKey?.startsWith("WINDOW_")) &&
    Boolean(userId) &&
    visit.calledByUserId === userId;

export function useReleasingQueue(initialQueue: VisitWithPatient[], userId?: string) {
    const [queue, setQueue] = useState(initialQueue);

    useEffect(() => {
        setQueue(initialQueue);
    }, [initialQueue]);

    const handleLiveEvent = useCallback((event: { type: string; payload?: { visit?: VisitWithPatient; visitId?: string } }) => {
        if (event.type === "visit-upsert" && event.payload?.visit) {
            const visit = event.payload.visit;

            if (visit.status === "NO_SHOW" && Boolean(visit.sequenceKey?.startsWith("WINDOW_"))) {
                if (!isOwnedWindowNoShow(visit, userId)) {
                    setQueue((current) => removeVisitById(current, visit.id));
                    return;
                }
            }

            setQueue((current) => upsertVisitById(current, visit));
            return;
        }

        if (event.type === "visit-remove" && event.payload?.visitId) {
            setQueue((current) => removeVisitById(current, event.payload!.visitId!));
        }
    }, [userId]);

    useLiveQueue(SSE_TOPICS.WINDOW, handleLiveEvent);

    const activeQueue = queue.filter((visit) => {
        if (visit.status === "WAITING_WINDOW" || visit.status === "IN_WINDOW") return true;
        if (visit.status === "NO_SHOW" && visit.sequenceKey?.startsWith("WINDOW_")) {
            return isOwnedWindowNoShow(visit, userId);
        }
        return false;
    });

    return { activeQueue };
}
